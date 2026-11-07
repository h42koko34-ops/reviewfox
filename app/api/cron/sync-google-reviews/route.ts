// File: app/api/cron/sync-google-reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { matchReviewToClaims } from '@/lib/ai/review-matcher';
import type { ActualReview, ClaimStatus, Company, PreClaim } from '@/lib/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

async function getAccessTokenFromRefresh(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // حماية مسار الـ Cron عبر CRON_SECRET في Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. جلب كل الشركات النشطة التي قامت بربط حساب جوجل
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('*')
      .eq('status', 'active')
      .not('google_refresh_token', 'is', null);

    if (compError || !companies || companies.length === 0) {
      return NextResponse.json({ success: true, message: 'No connected active companies found.', synced: 0 });
    }

    let totalNewReviewsSynced = 0;

    for (const rawCompany of companies) {
      const company = rawCompany as Company & {
        google_refresh_token?: string | null;
        google_location_name?: string | null;
      };

      if (!company.google_refresh_token) continue;

      const accessToken = await getAccessTokenFromRefresh(company.google_refresh_token);
      if (!accessToken) continue;

      // جلب الحسابات والمواقع من Google Business Profile
      let locationPath = company.google_location_name;

      if (!locationPath) {
        const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const accountsData = await accountsRes.json().catch(() => null);
        const firstAccountName = accountsData?.accounts?.[0]?.name;

        if (firstAccountName) {
          const locRes = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${firstAccountName}/locations?readMask=name,title`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const locData = await locRes.json().catch(() => null);
          const firstLocationName = locData?.locations?.[0]?.name;

          if (firstLocationName) {
            locationPath = `${firstAccountName}/${firstLocationName}`;
          }
        }
      }

      if (!locationPath) continue;

      // 2. جلب أحدث التقييمات من موقع الشركة على جوجل
      const reviewsRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${locationPath}/reviews?pageSize=20`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!reviewsRes.ok) continue;
      const reviewsData = await reviewsRes.json().catch(() => null);
      const googleReviews: any[] = reviewsData?.reviews ?? [];

      for (const gReview of googleReviews) {
        const reviewerName = gReview?.reviewer?.displayName?.trim() || 'Google User';
        const reviewText = (gReview?.comment || '').trim();
        const rating = STAR_RATING_MAP[gReview?.starRating] ?? 5;
        const reviewDateIso = gReview?.createTime
          ? new Date(gReview.createTime).toISOString()
          : new Date().toISOString();

        // التأكد من عدم معالجة نفس التقييم مسبقاً
        const { data: existing } = await supabase
          .from('actual_reviews')
          .select('id')
          .eq('company_id', company.id)
          .eq('reviewer_name', reviewerName)
          .eq('review_date', reviewDateIso)
          .maybeSingle();

        if (existing) continue;

        // جلب المطالبات المعلقة وآخر التقييمات للمطابقة بالذكاء الاصطناعي
        const [{ data: pendingClaims }, { data: recentReviews }] = await Promise.all([
          supabase
            .from('pre_claims')
            .select('*')
            .eq('company_id', company.id)
            .eq('status', 'pending')
            .lt('created_at', reviewDateIso)
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('actual_reviews')
            .select('reviewer_name, review_text, rating, review_date, is_suspicious')
            .eq('company_id', company.id)
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

        const candidateClaims = (pendingClaims ?? []) as PreClaim[];

        const aiResult = await matchReviewToClaims({
          review: { reviewer_name: reviewerName, review_text: reviewText, rating, review_date: reviewDateIso },
          candidateClaims,
          enabledFeatures: company.enabled_features,
          recentReviews: (recentReviews ?? []) as Pick<
            ActualReview,
            'reviewer_name' | 'review_text' | 'rating' | 'review_date' | 'is_suspicious'
          >[],
        });

        const validMatchedClaimId =
          aiResult.matched_claim_id && candidateClaims.some((c) => c.id === aiResult.matched_claim_id)
            ? aiResult.matched_claim_id
            : null;

        const { error: insertError } = await supabase.from('actual_reviews').insert({
          company_id: company.id,
          reviewer_name: reviewerName,
          review_text: reviewText,
          rating,
          review_date: reviewDateIso,
          matched_claim_id: validMatchedClaimId,
          ai_confidence: aiResult.confidence,
          ai_reasoning_ar: aiResult.ai_reasoning_ar,
          ai_reasoning_en: aiResult.ai_reasoning_en,
          is_suspicious: aiResult.is_suspicious,
        });

        if (insertError) continue;
        totalNewReviewsSynced += 1;

        if (validMatchedClaimId) {
          let nextStatus: Extract<ClaimStatus, 'matched' | 'needs_review' | 'fraud_flagged'> = 'needs_review';
          if (aiResult.is_suspicious) nextStatus = 'fraud_flagged';
          else if (aiResult.confidence >= 70) nextStatus = 'matched';

          await supabase
            .from('pre_claims')
            .update({ status: nextStatus })
            .eq('id', validMatchedClaimId)
            .eq('company_id', company.id)
            .eq('status', 'pending');
        }
      }
    }

    return NextResponse.json({ success: true, synced: totalNewReviewsSynced });
  } catch (err) {
    console.error('[ReviewFox Cron Error]:', err);
    return NextResponse.json({ error: 'Cron sync failed' }, { status: 500 });
  }
}
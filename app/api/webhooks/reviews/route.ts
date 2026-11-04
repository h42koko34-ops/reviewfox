// File: app/api/webhooks/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { matchReviewToClaims } from '@/lib/ai/review-matcher';
import type { ActualReview, ClaimStatus, Company, PreClaim } from '@/lib/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface WebhookPayload {
  reviewer_name: string;
  review_text: string;
  rating: number;
  review_date: string;
}

// حماية ضد الإغراق (Rate Limit): بحد أقصى 30 تقييم في الدقيقة لكل شركة
const webhookRateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_WEBHOOKS_PER_MINUTE = 30;

function checkWebhookRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = webhookRateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    webhookRateLimit.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= MAX_WEBHOOKS_PER_MINUTE) return false;
  entry.count += 1;
  return true;
}

function isValidPayload(body: unknown): body is WebhookPayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.reviewer_name === 'string' &&
    b.reviewer_name.trim().length > 0 &&
    b.reviewer_name.trim().length <= 150 &&
    typeof b.review_text === 'string' &&
    b.review_text.length <= 4000 &&
    typeof b.rating === 'number' &&
    Number.isFinite(b.rating) &&
    typeof b.review_date === 'string' &&
    !Number.isNaN(Date.parse(b.review_date))
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. التحقق من وجود وصحة مفتاح الـ Webhook السري
    const secret = request.headers.get('x-reviewfox-webhook-secret')?.trim();
    if (!secret || secret.length < 16 || secret.length > 256) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing webhook secret.' }, { status: 401 });
    }

    if (!checkWebhookRateLimit(secret)) {
      return NextResponse.json({ error: 'Too many webhook requests. Please slow down.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!isValidPayload(body)) {
      return NextResponse.json(
        { error: 'Invalid payload. Required: reviewer_name (<=150 chars), review_text (<=4000 chars), rating, review_date.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('webhook_secret', secret)
      .eq('status', 'active')
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Invalid webhook secret or inactive company.' }, { status: 401 });
    }

    const typedCompany = company as Company;
    const reviewerName = body.reviewer_name.trim();
    const reviewText = body.review_text.trim();
    const reviewDateIso = new Date(body.review_date).toISOString();
    const rating = Math.min(Math.max(Math.round(body.rating), 1), 5);

    // 2. فحص مبكر للتكرار قبل استهلاك رصيد الذكاء الاصطناعي (Idempotency Check)
    const { data: existingReview } = await supabase
      .from('actual_reviews')
      .select('id')
      .eq('company_id', typedCompany.id)
      .eq('reviewer_name', reviewerName)
      .eq('review_date', reviewDateIso)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json({ success: true, duplicate: true }, { status: 200 });
    }

    // 3. جلب المطالبات المعلقة وآخر 20 تقييم في نفس اللحظة (Parallel) لتسريع الرد
    const [{ data: pendingClaims, error: claimsError }, { data: recentReviews }] = await Promise.all([
      supabase
        .from('pre_claims')
        .select('*')
        .eq('company_id', typedCompany.id)
        .eq('status', 'pending')
        .lt('created_at', reviewDateIso)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('actual_reviews')
        .select('reviewer_name, review_text, rating, review_date, is_suspicious')
        .eq('company_id', typedCompany.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (claimsError) {
      console.error('[ReviewFox][webhook/reviews] Claims query error:', claimsError.message);
      return NextResponse.json({ error: 'Failed to retrieve pending claims.' }, { status: 500 });
    }

    const candidateClaims = (pendingClaims ?? []) as PreClaim[];

    // 4. تشغيل الذكاء الاصطناعي للمطابقة وكشف التلاعب
    const aiResult = await matchReviewToClaims({
      review: { reviewer_name: reviewerName, review_text: reviewText, rating, review_date: reviewDateIso },
      candidateClaims,
      enabledFeatures: typedCompany.enabled_features,
      recentReviews: (recentReviews ?? []) as Pick<
        ActualReview,
        'reviewer_name' | 'review_text' | 'rating' | 'review_date' | 'is_suspicious'
      >[],
    });

    // التأكد الأمني من أن الـ ID الذي أرجعه الذكاء الاصطناعي ينتمي فعلاً لقائمة المطالبات المرشحة
    const validMatchedClaimId =
      aiResult.matched_claim_id && candidateClaims.some((c) => c.id === aiResult.matched_claim_id)
        ? aiResult.matched_claim_id
        : null;

    // 5. حفظ التقييم في قاعدة البيانات
    const { data: insertedReview, error: insertError } = await supabase
      .from('actual_reviews')
      .insert({
        company_id: typedCompany.id,
        reviewer_name: reviewerName,
        review_text: reviewText,
        rating,
        review_date: reviewDateIso,
        matched_claim_id: validMatchedClaimId,
        ai_confidence: aiResult.confidence,
        ai_reasoning_ar: aiResult.ai_reasoning_ar,
        ai_reasoning_en: aiResult.ai_reasoning_en,
        is_suspicious: aiResult.is_suspicious,
      })
      .select('*')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ success: true, duplicate: true }, { status: 200 });
      }
      console.error('[ReviewFox][webhook/reviews] Insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to save review.' }, { status: 500 });
    }

    // 6. تحديث حالة المطالبة إذا تم العثور على تطابق صحيح
    if (validMatchedClaimId) {
      let nextStatus: Extract<ClaimStatus, 'matched' | 'needs_review' | 'fraud_flagged'>;

      if (aiResult.is_suspicious) {
        nextStatus = 'fraud_flagged';
      } else if (aiResult.confidence >= 70) {
        nextStatus = 'matched';
      } else {
        nextStatus = 'needs_review';
      }

      const { error: updateError } = await supabase
        .from('pre_claims')
        .update({ status: nextStatus })
        .eq('id', validMatchedClaimId)
        .eq('company_id', typedCompany.id)
        .eq('status', 'pending');

      if (updateError) {
        console.error('[ReviewFox][webhook/reviews] Claim update error:', updateError.message);
        return NextResponse.json(
          { success: true, review: insertedReview, claimUpdateWarning: 'Could not update claim status.' },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ success: true, review: insertedReview, ai: aiResult }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected webhook error.';
    console.error('[ReviewFox][webhook/reviews]', message);
    return NextResponse.json({ error: 'Internal server error processing webhook.' }, { status: 500 });
  }
}
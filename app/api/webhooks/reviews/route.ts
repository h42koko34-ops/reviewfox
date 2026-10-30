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

function isValidPayload(body: unknown): body is WebhookPayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.reviewer_name === 'string' &&
    b.reviewer_name.trim().length > 0 &&
    typeof b.review_text === 'string' &&
    typeof b.rating === 'number' &&
    typeof b.review_date === 'string' &&
    !Number.isNaN(Date.parse(b.review_date))
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the tenant via its webhook_secret (server-to-server call,
    //    no Supabase Auth session exists here — this is why we use the
    //    service_role client, AFTER manually verifying the secret below).
    const secret = request.headers.get('x-reviewfox-webhook-secret');
    if (!secret) {
      return NextResponse.json({ error: 'Missing x-reviewfox-webhook-secret header.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!isValidPayload(body)) {
      return NextResponse.json(
        { error: 'Invalid payload. Required: reviewer_name, review_text, rating, review_date.' },
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
    const reviewDateIso = new Date(body.review_date).toISOString();
    const rating = Math.min(Math.max(Math.round(body.rating), 1), 5);

    // 2. Fetch all pending pre_claims created BEFORE this review arrived.
    const { data: pendingClaims, error: claimsError } = await supabase
      .from('pre_claims')
      .select('*')
      .eq('company_id', typedCompany.id)
      .eq('status', 'pending')
      .lt('created_at', reviewDateIso)
      .order('created_at', { ascending: false })
      .limit(50);

    if (claimsError) {
      return NextResponse.json({ error: claimsError.message }, { status: 500 });
    }

    // 3. Fetch last 20 reviews for fraud-pattern context.
    const { data: recentReviews } = await supabase
      .from('actual_reviews')
      .select('reviewer_name, review_text, rating, review_date, is_suspicious')
      .eq('company_id', typedCompany.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // 4. Run the multi-signal AI matching & fraud analysis.
    const aiResult = await matchReviewToClaims({
      review: { reviewer_name: body.reviewer_name, review_text: body.review_text, rating, review_date: reviewDateIso },
      candidateClaims: (pendingClaims ?? []) as PreClaim[],
      enabledFeatures: typedCompany.enabled_features,
      recentReviews: (recentReviews ?? []) as Pick<
        ActualReview,
        'reviewer_name' | 'review_text' | 'rating' | 'review_date' | 'is_suspicious'
      >[],
    });

    // 5. Persist the review (content_hash unique index guards against duplicate deliveries).
    const { data: insertedReview, error: insertError } = await supabase
      .from('actual_reviews')
      .insert({
        company_id: typedCompany.id,
        reviewer_name: body.reviewer_name,
        review_text: body.review_text,
        rating,
        review_date: reviewDateIso,
        matched_claim_id: aiResult.matched_claim_id,
        ai_confidence: aiResult.confidence,
        ai_reasoning_ar: aiResult.ai_reasoning_ar,
        ai_reasoning_en: aiResult.ai_reasoning_en,
        is_suspicious: aiResult.is_suspicious,
      })
      .select('*')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        // Already processed this exact review before — idempotent success.
        return NextResponse.json({ success: true, duplicate: true }, { status: 200 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 6. Deterministically derive and apply the pre_claim's new status.
    //    (Thresholds are controlled server-side, not by the AI, for auditability.)
    if (aiResult.matched_claim_id) {
      let nextStatus: Extract<ClaimStatus, 'matched' | 'needs_review' | 'fraud_flagged'>;

      if (aiResult.is_suspicious) {
        nextStatus = 'fraud_flagged';
      } else if (aiResult.confidence >= 70) {
        nextStatus = 'matched';
      } else {
        nextStatus = 'needs_review';
      }

      // Triggers from Step 1 (reward_employee_on_match) fire automatically here.
      const { error: updateError } = await supabase
        .from('pre_claims')
        .update({ status: nextStatus })
        .eq('id', aiResult.matched_claim_id)
        .eq('company_id', typedCompany.id)
        .eq('status', 'pending'); // prevents racing/overwriting an already-processed claim

      if (updateError) {
        return NextResponse.json(
          { success: true, review: insertedReview, claimUpdateError: updateError.message },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ success: true, review: insertedReview, ai: aiResult }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected webhook error.';
    console.error('[ReviewFox][webhook/reviews]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
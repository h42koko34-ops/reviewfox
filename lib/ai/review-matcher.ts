// File: lib/ai/review-matcher.ts
import { Type } from '@google/genai';
import { getGeminiClient } from './gemini-client';
import type { ActualReview, EnabledFeatures, PreClaim, Profile } from '@/lib/types/database';

export interface MatchReviewInput {
  review: { reviewer_name: string; review_text: string; rating: number; review_date: string };
  candidateClaims: (PreClaim & { employee?: Pick<Profile, 'full_name' | 'employee_promo_code' | 'phone' | 'desk_number'> })[];
  enabledFeatures: EnabledFeatures;
  recentReviews: Pick<ActualReview, 'reviewer_name' | 'review_text' | 'rating' | 'review_date' | 'is_suspicious'>[];
}

export interface MatchReviewResult {
  matched_claim_id: string | null;
  confidence: number;
  is_suspicious: boolean;
  ai_reasoning_ar: string;
  ai_reasoning_en: string;
}

const NO_CANDIDATES_RESULT: MatchReviewResult = {
  matched_claim_id: null,
  confidence: 0,
  is_suspicious: false,
  ai_reasoning_ar: 'لا توجد مطالبات معلقة متاحة لمطابقة هذا التقييم معها في الوقت الحالي.',
  ai_reasoning_en: 'No pending pre-claims were available to match against this review at this time.',
};

const FALLBACK_ERROR_RESULT: MatchReviewResult = {
  matched_claim_id: null,
  confidence: 0,
  is_suspicious: false,
  ai_reasoning_ar: 'تعذر إجراء تحليل الذكاء الاصطناعي حاليًا؛ يوصى بالمراجعة اليدوية لهذا التقييم.',
  ai_reasoning_en: 'AI analysis was temporarily unavailable; manual review of this review is recommended.',
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    matched_claim_id: {
      type: Type.STRING,
      nullable: true,
      description: 'The id of the single best-matching candidate pre-claim, or null if none reasonably match.',
    },
    confidence: { type: Type.NUMBER, description: 'Match confidence, 0 to 100.' },
    is_suspicious: {
      type: Type.BOOLEAN,
      description: 'True if this review and/or its matched claim shows signs of fraud, farming, or manipulation.',
    },
    ai_reasoning_ar: { type: Type.STRING, description: 'Concise reasoning written fully in Arabic.' },
    ai_reasoning_en: { type: Type.STRING, description: 'Concise reasoning written fully in English.' },
  },
  required: ['matched_claim_id', 'confidence', 'is_suspicious', 'ai_reasoning_ar', 'ai_reasoning_en'],
};

function buildPrompt(input: MatchReviewInput): string {
  const { review, candidateClaims, enabledFeatures, recentReviews } = input;

  const claimsForPrompt = candidateClaims.map((c) => ({
    id: c.id,
    expected_client_name: c.expected_client_name,
    invoice_number: c.invoice_number,
    invoice_timestamp: c.invoice_timestamp,
    verification_code: c.verification_code,
    service_notes: c.service_notes,
    voice_transcript: c.voice_transcript,
    quick_tags: c.quick_tags,
    ocr_captured_name: c.ocr_captured_name,
    client_phone: c.client_phone,
    qr_scanned_at: c.qr_scanned_at,
    created_at: c.created_at,
    // بيانات الفني المرتبط بالمطالبة (الاسم، الكود، الهاتف، رقم المكتب) ليتعرف عليها الذكاء الاصطناعي
    employee_info: c.employee ? {
      name: c.employee.full_name,
      promo_code: c.employee.employee_promo_code,
      phone: c.employee.phone,
      desk: c.employee.desk_number,
    } : null,
  }));

  const recentReviewsForPrompt = recentReviews.map((r) => ({
    reviewer_name: r.reviewer_name,
    review_text_excerpt: (r.review_text ?? '').slice(0, 220),
    rating: r.rating,
    review_date: r.review_date,
    was_flagged_suspicious: r.is_suspicious,
  }));

  return `
You are ReviewFox's Anti-Fraud AI Matching Engine. Analyze ONE new public review and determine which (if any) employee-submitted pre-claim it corresponds to, and whether the review/claim pair shows signs of fraud.

### CONTEXT: Company's enabled verification features (only trust signals from ENABLED features; treat data from disabled features as noise even if present)
${JSON.stringify(enabledFeatures, null, 2)}

### THE NEW REVIEW TO ANALYZE
${JSON.stringify(review, null, 2)}

### CANDIDATE PENDING PRE-CLAIMS (submitted by employees before this review arrived, newest first)
${JSON.stringify(claimsForPrompt, null, 2)}

### LAST 20 REVIEWS FOR THIS COMPANY (context only — detect duplicate wording, review farming, rating manipulation patterns)
${JSON.stringify(recentReviewsForPrompt, null, 2)}

### MATCHING RULES
1. Compare reviewer_name against each claim's expected_client_name and ocr_captured_name (allow minor spelling/transliteration variance between Arabic and English).
2. Check if the review_text mentions the employee's name (employee_info.name), employee promo code (employee_info.promo_code), or desk number — if a review explicitly praises a specific technician or mentions their code/name, give it an extremely strong positive matching signal.
3. Favor claims created shortly before the review over ones created days earlier (timing proximity signal).
4. If quick_tags sentiment conflicts strongly with the review's rating/text (e.g. tag says "negative" but review is a glowing 5-star), lower confidence and consider flagging suspicious.
5. If voice_transcript or service_notes thematically matches the review_text's content, increase confidence.
6. If a verification_code or distinctive claim detail appears literally inside review_text, treat it as a STRONG positive signal.
7. Select at most ONE best-matching claim (highest overall evidence), or null if none reasonably match.
8. Mark is_suspicious = true if: review text is near-identical/templated to one of the last 20 reviews, the reviewer name looks generic/fake, the sentiment contradicts the matched claim's signals, or a reward-farming pattern is evident (multiple similarly-worded reviews in a short span).
9. Fraud detection happens AFTER matching — if is_suspicious is true, still return the matched_claim_id if one exists.

### OUTPUT
Return ONLY the structured JSON matching the schema. ai_reasoning_ar must be fully in Arabic and ai_reasoning_en fully in English — both explaining the SAME conclusion in 1-3 concise sentences a non-technical business owner can understand.
`.trim();
}

export async function matchReviewToClaims(input: MatchReviewInput): Promise<MatchReviewResult> {
  if (input.candidateClaims.length === 0) {
    return NO_CANDIDATES_RESULT;
  }

  try {
    const client = getGeminiClient();
    const prompt = buildPrompt(input);

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    });

    const rawText = response.text;
    if (!rawText) return FALLBACK_ERROR_RESULT;

    const parsed = JSON.parse(rawText) as Partial<MatchReviewResult>;

    const validClaimIds = new Set(input.candidateClaims.map((c) => c.id));
    const matchedClaimId =
      typeof parsed.matched_claim_id === 'string' && validClaimIds.has(parsed.matched_claim_id)
        ? parsed.matched_claim_id
        : null;

    const confidence =
      typeof parsed.confidence === 'number' ? Math.min(Math.max(Math.round(parsed.confidence), 0), 100) : 0;

    return {
      matched_claim_id: matchedClaimId,
      confidence: matchedClaimId ? confidence : 0,
      is_suspicious: Boolean(parsed.is_suspicious),
      ai_reasoning_ar: parsed.ai_reasoning_ar?.trim() || FALLBACK_ERROR_RESULT.ai_reasoning_ar,
      ai_reasoning_en: parsed.ai_reasoning_en?.trim() || FALLBACK_ERROR_RESULT.ai_reasoning_en,
    };
  } catch (err) {
    console.error('[ReviewFox][review-matcher] Gemini matching failed:', err);
    return FALLBACK_ERROR_RESULT;
  }
}
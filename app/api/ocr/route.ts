// File: app/api/ocr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractFromImage } from '@/lib/ai/ocr-extractor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the caller as an active employee of an active company.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id, is_active')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'employee' || !profile.company_id || !profile.is_active) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('enabled_features, status')
      .eq('id', profile.company_id)
      .single();

    if (!company || company.status !== 'active') {
      return NextResponse.json({ error: 'Your company account has been suspended.' }, { status: 403 });
    }

    // 2. Enforce the Super Admin's feature lock — ocr_scanner must be enabled.
    if (!company.enabled_features?.ocr_scanner) {
      return NextResponse.json(
        { error: 'OCR Scanner has been locked by the ReviewFox Admin for your company.' },
        { status: 403 }
      );
    }

    // 3. Validate payload.
    const body = await request.json().catch(() => null);
    if (!body || typeof body.imageBase64 !== 'string' || typeof body.mimeType !== 'string') {
      return NextResponse.json({ error: 'imageBase64 and mimeType are required.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(body.mimeType)) {
      return NextResponse.json({ error: 'Unsupported image type. Use JPEG, PNG, or WebP.' }, { status: 400 });
    }

    const approxBytes = Math.ceil((body.imageBase64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 8MB).' }, { status: 413 });
    }

    // 4. Run OCR extraction via Gemini.
    const result = await extractFromImage(body.imageBase64, body.mimeType);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OCR extraction failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
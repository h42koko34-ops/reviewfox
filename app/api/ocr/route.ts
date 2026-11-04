// File: app/api/ocr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractFromImage } from '@/lib/ai/ocr-extractor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB كحد أقصى (بعد ضغط الصورة في المتصفح)
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// حماية سريعة (Rate Limiter) لمنع إرسال أكثر من 5 طلبات في الدقيقة لكل موظف
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQ_PER_MINUTE = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= MAX_REQ_PER_MINUTE) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // 1. التحقق السريع من جلسة المستخدم
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user ?? (await supabase.auth.getUser()).data.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // 2. فحص Rate Limit لمنع استنزاف رصيد Gemini API
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many scan requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const adminClient = createAdminClient();

    // 3. جلب بيانات الموظف: التحقق من الصلاحية والشركة
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'employee' || !profile.company_id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // 4. جلب بيانات الشركة وعدد مطالبات الموظف اليوم في نفس اللحظة (Parallel)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [{ data: company }, { count: todayClaimsCount }] = await Promise.all([
      adminClient
        .from('companies')
        .select('enabled_features, status, max_daily_claims_per_employee')
        .eq('id', profile.company_id)
        .single(),
      adminClient
        .from('pre_claims')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .gte('created_at', startOfToday.toISOString()),
    ]);

    if (!company || company.status !== 'active') {
      return NextResponse.json({ error: 'Your company account has been suspended.' }, { status: 403 });
    }

    // 5. التأكد من أن ميزة OCR مفعلة للشركة
    if (!company.enabled_features?.ocr_scanner) {
      return NextResponse.json(
        { error: 'OCR Scanner has been locked by the ReviewFox Admin for your company.' },
        { status: 403 }
      );
    }

    // 6. حماية إضافية: منع استهلاك الـ OCR إذا وصل الموظف للحد اليومي للمطالبات
    if (
      typeof company.max_daily_claims_per_employee === 'number' &&
      (todayClaimsCount ?? 0) >= company.max_daily_claims_per_employee
    ) {
      return NextResponse.json(
        { error: 'Daily claim limit reached. Cannot scan more invoices today.' },
        { status: 429 }
      );
    }

    // 7. التحقق من صحة البيانات والصورة المرسلة
    const body = await request.json().catch(() => null);
    if (!body || typeof body.imageBase64 !== 'string' || typeof body.mimeType !== 'string') {
      return NextResponse.json({ error: 'imageBase64 and mimeType are required.' }, { status: 400 });
    }

    const cleanBase64 = body.imageBase64.trim();
    if (!cleanBase64 || cleanBase64.length < 100) {
      return NextResponse.json({ error: 'Invalid or empty image payload.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(body.mimeType)) {
      return NextResponse.json({ error: 'Unsupported image type. Use JPEG, PNG, or WebP.' }, { status: 400 });
    }

    const approxBytes = Math.ceil((cleanBase64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 4MB).' }, { status: 413 });
    }

    // 8. تشغيل الذكاء الاصطناعي لاستخراج بيانات الفاتورة
    const result = await extractFromImage(cleanBase64, body.mimeType);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    console.error('[ReviewFox OCR Error]:', err);
    return NextResponse.json(
      { error: 'Failed to process invoice image. Please try again with a clearer photo.' },
      { status: 500 }
    );
  }
}
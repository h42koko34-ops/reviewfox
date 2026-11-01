import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const companyId = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code || !companyId) {
    return NextResponse.redirect(`${appUrl}/super-admin?google_error=access_denied`);
  }

  try {
    // 1. استبدال الكود المؤقت بمفتاح الوصول الدائم (Refresh Token)
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Google Token Error:', tokenData);
      return NextResponse.redirect(`${appUrl}/super-admin?google_error=token_failed`);
    }

    // 2. جلب الإيميل الذي قام العميل بالربط من خلاله
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json();

    // 3. حفظ المفتاح الدائم والإيميل في جدول الشركات داخل Supabase
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updatePayload: Record<string, any> = {
      google_connected_email: userData.email || null,
      google_connected_at: new Date().toISOString(),
    };

    if (tokenData.refresh_token) {
      updatePayload.google_refresh_token = tokenData.refresh_token;
    }

    const { error: dbError } = await supabaseAdmin
      .from('companies')
      .update(updatePayload)
      .eq('id', companyId);

    if (dbError) {
      console.error('Supabase Update Error:', dbError);
      return NextResponse.redirect(`${appUrl}/super-admin?google_error=db_error`);
    }

    // 4. إعادة توجيه العميل للوحة التحكم مع رسالة نجاح
    return NextResponse.redirect(`${appUrl}/super-admin?google_connected=true`);
  } catch (err) {
    console.error('OAuth Callback Exception:', err);
    return NextResponse.redirect(`${appUrl}/super-admin?google_error=server_error`);
  }
}
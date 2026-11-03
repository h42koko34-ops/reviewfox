import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const rawState = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // فك بيانات رقم الشركة ومسار العودة (لوحة الشركة أو السوبر أدمن)
  let companyId = rawState || '';
  let returnTo = '/admin';

  if (rawState) {
    try {
      const parsed = JSON.parse(rawState);
      companyId = parsed.companyId;
      returnTo = parsed.returnTo || '/admin';
    } catch {
      companyId = rawState;
    }
  }

  if (error || !code || !companyId) {
    return NextResponse.redirect(`${appUrl}${returnTo}?google_error=access_denied`);
  }

  try {
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
      return NextResponse.redirect(`${appUrl}${returnTo}?google_error=token_failed`);
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json();

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
      return NextResponse.redirect(`${appUrl}${returnTo}?google_error=db_error`);
    }

    // يعيد مدير الشركة إلى لوحة تحكم شركته مباشرة مع رسالة النجاح
    return NextResponse.redirect(`${appUrl}${returnTo}?google_connected=true`);
  } catch (err) {
    console.error('OAuth Callback Exception:', err);
    return NextResponse.redirect(`${appUrl}${returnTo}?google_error=server_error`);
  }
}
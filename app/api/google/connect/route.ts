// File: app/api/google/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('companyId');
  const rawReturnTo = searchParams.get('returnTo') || '/dashboard';

  // حماية من ثغرة Open Redirect: التأكد من أن الرابط داخلي فقط
  const returnTo = rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') 
    ? rawReturnTo 
    : '/dashboard';

  if (!companyId) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  // التحقق الأمني: التأكد من أن المستخدم مسجل دخول ويملك صلاحية على هذه الشركة
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  const isAuthorized =
    profile?.role === 'super_admin' ||
    (profile?.role === 'company_admin' && profile?.company_id === companyId);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden: Unauthorized company access' }, { status: 403 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;

  const scopes = [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ');

  const statePayload = JSON.stringify({ companyId, returnTo, userId: user.id });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId!);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', statePayload);

  return NextResponse.redirect(authUrl.toString());
}
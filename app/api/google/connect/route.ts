import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;

  // الصلاحيات المطلوبة: إدارة وقراءة تقييمات Google Business ومعرفة إيميل الحساب
  const scopes = [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId!);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline'); // ضروري جداً للحصول على Refresh Token دائم
  authUrl.searchParams.set('prompt', 'consent'); // يجبر جوجل على إرسال Refresh Token في كل مرة
  authUrl.searchParams.set('state', companyId); // نمرر رقم الشركة هنا لنستلمه عند العودة

  return NextResponse.redirect(authUrl.toString());
}
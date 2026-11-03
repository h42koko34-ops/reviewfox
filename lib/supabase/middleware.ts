// File: lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. تحويل الرابط القديم فوراً بدون أي اتصال بقاعدة البيانات
  if (pathname.startsWith('/dashboard/employee')) {
    const url = request.nextUrl.clone();
    url.pathname = '/employee';
    return NextResponse.redirect(url);
  }

  // تجاهل مسارات الـ API والصفحات العامة تماماً لعدم إبطاء الموقع
  const isSuperAdminRoute = pathname.startsWith('/super-admin');
  const isCompanyRoute = pathname.startsWith('/dashboard');
  const isEmployeeRoute = pathname.startsWith('/employee');
  const isAuthRoute = pathname.startsWith('/login');

  if (!isSuperAdminRoute && !isCompanyRoute && !isEmployeeRoute && !isAuthRoute) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. قراءة الجلسة من الكوكيز محلياً في أجزاء من المللي ثانية بدلاً من getUser البطيئة
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  // 3. إذا لم يكن مسجلاً للدخول وحاول فتح لوحة محمية يحوله فوراً إلى /login
  if (!user && (isSuperAdminRoute || isCompanyRoute || isEmployeeRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 4. نستعلم عن الـ role فقط إذا كان المستخدم المسجل يقف على صفحة /login لتوجيهه
  // أما باقي الصفحات (/dashboard, /super-admin, /employee) فالـ layout الخاص بها يفحص الـ role بالفعل!
  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    const url = request.nextUrl.clone();
    url.pathname =
      role === 'super_admin'
        ? '/super-admin'
        : role === 'company_admin'
        ? '/dashboard'
        : '/employee';
    return NextResponse.redirect(url);
  }

  return response;
}
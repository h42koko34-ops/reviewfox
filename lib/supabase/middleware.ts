// File: lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isSuperAdminRoute = pathname.startsWith('/super-admin');
  const isCompanyRoute = pathname.startsWith('/dashboard');
  const isEmployeeRoute = pathname.startsWith('/employee');
  const isAuthRoute = pathname.startsWith('/login');

  // 1. إذا دخل على الرابط القديم /dashboard/employee يحوله فوراً إلى /employee
  if (pathname.startsWith('/dashboard/employee')) {
    const url = request.nextUrl.clone();
    url.pathname = '/employee';
    return NextResponse.redirect(url);
  }

  // 2. إذا لم يكن مسجلاً للدخول وحاول فتح أي لوحة محمية يحوله إلى /login
  if (!user && (isSuperAdminRoute || isCompanyRoute || isEmployeeRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 3. إذا كان مسجلاً للدخول، نتأكد من توجيهه للمسار المناسب لصلاحيته
  if (user && (isSuperAdminRoute || isCompanyRoute || isEmployeeRoute || isAuthRoute)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    const homeByRole =
      role === 'super_admin'
        ? '/super-admin'
        : role === 'company_admin'
        ? '/dashboard'
        : '/employee';

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = homeByRole;
      return NextResponse.redirect(url);
    }

    if (isSuperAdminRoute && role !== 'super_admin') {
      const url = request.nextUrl.clone();
      url.pathname = homeByRole;
      return NextResponse.redirect(url);
    }

    if (isCompanyRoute && role === 'employee') {
      const url = request.nextUrl.clone();
      url.pathname = '/employee';
      return NextResponse.redirect(url);
    }
  }

  return response;
}
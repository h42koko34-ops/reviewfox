// File: app/employee/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { EmployeeTopbar } from '@/components/employee/employee-topbar';
import { EmployeeBottomNav } from '@/components/employee/employee-bottom-nav';

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? (await supabase.auth.getUser()).data.user;

  if (!user) redirect('/login');

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, company_id, full_name, points, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'employee' || !profile.company_id) {
    redirect(profile?.role === 'super_admin' ? '/super-admin' : '/dashboard');
  }

  if (profile.is_active === false) {
    redirect('/suspended');
  }

  return (
    <div className="min-h-screen bg-transparent text-white transition-colors pb-24">
      <EmployeeTopbar fullName={profile.full_name ?? ''} points={profile.points} />
      <main className="relative z-10 mx-auto max-w-md px-4 py-6">{children}</main>
      <EmployeeBottomNav />
    </div>
  );
}
// File: app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DashboardNavbar } from '@/components/dashboard/dashboard-navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) redirect('/login');

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'company_admin' || !profile.company_id) {
    redirect(profile?.role === 'super_admin' ? '/super-admin' : '/employee');
  }

  const { data: company } = await adminClient
    .from('companies')
    .select('name, status')
    .eq('id', profile.company_id)
    .single();

  if (company?.status === 'suspended') {
    redirect('/suspended');
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <DashboardNavbar companyName={company?.name ?? ''} />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
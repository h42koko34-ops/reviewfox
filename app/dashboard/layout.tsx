// File: app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardNavbar } from '@/components/dashboard/dashboard-navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, company_id').eq('id', user.id).single();

  if (!profile || profile.role !== 'company_admin' || !profile.company_id) {
    redirect(profile?.role === 'super_admin' ? '/super-admin' : '/employee');
  }

  const { data: company } = await supabase.from('companies').select('name, status').eq('id', profile.company_id).single();

  if (company?.status === 'suspended') {
    redirect('/suspended');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <DashboardNavbar companyName={company?.name ?? ''} />
      <main>{children}</main>
    </div>
  );
}
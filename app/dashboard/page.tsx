// File: app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getDashboardBundle } from './actions';
import { DashboardClient, type CompanyWithGoogle } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const result = await getDashboardBundle();

  if (!result.success || !result.company || !result.employees || !result.claims) {
    redirect('/login');
  }

  return (
    <DashboardClient
      company={result.company as CompanyWithGoogle}
      employees={result.employees}
      claims={result.claims}
    />
  );
}
// File: lib/types/dashboard.ts
import type { Company, PreClaim, Profile } from './database';

export interface DashboardContext {
  profile: Profile;
  company: Company;
}

export interface ClaimWithEmployee extends PreClaim {
  employee_full_name: string | null;
}

export interface PayrollRow {
  employeeId: string;
  fullName: string;
  matchedCount: number;
  totalReward: number;
}
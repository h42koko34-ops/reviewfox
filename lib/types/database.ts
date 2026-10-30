// File: lib/types/database.ts
export type UserRole = 'super_admin' | 'company_admin' | 'employee';
export type CompanyStatus = 'active' | 'suspended';
export type LangCode = 'ar' | 'en';
export type ClaimStatus =
  | 'pending'
  | 'matched'
  | 'needs_review'
  | 'rejected'
  | 'fraud_flagged'
  | 'expired';

export interface EnabledFeatures {
  quick_tags: boolean;
  voice_notes: boolean;
  promo_codes: boolean;
  ocr_scanner: boolean;
  qr_gateway: boolean;
  whatsapp_link: boolean;
  keyword_hooks: boolean;
}

export interface AdminPermissions {
  can_add_employees: boolean;
  can_export_excel: boolean;
  can_approve_needs_review: boolean;
  can_edit_reward_amount: boolean;
  can_view_ai_reasoning: boolean;
}

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  default_lang: LangCode;
  max_employees: number;
  current_employees_count: number;
  max_daily_claims_per_employee: number;
  reward_per_review: number;
  webhook_secret: string | null;
  google_review_url: string | null;
  google_place_id: string | null;
  enabled_features: EnabledFeatures;
  admin_permissions: AdminPermissions;
  created_at: string;
}

export interface Profile {
  id: string;
  company_id: string | null;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  preferred_lang: LangCode;
  employee_promo_code: string | null;
  desk_number: string | null;
  points: number;
  fraud_warnings: number;
  is_active: boolean;
  created_at: string;
}

export interface PreClaim {
  id: string;
  company_id: string;
  employee_id: string;
  expected_client_name: string | null;
  invoice_number: string | null;
  invoice_timestamp: string | null;
  verification_code: string | null;
  service_notes: string | null;
  voice_transcript: string | null;
  quick_tags: Record<string, unknown> | null;
  ocr_captured_name: string | null;
  client_phone: string | null;
  qr_scanned_at: string | null;
  client_device_hash: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_zone?: string | null;
  status: ClaimStatus;
  created_at: string;
}

export interface ActualReview {
  id: string;
  company_id: string;
  reviewer_name: string | null;
  review_text: string | null;
  rating: number | null;
  review_date: string | null;
  matched_claim_id: string | null;
  ai_confidence: number | null;
  ai_reasoning_ar: string | null;
  ai_reasoning_en: string | null;
  is_suspicious: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Partial<Company>;
        Update: Partial<Company>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      pre_claims: {
        Row: PreClaim;
        Insert: Partial<PreClaim>;
        Update: Partial<PreClaim>;
      };
      actual_reviews: {
        Row: ActualReview;
        Insert: Partial<ActualReview>;
        Update: Partial<ActualReview>;
      };
    };
  };
}
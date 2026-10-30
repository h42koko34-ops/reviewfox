// File: app/account/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function updateMyAccountAction(input: {
  fullName: string;
  email: string;
  phone: string;
  deskNumber?: string;
  promoCode?: string;
  avatarUrl?: string | null;
  newPassword?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'غير مصرح لك بهذا الإجراء.' };

    const adminClient = createAdminClient();

    // 1. تحديث البريد الإلكتروني أو كلمة المرور في نظام Auth إذا تم تغييرهما
    const authUpdate: {
      email?: string;
      password?: string;
      email_confirm?: boolean;
      user_metadata?: Record<string, unknown>;
    } = {
      user_metadata: { full_name: input.fullName.trim() },
    };

    if (input.email.trim() && input.email.trim() !== user.email) {
      authUpdate.email = input.email.trim();
      authUpdate.email_confirm = true;
    }

    if (input.newPassword && input.newPassword.trim().length >= 8) {
      authUpdate.password = input.newPassword.trim();
    }

    const { error: authErr } = await adminClient.auth.admin.updateUserById(user.id, authUpdate);
    if (authErr) return { success: false, error: authErr.message };

    // 2. تحديث بيانات جدول profiles (الاسم، الهاتف، الصورة، كود الفني للذكاء الاصطناعي)
    const { error: profileErr } = await adminClient
      .from('profiles')
      .update({
        full_name: input.fullName.trim(),
        email: input.email.trim(),
        phone: input.phone.trim() || null,
        avatar_url: input.avatarUrl || null,
        desk_number: input.deskNumber?.trim() || null,
        employee_promo_code: input.promoCode?.trim() || null,
      })
      .eq('id', user.id);

    if (profileErr) return { success: false, error: profileErr.message };

    revalidatePath('/employee');
    revalidatePath('/dashboard');
    revalidatePath('/super-admin');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'فشل تحديث بيانات الحساب.',
    };
  }
}

export async function deleteMyAccountAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'غير مصرح لك بهذا الإجراء.' };

    const adminClient = createAdminClient();

    // فك ارتباط المطالبات السابقة أو حذف سجل البروفايل ثم مسح الحساب نهائياً (متطلب Apple & Google)
    await adminClient.from('pre_claims').delete().eq('employee_id', user.id);
    await adminClient.from('profiles').delete().eq('id', user.id);

    const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteAuthErr) return { success: false, error: deleteAuthErr.message };

    await supabase.auth.signOut();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'فشل حذف الحساب.',
    };
  }
}
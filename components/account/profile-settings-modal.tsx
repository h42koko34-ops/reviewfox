// File: components/account/profile-settings-modal.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Camera,
  Loader2,
  Lock,
  Mail,
  Phone,
  Sparkles,
  Trash2,
  UserCog,
  X,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Profile } from '@/lib/types/database';
import { deleteMyAccountAction, updateMyAccountAction } from '@/app/account/actions';

interface Props {
  profile?: Profile | null;
}

export function ProfileSettingsModal({ profile: initialProfile }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deskNumber, setDeskNumber] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data as Profile);
        });
    });
  }, [initialProfile]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setEmail(profile.email ?? '');
    setPhone(profile.phone ?? '');
    setDeskNumber(profile.desk_number ?? '');
    setPromoCode(profile.employee_promo_code ?? '');
    setAvatarUrl(profile.avatar_url ?? null);
  }, [profile]);

  if (!profile) return null;

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 3 ميجابايت');
      return;
    }

    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `${profile.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrlData.publicUrl);
      toast.success('تم رفع الصورة بنجاح، اضغط حفظ لتأكيد التغييرات');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر رفع الصورة');
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleSave() {
    if (!fullName.trim()) {
      toast.error('الاسم مطلوب ليتمكن الذكاء الاصطناعي من مطابقة التقييمات');
      return;
    }

    startTransition(async () => {
      const result = await updateMyAccountAction({
        fullName,
        email,
        phone,
        deskNumber,
        promoCode,
        avatarUrl,
        newPassword: newPassword || undefined,
      });

      if (result.success) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                full_name: fullName.trim(),
                email: email.trim(),
                phone: phone.trim() || null,
                desk_number: deskNumber.trim() || null,
                employee_promo_code: promoCode.trim() || null,
                avatar_url: avatarUrl,
              }
            : prev
        );
        toast.success('تم تحديث بيانات حسابك بنجاح');
        setNewPassword('');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'حدث خطأ أثناء حفظ البيانات');
      }
    });
  }

  function handleDeleteAccount() {
    startTransition(async () => {
      const result = await deleteMyAccountAction();
      if (result.success) {
        toast.success('تم حذف الحساب نهائياً');
        router.push('/login');
        router.refresh();
      } else {
        toast.error(result.error ?? 'تعذر حذف الحساب');
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold shadow-sm hover:border-orange-500/50"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName} className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <UserCog className="h-4 w-4 text-orange-500" />
        )}
        <span>إعدادات الحساب</span>
      </Button>

      {open && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl max-h-[92vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-orange-500" />
                  <span>تعديل الحساب الشخصي</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  تأكد من كتابة اسمك بوضوح ليتمكن الذكاء الاصطناعي من ربطه بالتقييمات
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className="relative h-24 w-24 rounded-full border-2 border-orange-500/40 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden shadow-md">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-orange-500">
                    {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}

                <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white">
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-[11px] text-zinc-500 mt-2">
                اضغط على الدائرة لتغيير صورتك الشخصية
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                  <span>الاسم الكامل / اسم الفني لدى العملاء (مهم للذكاء الاصطناعي)</span>
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: الفني أحمد محمد"
                  className="bg-zinc-50 dark:bg-zinc-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-zinc-400" />
                    <span>رقم الهاتف</span>
                  </Label>
                  <Input
                    dir="ltr"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2010..."
                    className="bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    <span>البريد الإلكتروني</span>
                  </Label>
                  <Input
                    dir="ltr"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
              </div>

              {profile.role === 'employee' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">رقم المكتب / القسم (اختياري)</Label>
                    <Input
                      value={deskNumber}
                      onChange={(e) => setDeskNumber(e.target.value)}
                      placeholder="مثال: فرع مدينة نصر / كاشير 2"
                      className="bg-zinc-50 dark:bg-zinc-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">كود الفني المميز (Promo Code)</Label>
                    <Input
                      dir="ltr"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="AHMED10"
                      className="bg-zinc-50 dark:bg-zinc-900"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>تغيير كلمة المرور (اتركها فارغة إذا لا تريد تغييرها)</span>
                </Label>
                <Input
                  dir="ltr"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (8 أحرف على الأقل)"
                  className="bg-zinc-50 dark:bg-zinc-900"
                />
              </div>

              <Button
                type="button"
                onClick={handleSave}
                disabled={isPending || uploadingAvatar}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl mt-2"
              >
                {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                حفظ التعديلات
              </Button>
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>حذف الحساب نهائياً (Delete Account)</span>
                </button>
              ) : (
                <div className="rounded-2xl border border-rose-500/50 bg-rose-50/80 dark:bg-rose-950/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>تحذير: سيتم مسح حسابك وجميع نقاطك وبياناتك نهائياً ولا يمكن التراجع!</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                    لتأكيد الحذف، اكتب كلمة <strong className="text-rose-600">حذف</strong> أو{' '}
                    <strong className="text-rose-600">DELETE</strong> بالأسفل:
                  </p>
                  <Input
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="اكتب حذف أو DELETE"
                    className="bg-white dark:bg-zinc-900 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfirmDelete(false);
                        setDeleteConfirmationText('');
                      }}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        isPending ||
                        (deleteConfirmationText.trim() !== 'حذف' &&
                          deleteConfirmationText.trim().toUpperCase() !== 'DELETE')
                      }
                      onClick={handleDeleteAccount}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد الحذف النهائي'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
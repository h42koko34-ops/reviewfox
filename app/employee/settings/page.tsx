'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Loader2,
  User,
  Lock,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function EmployeeSettingsPage() {
  const router = useRouter();

  // Language detection from document dir/lang
  const [isAr, setIsAr] = useState(true);

  // Profile state
  const [userId, setUserId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Loading & feedback states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [password, setPassword] = useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsAr(document.documentElement.lang !== 'en');
    }

    const loadUserData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        setEmail(user.email || '');
        const metaName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          '';
        const metaAvatar = user.user_metadata?.avatar_url || '';

        setFullName(metaName);
        setUsername(user.email?.split('@')[0] || '');
        setAvatarUrl(metaAvatar);

        // Try loading from users or profiles table if present
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }
      }
    };

    loadUserData();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;
    setIsUpdatingProfile(true);
    setStatusMessage(null);

    try {
      const supabase = createClient();

      // 1. Update Supabase Auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          name: fullName.trim(),
          avatar_url: avatarUrl.trim(),
        },
      });

      if (authError) throw authError;

      // 2. Also update public users table if applicable
      await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
        })
        .eq('id', userId);

      showMessage(
        'success',
        isAr ? 'تم تحديث بيانات الحساب بنجاح!' : 'Profile updated successfully!'
      );
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isAr
          ? 'حدث خطأ أثناء تحديث الحساب'
          : 'Failed to update profile';
      showMessage('error', message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!password || password.length < 6) {
      showMessage(
        'error',
        isAr
          ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    if (password !== passwordConfirm) {
      showMessage(
        'error',
        isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'
      );
      return;
    }

    setIsChangingPassword(true);
    setStatusMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setPassword('');
      setPasswordConfirm('');
      showMessage(
        'success',
        isAr ? 'تم تغيير كلمة المرور بنجاح!' : 'Password updated successfully!'
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isAr
          ? 'فشل تغيير كلمة المرور'
          : 'Failed to change password';
      showMessage('error', message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setStatusMessage(null);

    try {
      const supabase = createClient();
      if (userId) {
        // Deactivate or remove from users table if permitted by RLS
        await supabase.from('users').delete().eq('id', userId);
      }

      await supabase.auth.signOut();
      router.push('/login');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isAr
          ? 'فشل حذف الحساب'
          : 'Failed to delete account';
      showMessage('error', message);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-zinc-950 dark:text-zinc-50 p-4 pb-24 transition-colors">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <button
            type="button"
            onClick={() => router.push('/employee')}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-orange-500 transition-colors"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            <span>{isAr ? 'العودة للرئيسية' : 'Back to Portal'}</span>
          </button>

          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {isAr ? 'إعدادات الحساب' : 'Account Settings'}
          </h1>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-sm font-medium border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* 1. Update Profile Section */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center overflow-hidden text-orange-500 font-bold text-lg">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                fullName?.slice(0, 2)?.toUpperCase() || <User className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {isAr ? 'البيانات الشخصية' : 'Profile Information'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                {isAr ? 'الاسم المعروض' : 'Display Name'}
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isAr ? 'أدخل اسمك الكامل' : 'Enter your display name'}
                className="w-full"
                disabled={isUpdatingProfile}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                {isAr ? 'اسم المستخدم' : 'Username'}
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full opacity-75"
                disabled
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                <Camera className="h-3.5 w-3.5" />
                <span>{isAr ? 'رابط صورة الحساب (اختياري)' : 'Avatar Image URL (Optional)'}</span>
              </label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="w-full"
                disabled={isUpdatingProfile}
              />
            </div>

            <Button
              type="button"
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isUpdatingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
              )}
            </Button>
          </div>
        </div>

        {/* 2. Change Password Section */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
              {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
            </h2>
          </div>

          <div className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isAr ? 'كلمة المرور الجديدة' : 'New password'}
              className="w-full"
              disabled={isChangingPassword}
            />
            <Input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder={isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password'}
              className="w-full"
              disabled={isChangingPassword}
            />

            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isChangingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>{isAr ? 'تحديث كلمة المرور' : 'Update Password'}</span>
              )}
            </Button>
          </div>
        </div>

        {/* 3. Delete Account Section */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-red-500/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-4 w-4" />
            <h2 className="font-semibold">
              {isAr ? 'حذف الحساب' : 'Delete Account'}
            </h2>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {isAr
              ? 'حذف حسابك سيؤدي إلى إزالة بياناتك وتسجيل خروجك نهائياً من المنصة. لا يمكن التراجع عن هذا الإجراء.'
              : 'Deleting your account will remove your access and sign you out permanently. This action cannot be undone.'}
          </p>

          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isAr ? 'حذف حسابي نهائياً' : 'Delete My Account'}
            </Button>
          ) : (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {isAr
                  ? 'هل أنت متأكد من رغبتك في حذف الحساب؟'
                  : 'Are you sure you want to delete your account?'}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingAccount}
                  className="flex-1"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeletingAccount ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>{isAr ? 'نعم، احذف الحساب' : 'Yes, Delete'}</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
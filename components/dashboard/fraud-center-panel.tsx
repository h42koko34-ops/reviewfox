// File: components/dashboard/fraud-center-panel.tsx
'use client';

import { useEffect, useState } from 'react';
import { Loader2, Lock, ShieldAlert, Star } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { Badge } from '@/components/ui/badge';
import type { AdminPermissions, Company, ActualReview } from '@/lib/types/database';
import { getSuspiciousReviews } from '@/app/dashboard/actions';

export function FraudCenterPanel({ company }: { company: Company }) {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<ActualReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const permissions = company.admin_permissions as AdminPermissions;

  useEffect(() => {
    let active = true;
    getSuspiciousReviews(company.id).then((result) => {
      if (!active) return;
      if (result.success && result.reviews) setReviews(result.reviews as ActualReview[]);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [company.id]);

  return (
    <section className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60">
      <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{t.dashboard.fraud.title}</h2>
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">{t.dashboard.fraud.subtitle}</p>

      {isLoading && (
        <div className="flex items-center justify-center py-10 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!isLoading && reviews.length === 0 && (
        <p className="py-10 text-center text-sm text-zinc-500">{t.dashboard.fraud.empty}</p>
      )}

      <div className="space-y-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className={`rounded-xl border p-4 ${
              review.is_suspicious
                ? 'border-rose-500/30 bg-rose-500/5'
                : 'border-zinc-200/70 bg-white/50 dark:border-zinc-800 dark:bg-zinc-900/40'
            }`}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-zinc-900 dark:text-white">
                {t.dashboard.fraud.reviewerLabel}: {review.reviewer_name ?? '—'}
              </p>
              <div className="flex items-center gap-2">
                {review.rating !== null && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-amber-500" /> {review.rating}/5
                  </span>
                )}
                {review.is_suspicious && (
                  <Badge variant="outline" className="gap-1 border-rose-500/30 bg-rose-500/10 text-rose-600">
                    <ShieldAlert className="h-3 w-3" />
                    {t.dashboard.fraud.suspiciousBadge}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-300">{review.review_text}</p>

            {permissions.can_view_ai_reasoning ? (
              review.ai_confidence !== null && (
                <div className="mt-3 rounded-lg bg-zinc-100/70 p-3 text-xs dark:bg-zinc-800/50">
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {t.dashboard.fraud.confidenceLabel}: {review.ai_confidence}%
                  </p>
                  <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                    {language === 'ar' ? review.ai_reasoning_ar : review.ai_reasoning_en}
                  </p>
                </div>
              )
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-100/70 p-3 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                <Lock className="h-3.5 w-3.5" />
                <span>
                  <strong>{t.dashboard.fraud.aiReasoningLockedTitle}:</strong> {t.dashboard.fraud.aiReasoningLockedDesc}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
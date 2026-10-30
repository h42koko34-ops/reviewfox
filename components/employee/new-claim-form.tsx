// File: components/employee/new-claim-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, QrCode, Send } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { EnabledFeatures, PreClaim } from '@/lib/types/database';
import { submitPreClaim } from '@/app/employee/actions';
import { OcrCaptureButton } from './ocr-capture-button';

interface Props {
  enabledFeatures: EnabledFeatures;
  remaining: number;
  onSubmitted: (claim: PreClaim) => void;
}

const QUICK_TAG_KEYS = ['positive', 'negative', 'neutral', 'followUp'] as const;

const initialForm = {
  expectedClientName: '',
  invoiceNumber: '',
  invoiceTimestamp: new Date().toISOString().slice(0, 16),
  selectedTags: [] as string[],
  voiceTranscript: '',
  verificationCode: '',
  ocrCapturedName: '',
  qrScannedAt: null as string | null,
  clientPhone: '',
};

export function NewClaimForm({ enabledFeatures, remaining, onSubmitted }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [isPending, startTransition] = useTransition();

  const hasAnyFeature =
    enabledFeatures.quick_tags ||
    enabledFeatures.voice_notes ||
    enabledFeatures.promo_codes ||
    enabledFeatures.ocr_scanner ||
    enabledFeatures.qr_gateway ||
    enabledFeatures.whatsapp_link;

  function toggleTag(tagKey: string) {
    setForm((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagKey)
        ? prev.selectedTags.filter((tg) => tg !== tagKey)
        : [...prev.selectedTags, tagKey],
    }));
  }

  function handleQrScan() {
    setForm((prev) => ({ ...prev, qrScannedAt: new Date().toISOString() }));
    toast.success(t.employee.newClaimForm.qrScannedAt);
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitPreClaim({
        expectedClientName: form.expectedClientName.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        invoiceTimestamp: new Date(form.invoiceTimestamp).toISOString(),
        quickTags: enabledFeatures.quick_tags && form.selectedTags.length > 0 ? form.selectedTags : null,
        voiceTranscript: enabledFeatures.voice_notes && form.voiceTranscript ? form.voiceTranscript : null,
        verificationCode: enabledFeatures.promo_codes && form.verificationCode ? form.verificationCode : null,
        ocrCapturedName: enabledFeatures.ocr_scanner && form.ocrCapturedName ? form.ocrCapturedName : null,
        qrScannedAt: enabledFeatures.qr_gateway ? form.qrScannedAt : null,
        clientPhone: enabledFeatures.whatsapp_link && form.clientPhone ? form.clientPhone : null,
      });

      if (result.success && result.claim) {
        toast.success(t.employee.newClaimForm.toastSuccess);
        onSubmitted(result.claim);
        setForm(initialForm);
      } else if (result.error === 'DUPLICATE_INVOICE') {
        toast.error(t.employee.newClaimForm.duplicateInvoice);
      } else if (result.error === 'DAILY_LIMIT_REACHED') {
        toast.error(t.employee.dailyLimit.reachedDesc);
      } else {
        toast.error(result.error ?? t.employee.newClaimForm.toastError);
      }
    });
  }

  const isValid = form.expectedClientName.trim().length > 1 && form.invoiceNumber.trim().length > 0 && remaining > 0;

  if (!hasAnyFeature) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        {t.employee.newClaimForm.noFeaturesEnabled}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 rounded-2xl border border-white/20 bg-white/60 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60"
    >
      <div>
        <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{t.employee.newClaimForm.title}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.employee.newClaimForm.subtitle}</p>
      </div>

      <div className="space-y-2">
        <Label>{t.employee.newClaimForm.clientName}</Label>
        <Input
          value={form.expectedClientName}
          onChange={(e) => setForm((f) => ({ ...f, expectedClientName: e.target.value }))}
          placeholder={t.employee.newClaimForm.clientNamePlaceholder}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t.employee.newClaimForm.invoiceNumber}</Label>
          <Input
            value={form.invoiceNumber}
            onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
            placeholder={t.employee.newClaimForm.invoiceNumberPlaceholder}
          />
        </div>
        <div className="space-y-2">
          <Label>{t.employee.newClaimForm.invoiceTimestamp}</Label>
          <Input
            type="datetime-local"
            value={form.invoiceTimestamp}
            onChange={(e) => setForm((f) => ({ ...f, invoiceTimestamp: e.target.value }))}
          />
        </div>
      </div>

      {enabledFeatures.quick_tags && (
        <div className="space-y-2">
          <Label>{t.employee.newClaimForm.quickTagsLabel}</Label>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAG_KEYS.map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => toggleTag(key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  form.selectedTags.includes(key)
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {t.employee.newClaimForm.quickTagsOptions[key]}
              </button>
            ))}
          </div>
        </div>
      )}

      {enabledFeatures.voice_notes && (
        <div className="space-y-2">
          <Label>{t.employee.newClaimForm.voiceNotesLabel}</Label>
          <Textarea
            value={form.voiceTranscript}
            onChange={(e) => setForm((f) => ({ ...f, voiceTranscript: e.target.value }))}
            placeholder={t.employee.newClaimForm.voiceNotesPlaceholder}
            rows={3}
          />
        </div>
      )}

      {enabledFeatures.promo_codes && (
        <div className="space-y-2">
          <Label>{t.employee.newClaimForm.promoCodeLabel}</Label>
          <Input
            value={form.verificationCode}
            onChange={(e) => setForm((f) => ({ ...f, verificationCode: e.target.value }))}
            placeholder={t.employee.newClaimForm.promoCodePlaceholder}
          />
        </div>
      )}

      {enabledFeatures.ocr_scanner && (
        <div className="space-y-2">
          <Label>{t.employee.newClaimForm.ocrLabel}</Label>
          <OcrCaptureButton
            onExtracted={(data) =>
              setForm((f) => ({
                ...f,
                ocrCapturedName: data.ocr_captured_name ?? f.ocrCapturedName,
                invoiceNumber: data.invoice_number ?? f.invoiceNumber,
                invoiceTimestamp: data.invoice_timestamp
                  ? new Date(data.invoice_timestamp).toISOString().slice(0, 16)
                  : f.invoiceTimestamp,
              }))
            }
          />
          <Input
            value={form.ocrCapturedName}
            onChange={(e) => setForm((f) => ({ ...f, ocrCapturedName: e.target.value }))}
            placeholder={t.employee.newClaimForm.ocrPlaceholder}
          />
        </div>
      )}

      {enabledFeatures.qr_gateway && (
        <div className="space-y-2">
          <Label>{t.employee.newClaimForm.qrLabel}</Label>
          <Button
            type="button"
            variant="outline"
            onClick={handleQrScan}
            className="w-full gap-2 border-dashed"
          >
            <QrCode className="h-4 w-4" />
            {form.qrScannedAt
              ? `${t.employee.newClaimForm.qrScannedAt}: ${new Date(form.qrScannedAt).toLocaleTimeString()}`
              : t.employee.newClaimForm.qrScanButton}
          </Button>
        </div>
      )}

      {enabledFeatures.whatsapp_link && (
        <div className="space-y-2">
          <Label>{t.employee.newClaimForm.whatsappLabel}</Label>
          <Input
            type="tel"
            value={form.clientPhone}
            onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
            placeholder={t.employee.newClaimForm.whatsappPlaceholder}
          />
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!isValid || isPending}
        className="w-full gap-2 bg-orange-500 text-white hover:bg-orange-600"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {isPending ? t.employee.newClaimForm.submitting : t.employee.newClaimForm.submit}
      </Button>
    </motion.div>
  );
}
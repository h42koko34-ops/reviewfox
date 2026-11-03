// File: components/employee/new-claim-form.tsx
'use client';

import { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, MapPin, MessageCircle, Mic, MicOff, QrCode, RefreshCw, Send } from 'lucide-react';
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
  googleReviewUrl?: string | null;
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

/**
 * دالة ذكية لتنسيق أي رقم هاتف يكتبه الموظف ليقبله واتساب مباشرة
 * مثال: 01012345678 -> 201012345678
 */
function formatPhoneForWhatsApp(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, '');

  if (!digits) return '';

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('01')) {
    digits = '20' + digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith('05')) {
    digits = '966' + digits.slice(1);
  } else if (digits.startsWith('0')) {
    digits = '20' + digits.slice(1);
  }

  return digits;
}

export function NewClaimForm({ enabledFeatures, remaining, onSubmitted, googleReviewUrl }: Props) {
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';
  const [form, setForm] = useState(initialForm);
  const [isPending, startTransition] = useTransition();
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [gps, setGps] = useState<{
    lat: number | null;
    lng: number | null;
    zone: string | null;
    status: 'loading' | 'success' | 'error';
  }>({ lat: null, lng: null, zone: null, status: 'loading' });

  const detectLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGps((prev) => ({ ...prev, status: 'error' }));
      return;
    }

    setGps((prev) => ({ ...prev, status: 'loading' }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let zoneName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data?.address;
            if (addr) {
              const area =
                addr.suburb ||
                addr.neighbourhood ||
                addr.city_district ||
                addr.quarter ||
                addr.town ||
                addr.village ||
                '';
              const city = addr.city || addr.state || '';
              const combined = [area, city].filter(Boolean).join(' - ');
              if (combined) zoneName = combined;
            }
          }
        } catch (err) {
          console.error('[ReviewFox] Reverse geocoding error:', err);
        }

        setGps({
          lat: latitude,
          lng: longitude,
          zone: zoneName,
          status: 'success',
        });
      },
      (err) => {
        console.warn('[ReviewFox] Geolocation error:', err);
        setGps((prev) => ({ ...prev, status: 'error' }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const hasAnyFeature =
    enabledFeatures.quick_tags ||
    enabledFeatures.voice_notes ||
    enabledFeatures.promo_codes ||
    enabledFeatures.ocr_scanner ||
    enabledFeatures.qr_gateway ||
    enabledFeatures.whatsapp_link;

  // تم التأكد من صحة هذه الدالة 100%
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

  function toggleVoiceRecording() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        isAr
          ? 'متصفحك الحالي لا يدعم التسجيل الصوتي المباشر، جرب متصفح Chrome.'
          : 'Your browser does not support voice recognition, please try Chrome.'
      );
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isAr ? 'ar-EG' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      toast.info(isAr ? 'تحدث الآن... جاري الاستماع 🎙️' : 'Listening... Speak now 🎙️');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setForm((prev) => ({
        ...prev,
        voiceTranscript: prev.voiceTranscript
          ? `${prev.voiceTranscript} ${transcript}`
          : transcript,
      }));
      toast.success(isAr ? 'تم تحويل الصوت إلى نص بنجاح!' : 'Voice converted to text!');
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error(isAr ? 'تعذر التقاط الصوت، تأكد من صلاحية الميكروفون.' : 'Microphone error.');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function openWhatsAppChat(phoneInput: string, clientNameInput: string) {
    const formattedPhone = formatPhoneForWhatsApp(phoneInput);
    if (formattedPhone.length < 10) {
      toast.error(
        isAr
          ? 'يرجى إدخال رقم هاتف صحيح أولاً (مثال: 01012345678)'
          : 'Please enter a valid phone number first'
      );
      return false;
    }

    const clientGreeting = clientNameInput.trim() ? `أستاذ/ة ${clientNameInput.trim()}` : 'عميلنا العزيز';
    const reviewLinkPart = googleReviewUrl
      ? `\n\nرابط التقييم المباشر:\n${googleReviewUrl}`
      : '';

    const message = isAr
      ? `مرحباً ${clientGreeting} 🌟\nشكراً لزيارتك لنا اليوم! يسعدنا جداً معرفة رأيك وتقييم تجربتك معنا على جوجل، فهذا يساعدنا كثيراً على تقديم أفضل خدمة دائماً.${reviewLinkPart}`
      : `Hello ${clientNameInput.trim() || 'there'} 🌟\nThank you for visiting us today! We would love to hear your feedback on Google Reviews.${reviewLinkPart}`;

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    return true;
  }

  function handleSubmit() {
    const phoneToSave = form.clientPhone.trim();
    const clientNameToSave = form.expectedClientName.trim();

    startTransition(async () => {
      const result = await submitPreClaim({
        expectedClientName: clientNameToSave,
        invoiceNumber: form.invoiceNumber.trim(),
        invoiceTimestamp: new Date(form.invoiceTimestamp).toISOString(),
        quickTags: enabledFeatures.quick_tags && form.selectedTags.length > 0 ? form.selectedTags : null,
        voiceTranscript: enabledFeatures.voice_notes && form.voiceTranscript ? form.voiceTranscript : null,
        verificationCode: enabledFeatures.promo_codes && form.verificationCode ? form.verificationCode : null,
        ocrCapturedName: enabledFeatures.ocr_scanner && form.ocrCapturedName ? form.ocrCapturedName : null,
        qrScannedAt: enabledFeatures.qr_gateway ? form.qrScannedAt : null,
        clientPhone: enabledFeatures.whatsapp_link && phoneToSave ? formatPhoneForWhatsApp(phoneToSave) : null,
        latitude: gps.lat,
        longitude: gps.lng,
        locationZone: gps.zone,
      });

      if (result.success && result.claim) {
        toast.success(t.employee.newClaimForm.toastSuccess);

        if (enabledFeatures.whatsapp_link && phoneToSave.length >= 10) {
          openWhatsAppChat(phoneToSave, clientNameToSave);
        }

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

      <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/90 px-3.5 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
          {gps.status === 'loading' && (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              جاري تحديد موقعك الجغرافي (GPS)...
            </span>
          )}
          {gps.status === 'success' && (
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              المنطقة الحالية (Zone): {gps.zone}
            </span>
          )}
          {gps.status === 'error' && (
            <span className="font-medium text-rose-500">
              تعذر تحديد الموقع — يرجى السماح بصلاحية الـ GPS للمتصفح
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={detectLocation}
          title="تحديث الموقع الجغرافي"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <RefreshCw className={`h-3 w-3 ${gps.status === 'loading' ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
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
          <div className="flex items-center justify-between">
            <Label>{t.employee.newClaimForm.voiceNotesLabel}</Label>
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                isRecording
                  ? 'animate-pulse bg-rose-500 text-white'
                  : 'bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 dark:text-orange-400'
              }`}
            >
              {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              <span>{isRecording ? (isAr ? 'إيقاف التسجيل' : 'Stop') : (isAr ? 'تسجيل صوتي 🎙️' : 'Voice Input')}</span>
            </button>
          </div>
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
          <div className="flex gap-2">
            <Input
              type="tel"
              value={form.clientPhone}
              onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
              placeholder="01012345678"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => openWhatsAppChat(form.clientPhone, form.expectedClientName)}
              disabled={form.clientPhone.trim().length < 10}
              className="shrink-0 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{isAr ? 'إرسال واتساب' : 'WhatsApp'}</span>
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {isAr
              ? 'اكتب رقم العميل (حتى بدون +20) واضغط "إرسال واتساب" لفتح المحادثة برسالة التقييم جاهزة فوراً.'
              : 'Enter customer phone to send a direct WhatsApp review invitation.'}
          </p>
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
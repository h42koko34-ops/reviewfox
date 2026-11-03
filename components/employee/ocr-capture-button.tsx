// File: components/employee/ocr-capture-button.tsx
'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';

interface ExtractedData {
  ocr_captured_name: string | null;
  invoice_number: string | null;
  invoice_timestamp: string | null;
}

interface Props {
  onExtracted: (result: ExtractedData) => void;
}

/**
 * ضغط وتصغير صورة الفاتورة الملتقطة بكاميرا الموبايل لتسريع الرفع ومنع خطأ الحجم الكبير
 */
function compressImageToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const raw = (e.target?.result as string).split(',')[1] ?? '';
          resolve({ base64: raw, mimeType: file.type || 'image/jpeg' });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1] ?? '';
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function OcrCaptureButton({ onExtracted }: Props) {
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const { base64, mimeType } = await compressImageToBase64(file);
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(
          result.error ??
            (isAr ? 'تعذر قراءة الفاتورة، حاول تصويرها بوضوح.' : 'OCR extraction failed.')
        );
        return;
      }

      onExtracted(result.data);
      toast.success(
        result.data.ocr_captured_name
          ? `${t.employee.newClaimForm.ocrLabel}: ${result.data.ocr_captured_name}`
          : isAr
          ? 'تم استخراج بيانات الفاتورة بنجاح!'
          : t.employee.newClaimForm.ocrLabel
      );
    } catch {
      toast.error(
        isAr
          ? 'حدث خطأ أثناء فحص الفاتورة، يرجى المحاولة مرة أخرى.'
          : 'OCR extraction failed. Please try again.'
      );
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isProcessing}
        onClick={() => inputRef.current?.click()}
        className="w-full gap-2 border-dashed"
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {isProcessing ? t.common.loading : t.employee.newClaimForm.ocrPlaceholder}
      </Button>
    </div>
  );
}
// File: lib/ai/ocr-extractor.ts
import { Type } from '@google/genai';
import { getGeminiClient } from './gemini-client';

export interface OcrExtractionResult {
  ocr_captured_name: string | null;
  invoice_number: string | null;
  invoice_timestamp: string | null;
  confidence: number;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ocr_captured_name: {
      type: Type.STRING,
      nullable: true,
      description:
        "The customer's full name exactly as printed on the receipt/invoice, OR the display name shown on a Google Maps / Google Business profile screenshot.",
    },
    invoice_number: {
      type: Type.STRING,
      nullable: true,
      description: 'The invoice, receipt, or order number if clearly visible.',
    },
    invoice_timestamp: {
      type: Type.STRING,
      nullable: true,
      description: 'The invoice date & time in ISO-8601 format if clearly visible, else null.',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence (0-100) that the extracted fields are accurate.',
    },
  },
  required: ['confidence'],
};

const PROMPT = `
You are ReviewFox's OCR extraction engine. You will be given a photo taken by an employee on their phone. It is ONE of these two types:
1. A printed or handwritten invoice/receipt, OR
2. A screenshot of a client's Google Maps / Google Business profile showing their display name.

Extract ONLY what is clearly and unambiguously legible in the image:
- ocr_captured_name: the customer's name (from the receipt's "customer" field, OR the Google profile display name). If no name is clearly visible, return null.
- invoice_number: the invoice/receipt/order number if visible, else null.
- invoice_timestamp: the date & time of the invoice in ISO-8601 format if visible, else null.
- confidence: your honest confidence (0-100) in the accuracy of what you extracted.

Do NOT guess, hallucinate, or auto-complete text that is blurry, cropped, or not clearly legible — return null instead for that field. Respond ONLY with the structured JSON object.
`.trim();

export async function extractFromImage(imageBase64: string, mimeType: string): Promise<OcrExtractionResult> {
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: PROMPT }, { inlineData: { mimeType, data: imageBase64 } }],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.1,
    },
  });

  const rawText = response.text;
  if (!rawText) {
    return { ocr_captured_name: null, invoice_number: null, invoice_timestamp: null, confidence: 0 };
  }

  let parsed: Partial<OcrExtractionResult> = {};
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ocr_captured_name: null, invoice_number: null, invoice_timestamp: null, confidence: 0 };
  }

  return {
    ocr_captured_name: parsed.ocr_captured_name ?? null,
    invoice_number: parsed.invoice_number ?? null,
    invoice_timestamp: parsed.invoice_timestamp ?? null,
    confidence:
      typeof parsed.confidence === 'number' ? Math.min(Math.max(Math.round(parsed.confidence), 0), 100) : 0,
  };
}
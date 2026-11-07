// File: lib/whatsapp/send-invite.ts

interface SendWhatsAppParams {
  clientPhone: string;
  clientName: string;
  companyName: string;
  employeeName: string;
  locationZone: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleReviewUrl?: string | null;
  verificationCode?: string | null;
  // بيانات الواتساب الخاصة بالشركة (اختيارية)
  companyPhoneId?: string | null;
  companyAccessToken?: string | null;
}

export async function sendAutomatedCompanyWhatsApp(params: SendWhatsAppParams): Promise<{
  sent: boolean;
  error?: string;
}> {
  // استخدام رقم الشركة الخاص، وإذا لم يتوفر يُستخدم الرقم العام الموحد للمنصة من .env.local
  const phoneId = params.companyPhoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = params.companyAccessToken || process.env.WHATSAPP_ACCESS_TOKEN;

  let cleanPhone = params.clientPhone.replace(/\D/g, '');
  if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.slice(2);
  else if (cleanPhone.length === 11 && cleanPhone.startsWith('01')) cleanPhone = '20' + cleanPhone.slice(1);
  else if (cleanPhone.length === 10 && cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.slice(1);
  else if (cleanPhone.startsWith('0')) cleanPhone = '20' + cleanPhone.slice(1);

  if (cleanPhone.length < 10) {
    return { sent: false, error: 'INVALID_PHONE' };
  }

  const branchText = params.locationZone ? `فرع (${params.locationZone})` : 'فرعنا';
  const mapLink =
    params.latitude && params.longitude
      ? `https://www.google.com/maps?q=${params.latitude},${params.longitude}`
      : null;

  const reviewUrl = params.googleReviewUrl || mapLink || '';
  const refTag = params.verificationCode ? `\n🔖 كود الزيارة: #${params.verificationCode}` : '';

  const messageBody =
    `أهلاً بك أستاذ/ة ${params.clientName} في *${params.companyName}* 🌟\n\n` +
    `سعدنا جداً بخدمتك اليوم في *${branchText}* مع الفني *${params.employeeName}*.\n\n` +
    `رأيك يفرق معانا جداً! تقدر تقيم تجربتك معانا في ${branchText} على جوجل في ثواني من خلال الرابط ده:\n` +
    `👉 ${reviewUrl}\n\n` +
    `💡 *(يسعدنا ذكر اسم الفرع "${params.locationZone || ''}" أو اسم الفني في تعليقك)*${refTag}`;

  if (!phoneId || !accessToken) {
    console.warn('[ReviewFox WhatsApp] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
    return { sent: false, error: 'MISSING_API_CREDENTIALS' };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: messageBody,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[ReviewFox WhatsApp API Error]:', errData);
      return { sent: false, error: 'API_ERROR' };
    }

    return { sent: true };
  } catch (err) {
    console.error('[ReviewFox WhatsApp Exception]:', err);
    return { sent: false, error: 'NETWORK_ERROR' };
  }
}
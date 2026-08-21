const MAX_BODY_BYTES = 30_000;

type LeadPayload = {
  type?: string;
  email?: string;
  company?: string;
  company_size?: string;
  interest?: string;
  privacy_consent?: string | boolean;
};

function response(res: any, status: number, body: Record<string, unknown>) {
  res.status(status).json(body);
}

function readBody(req: any): Promise<LeadPayload> {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch { return Promise.reject(new Error('Invalid JSON')); }
  }

  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer | string) => {
      raw += chunk.toString();
      if (raw.length > MAX_BODY_BYTES) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function clean(value: unknown, max = 240) {
  return String(value ?? '').trim().replace(/[<>]/g, '').slice(0, max);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] || character));
}

async function deliverToResend(lead: Required<Pick<LeadPayload, 'type' | 'email'>> & LeadPayload, receivedAt: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const inbox = 'marketing@cbsai.co';
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const subject = lead.type === 'newsletter' ? 'New CBSai newsletter subscriber' : 'New CBSai demo request';
  const detailRows = [
    ['Email', lead.email],
    ['Company', clean(lead.company)],
    ['Company size', clean(lead.company_size)],
    ['Interest', clean(lead.interest)],
    ['Received', receivedAt],
  ].filter(([, value]) => value).map(([label, value]) => `<tr><th align="left" style="padding:8px 16px 8px 0;color:#60738d">${label}</th><td style="padding:8px 0">${escapeHtml(String(value))}</td></tr>`).join('');

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [inbox],
      reply_to: lead.email,
      subject,
      html: `<div style="font-family:Arial,sans-serif;color:#10213d"><h2>${subject}</h2><table>${detailRows}</table></div>`,
    }),
  });
  return resendResponse.ok;
}

async function deliverToWebhook(lead: LeadPayload, receivedAt: string) {
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) return false;
  const webhookResponse = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...lead, received_at: receivedAt, source: 'cbsai.info' }),
  });
  return webhookResponse.ok;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return response(res, 405, { message: 'Method not allowed.' });
  }

  try {
    const raw = await readBody(req);
    const type = raw.type === 'newsletter' ? 'newsletter' : 'demo';
    const email = clean(raw.email, 180).toLowerCase();
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailIsValid) return response(res, 400, { message: 'Enter a valid email address.' });
    if (type === 'demo' && raw.privacy_consent !== true && raw.privacy_consent !== 'true' && raw.privacy_consent !== 'on') {
      return response(res, 400, { message: 'Please accept the privacy notice before sending your request.' });
    }

    const lead = {
      type,
      email,
      company: clean(raw.company),
      company_size: clean(raw.company_size, 80),
      interest: clean(raw.interest, 160),
    };
    const receivedAt = new Date().toISOString();
    const configured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
    if (!configured) return response(res, 503, { message: 'Lead delivery is not configured yet.' });

    const deliveries = await Promise.allSettled([
      deliverToResend(lead, receivedAt),
      ...(process.env.LEAD_WEBHOOK_URL ? [deliverToWebhook(lead, receivedAt)] : []),
    ]);
    const emailDelivered = deliveries[0]?.status === 'fulfilled' && deliveries[0].value === true;
    if (!emailDelivered) return response(res, 502, { message: 'Lead email delivery failed. Please retry.' });

    return response(res, 202, { ok: true });
  } catch (error) {
    return response(res, 400, { message: 'We could not read that request. Please retry.' });
  }
}

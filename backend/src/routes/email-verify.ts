import { Router, Request, Response } from 'express';
import { BrevoClient } from '@getbrevo/brevo';

const router = Router();

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const store = new Map<string, { code: string; expiresAt: number }>();

function getBrevo() {
  return new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? '' });
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/send-code  { email }
router.post('/send-code', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'A valid email is required.' } });
    return;
  }

  const code = generateCode();
  store.set(email.toLowerCase(), { code, expiresAt: Date.now() + CODE_TTL_MS });

  try {
    await getBrevo().transactionalEmails.sendTransacEmail({
      sender: { name: 'Kora Market', email: 'olayinkaemma27@gmail.com' },
      to: [{ email }],
      subject: `Your Kora verification code: ${code}`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="margin:0 0 8px;font-size:22px">Verify your email</h2>
          <p style="color:#6C5F6E;margin:0 0 24px">Enter this code on the Kora Market sign-up page. It expires in 10 minutes.</p>
          <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#E22C8B;padding:20px;background:#FBF5EC;border-radius:12px;text-align:center">
            ${code}
          </div>
          <p style="color:#6C5F6E;font-size:13px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Brevo] send failed:', err);
    res.status(502).json({ error: { code: 'EMAIL_SEND_FAILED', message: 'Could not send verification email. Try again.' } });
  }
});

// POST /api/auth/verify-code  { email, code }
router.post('/verify-code', (req: Request, res: Response) => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email and code are required.' } });
    return;
  }

  const entry = store.get(email.toLowerCase());
  if (!entry) {
    res.status(400).json({ error: { code: 'NO_CODE', message: 'No code was sent to this email. Request a new one.' } });
    return;
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(email.toLowerCase());
    res.status(400).json({ error: { code: 'CODE_EXPIRED', message: 'Code has expired. Request a new one.' } });
    return;
  }
  if (entry.code !== code.trim()) {
    res.status(400).json({ error: { code: 'WRONG_CODE', message: 'Incorrect code. Please try again.' } });
    return;
  }

  store.delete(email.toLowerCase());
  res.json({ ok: true });
});

export default router;

import { Router } from 'express';

const router = Router();

router.post('/verify', async (req, res) => {
  try {
    const { captchaToken } = req.body;
    if (!captchaToken) return res.status(400).json({ success: false, error: 'captchaToken requerido' });

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.warn('[CAPTCHA] TURNSTILE_SECRET_KEY not set in environment');
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey || '')}&response=${encodeURIComponent(captchaToken)}`,
    });

    const data = await response.json();
    res.json({ success: data.success === true });
  } catch (err) {
    console.error('[CAPTCHA] Error verifying captcha:', err.message);
    res.status(500).json({ success: false, error: 'Error al verificar captcha' });
  }
});

export default router;

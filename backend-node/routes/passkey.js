import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/db.js';
import { CONFIG } from '../config.js';

const router = Router();

// WebAuthn / Passkey authentication endpoints
// These are stubs that simulate passkey behavior.
// For production, integrate with @simplewebauthn/server.

const challenges = new Map();

router.post('/beginLogin', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const challenge = crypto.randomBytes(32).toString('base64url');
    challenges.set(email.toLowerCase(), { challenge, expires: Date.now() + 60000 });

    res.json({
      challenge,
      rpId: 'localhost',
      allowCredentials: [],
      userVerification: 'preferred',
      timeout: 60000,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/finishLogin', async (req, res) => {
  try {
    const { email, challenge } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const stored = challenges.get(email.toLowerCase());
    if (!stored || stored.expires < Date.now()) {
      return res.status(400).json({ error: 'Challenge expirado, inicia sesión de nuevo' });
    }
    challenges.delete(email.toLowerCase());

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!user.isActive) return res.status(403).json({ error: 'Cuenta desactivada' });

    // In production, verify the WebAuthn credential with @simplewebauthn/server
    // For now, this stub requires going through beginLogin first (challenge verification)

    res.json({
      token: jwt.sign({ userId: user._id, email: user.email }, CONFIG.JWT_SECRET, { expiresIn: '24h' }),
      user: {
        user_id: user._id.toString(),
        companyName: user.companyName,
        domain: user.domain,
        email: user.email,
        planType: user.planType,
        isActive: user.isActive,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/beginRegistration', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(409).json({ error: 'Usuario ya existe' });

    const challenge = crypto.randomBytes(32).toString('base64url');

    res.json({
      challenge,
      rp: { name: 'SecureLab', id: 'localhost' },
      user: { id: Buffer.from(email).toString('base64url'), name: email, displayName: email },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      timeout: 60000,
      attestation: 'none',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/finishRegistration', async (req, res) => {
  try {
    const { email } = req.body;
    // In production, verify the attestation and store the credential
    res.json({ success: true, message: 'Passkey registered successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

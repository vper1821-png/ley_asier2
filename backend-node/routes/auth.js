import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CONFIG } from '../config.js';
import { User, AuditLog } from '../models/db.js';
import { validateToken, isAdmin } from '../middleware/auth.js';

const router = Router();
async function verifyTurnstile(captchaToken) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey || !captchaToken) return false;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(captchaToken)}`,
    });
    const data = await response.json();
    return data.success === true;
  } catch (e) { return false; }
}


router.post('/login', async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    if (!email || !password || !(await verifyTurnstile(captchaToken))) return res.json({ error: 'Email, contraseña y verificación de seguridad requeridos' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ error: 'Credenciales inválidas' });

    if (!user.isActive) return res.json({ error: 'Cuenta desactivada', suspensionReason: user.suspensionReason || '' });

    // 2FA check
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ userId: user._id, type: '2fa' }, CONFIG.JWT_SECRET, { expiresIn: '5m' });
      return res.json({ requireTwoFactor: true, tempToken });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, CONFIG.JWT_SECRET, { expiresIn: '24h' });

    const role = user.role || 'user';

    AuditLog.create({ userId: user._id, action: 'login', ipAddress: req.ip, userAgent: req.headers['user-agent'], details: { method: 'password' } }).catch(() => {});

    res.json({
      token,
      user: {
        user_id: user._id.toString(),
        companyName: user.companyName,
        domain: user.domain,
        email: user.email,
        planType: user.planType,
        isActive: user.isActive,
        paymentStatus: user.paymentStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        role,
        isAdmin: role === 'admin' || role === 'superadmin',
      },
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { companyName, domain, email, password, captchaToken } = req.body;
    if (!companyName || !email || !password || !(await verifyTurnstile(captchaToken))) return res.json({ error: 'Completa todos los campos y la verificación de seguridad' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.json({ error: 'El email ya está registrado' });

    if (domain) {
      const existingDomain = await User.findOne({ domain });
      if (existingDomain) return res.json({ error: 'El dominio ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      companyName,
      domain,
      email: email.toLowerCase(),
      password: hash,
      planType: 'pending',
      isActive: true,
      paymentStatus: 'pending_approval',
    });

    const token = jwt.sign({ userId: user._id, email: user.email }, CONFIG.JWT_SECRET, { expiresIn: '24h' });

    AuditLog.create({ userId: user._id, action: 'register', ipAddress: req.ip, userAgent: req.headers['user-agent'], details: { companyName } }).catch(() => {});

    res.json({
      token,
      user: {
        user_id: user._id.toString(),
        companyName: user.companyName,
        domain: user.domain,
        email: user.email,
        planType: user.planType,
        isActive: user.isActive,
        paymentStatus: user.paymentStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        role: 'user',
        isAdmin: false,
      },
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/changePassword', async (req, res) => {
  try {
    const { token: authToken, newPassword } = req.body;
    const user = await validateToken(authToken);
    if (!user) return res.json({ error: 'token inválido' });

    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user.UserID, { password: hash });
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Admin: delete user
router.delete('/auth/users/:userId', async (req, res) => {
  try {
    const { token } = req.query;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

    const deleted = await User.findByIdAndDelete(req.params.userId);
    if (!deleted) return res.json({ error: 'User not found' });

    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

export default router;

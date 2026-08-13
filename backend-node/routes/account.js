import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TOTP, generateSecret } from 'otplib';
import { crypto } from '@otplib/plugin-crypto-noble';
import { base32 } from '@otplib/plugin-base32-scure';
import QRCode from 'qrcode';
import { CONFIG } from '../config.js';
import { User } from '../models/db.js';
import { validateToken } from '../middleware/auth.js';

const totp = new TOTP({ crypto, base32 });

const router = Router();

// ─── Helper: generate temp token for 2FA login step ───
function tempToken(userId) {
  return jwt.sign({ userId, type: '2fa' }, CONFIG.JWT_SECRET, { expiresIn: '5m' });
}

// ─── 2FA: Generate secret & QR ───
router.post('/2fa/setup', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await validateToken(token);
    if (!user) return res.json({ error: 'Token inválido' });

    const secret = generateSecret();
    const otpauth = `otpauth://totp/SecureLab:${encodeURIComponent(user.email)}?secret=${secret}&issuer=SecureLab`;

    await User.findByIdAndUpdate(user.UserID, { twoFactorSecret: secret, twoFactorEnabled: false });

    const qrDataUrl = await QRCode.toDataURL(otpauth);

    res.json({ secret, qrDataUrl, otpauth });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ─── 2FA: Verify & enable ───
router.post('/2fa/verify', async (req, res) => {
  try {
    const { token, code } = req.body;
    const user = await validateToken(token);
    if (!user) return res.json({ error: 'Token inválido' });

    if (!user.twoFactorSecret) return res.json({ error: 'Primero genera el código de configuración' });

    if (!code || !/^\d{6}$/.test(String(code))) {
      return res.json({ error: 'El código debe ser de 6 dígitos' });
    }

    const isValid = await totp.verify(String(code), { secret: user.twoFactorSecret });
    if (!isValid) return res.json({ error: 'Código inválido. Intenta de nuevo.' });

    await User.findByIdAndUpdate(user.UserID, { twoFactorEnabled: true });
    res.json({ success: true, message: '2FA activado correctamente' });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ─── 2FA: Disable ───
router.post('/2fa/disable', async (req, res) => {
  try {
    const { token, code, password } = req.body;
    const user = await validateToken(token);
    if (!user) return res.json({ error: 'Token inválido' });

    if (!user.twoFactorSecret) return res.json({ error: '2FA no está configurado' });

    // Verify 2FA code first
    if (!code || !/^\d{6}$/.test(String(code))) {
      return res.json({ error: 'El código 2FA debe ser de 6 dígitos' });
    }
    const codeValid = await totp.verify(String(code), { secret: user.twoFactorSecret });
    if (!codeValid) return res.json({ error: 'Código 2FA inválido' });

    // Verify password — fetch with password since validateToken excludes it
    const userWithPw = await User.findById(user.UserID).select('+password');
    if (!userWithPw || !userWithPw.password) return res.json({ error: 'Usuario no encontrado' });

    const pwValid = await bcrypt.compare(password, userWithPw.password);
    if (!pwValid) return res.json({ error: 'Contraseña incorrecta' });

    await User.findByIdAndUpdate(user.UserID, { twoFactorSecret: '', twoFactorEnabled: false });
    res.json({ success: true, message: '2FA desactivado correctamente' });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ─── 2FA: Complete login (second step) ───
router.post('/2fa/complete-login', async (req, res) => {
  try {
    const { tempToken: tToken, code } = req.body;
    if (!tToken || !code) return res.json({ error: 'Datos incompletos' });
    if (!/^\d{6}$/.test(String(code))) return res.json({ error: 'El código debe ser de 6 dígitos' });

    let payload;
    try {
      payload = jwt.verify(tToken, CONFIG.JWT_SECRET);
    } catch {
      return res.json({ error: 'Sesión expirada. Inicia sesión de nuevo.' });
    }
    if (payload.type !== '2fa') return res.json({ error: 'Token inválido' });

    const user = await User.findById(payload.userId);
    if (!user || !user.twoFactorEnabled) return res.json({ error: 'Usuario no encontrado o 2FA no activo' });

    const isValid = await totp.verify(String(code), { secret: user.twoFactorSecret });
    if (!isValid) return res.json({ error: 'Código de verificación inválido' });

    const jwtToken = jwt.sign({ userId: user._id, email: user.email }, CONFIG.JWT_SECRET, { expiresIn: '24h' });
    const role = user.role || 'user';
    res.json({
      token: jwtToken,
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

// ─── Change password ───
router.post('/account/change-password', async (req, res) => {
  try {
    const { token, currentPassword, newPassword } = req.body;
    const user = await validateToken(token);
    if (!user) return res.json({ error: 'Token inválido' });

    if (!newPassword || newPassword.length < 6) return res.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });

    const fullUser = await User.findById(user.UserID).select('+password');
    if (!fullUser) return res.json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(currentPassword, fullUser.password);
    if (!valid) return res.json({ error: 'Contraseña actual incorrecta' });

    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user.UserID, { password: hash });
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ─── Change email ───
router.post('/account/change-email', async (req, res) => {
  try {
    const { token, newEmail, password } = req.body;
    const user = await validateToken(token);
    if (!user) return res.json({ error: 'Token inválido' });

    if (!newEmail) return res.json({ error: 'El nuevo email es requerido' });

    const fullUser = await User.findById(user.UserID).select('+password');
    if (!fullUser) return res.json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, fullUser.password);
    if (!valid) return res.json({ error: 'Contraseña incorrecta' });

    const existing = await User.findOne({ email: newEmail.toLowerCase(), _id: { $ne: user.UserID } });
    if (existing) return res.json({ error: 'El email ya está en uso' });

    await User.findByIdAndUpdate(user.UserID, { email: newEmail.toLowerCase() });
    res.json({ success: true, message: 'Email actualizado correctamente', email: newEmail.toLowerCase() });
  } catch (err) {
    res.json({ error: err.message });
  }
});

export default router;

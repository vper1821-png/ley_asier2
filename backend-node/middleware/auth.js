import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CONFIG } from '../config.js';
import { User } from '../models/db.js';

export async function validateToken(token) {
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) return null;
    return { UserID: user._id.toString(), ...user.toObject() };
  } catch {
    return null;
  }
}

export async function authMiddleware(req, res, next) {
  let token = req.body?.token || req.query?.token;
  if (!token) {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) token = auth.slice(7);
  }
  if (!token) return res.json({ error: 'token requerido' });

  const user = await validateToken(token);
  if (!user) return res.json({ error: 'token inválido' });

  req.user = user;
  next();
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function isAdmin(user, minRole = 'admin') {
  const hierarchy = ['user', 'support', 'finance', 'admin', 'superadmin'];
  return hierarchy.indexOf(user?.role) >= hierarchy.indexOf(minRole);
}

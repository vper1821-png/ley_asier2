import { Router } from 'express';
import { User, AuditLog, AdminSettings, Notification } from '../models/db.js';
import Payment from '../models/payment.js';
import { CONFIG } from '../config.js';
import { validateToken, isAdmin } from '../middleware/auth.js';
import { sendNotificationEmail } from '../services/email.js';

const router = Router();

// ─── Admin: list all users with payment info ───
const paymentUsersCache = { data: null, ts: 0 };
router.post('/payments/users', async (req, res) => {
  const { token } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  if (paymentUsersCache.data && Date.now() - paymentUsersCache.ts < 10000) { return res.json(paymentUsersCache.data); }

  const [users, payments] = await Promise.all([
    User.find().select('companyName email planType isActive paymentStatus customPrice bankDetails createdAt').sort({ createdAt: -1 }).lean(),
    Payment.aggregate([
      { $sort: { year: -1, month: -1 } },
      { $group: { _id: '$userId', lastPayment: { $first: '$$ROOT' } } },
    ]).allowDiskUse(true),
  ]);

  const paymentMap = {};
  payments.forEach(p => { if (p._id) paymentMap[p._id.toString()] = p.lastPayment; });

  const result = users.map(u => {
    if (typeof u.bankDetails === 'string') { try { u.bankDetails = JSON.parse(u.bankDetails); } catch {} }
    return { ...u, lastPayment: paymentMap[u._id.toString()] || null };
  });

  paymentUsersCache.data = result;
  paymentUsersCache.ts = Date.now();
  res.json(result);
});

// ─── Admin: update user payment status / price / bank details ───
router.post('/payments/user-update', async (req, res) => {
  const { token, userId, paymentStatus, customPrice, bankName, accountType, accountNumber, rut, email } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  const update = {};
  if (paymentStatus) update.paymentStatus = paymentStatus;
  if (customPrice !== undefined) update.customPrice = Number(customPrice);
  const bd = {};
  if (bankName) bd.bankName = bankName;
  if (accountType) bd.accountType = accountType;
  if (accountNumber) bd.accountNumber = accountNumber;
  if (rut) bd.rut = rut;
  if (email) bd.email = email;
  if (Object.keys(bd).length > 0) update.bankDetails = bd;

  await User.findByIdAndUpdate(userId, update);
  await AuditLog.create({ userId: admin._id, action: `updated_payment_settings for user ${userId}`, resourceId: userId });
  res.json({ success: true });
});

// ─── Admin: record a payment for a user ───
router.post('/payments/record', async (req, res) => {
  const { token, userId, month, year, amount, concept, status } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  const payment = await Payment.create({
    userId,
    month: Number(month),
    year: Number(year),
    amount: Number(amount),
    concept,
    status: status || 'paid',
    paidAt: status === 'paid' ? new Date() : null,
    paidById: admin._id,
  });
  res.json(payment);
});

// ─── Admin: get payment history for a specific user ───
router.post('/payments/history/:userId', async (req, res) => {
  const { token } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  const payments = await Payment.find({ userId: req.params.userId }).sort({ year: -1, month: -1 });
  res.json(payments);
});

// ─── User: get my payment info ───
const paymentInfoCache = new Map();
router.post('/payments/my-info', async (req, res) => {
  const { token } = req.body;
  const user = await validateToken(token);
  if (!user) return res.json({ error: 'token inválido' });

  const cacheKey = user._id.toString();
  const cached = paymentInfoCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 15000) { return res.json(cached.data); }

  const [userData, adminUser] = await Promise.all([
    User.findById(user._id).select('companyName email paymentStatus customPrice bankDetails').lean(),
    User.findOne({ email: CONFIG.ADMIN_EMAIL }).select('bankDetails').lean(),
  ]);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [allPayments] = await Promise.all([
    Payment.find({ userId: user._id }).sort({ year: -1, month: -1 }).limit(24).lean(),
  ]);

  // Auto-create current month payment if missing (async, non-blocking)
  if ((userData.paymentStatus === 'preapproved' || userData.paymentStatus === 'active') && userData.customPrice > 0) {
    const hasCurrent = allPayments.some(p => p.month === currentMonth && p.year === currentYear);
    if (!hasCurrent) {
      Payment.create({ userId: user._id, month: currentMonth, year: currentYear, amount: userData.customPrice, concept: `Pago mensual ${currentMonth}/${currentYear}`, status: 'pending' }).catch(() => {});
    }
  }

  const currentPayment = allPayments.find(p => p.month === currentMonth && p.year === currentYear) || null;
  const history = allPayments;
  const pendingPayments = allPayments.filter(p => p.status === 'pending' || p.status === 'overdue');

  let adminBankDetails = adminUser?.bankDetails || null;
  if (typeof adminBankDetails === 'string') { try { adminBankDetails = JSON.parse(adminBankDetails); } catch {} }
  if (typeof userData.bankDetails === 'string') { try { userData.bankDetails = JSON.parse(userData.bankDetails); } catch {} }

  const data = { user: userData, currentPayment, history, pendingPayments, adminBankDetails };
  paymentInfoCache.set(cacheKey, { data, ts: Date.now() });
  res.json(data);
});

// ─── User: submit payment (mark as paid with concept) ───
router.post('/payments/submit', async (req, res) => {
  const { token, month, year, amount, concept } = req.body;
  const user = await validateToken(token);
  if (!user) return res.json({ error: 'token inválido' });

  if (!concept || !concept.trim()) return res.json({ error: 'Debes ingresar un concepto para identificar el pago' });

  const payment = await Payment.findOneAndUpdate(
    { userId: user._id, month: Number(month), year: Number(year) },
    {
      $setOnInsert: {
        userId: user._id,
        month: Number(month),
        year: Number(year),
        amount: Number(amount),
      },
      $set: {
        concept: concept.trim(),
        status: 'pending',
      },
    },
    { upsert: true, new: true }
  );

  await AuditLog.create({ userId: user._id, action: `submitted_payment ${month}/${year} - ${concept}` });
  res.json(payment);
});

// ─── Admin: approve / reject payment ───
router.post('/payments/verify', async (req, res) => {
  const { token, paymentId, status, notes } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  const update = { status };
  if (status === 'paid') update.paidAt = new Date();
  if (notes) update.notes = notes;

  const payment = await Payment.findByIdAndUpdate(paymentId, update, { new: true });
  res.json(payment);
});

// ─── Admin: get all pending payments ───
router.post('/payments/pending', async (req, res) => {
  const { token } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  const pending = await Payment.find({ status: { $in: ['pending', 'overdue'] } })
    .populate('userId', 'companyName email')
    .sort({ year: -1, month: -1 });
  res.json(pending);
});

// ─── Send payment reminder notification + email ───
router.post('/payments/send-reminder', async (req, res) => {
  const { token, paymentId } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  const payment = await Payment.findById(paymentId).populate('userId');
  if (!payment) return res.json({ error: 'Payment not found' });

  const user = payment.userId;
  const smtpConfig = await AdminSettings.findOne().lean();

  // Create notification
  await Notification.create({
    userId: user._id,
    title: 'Pago Pendiente',
    message: `Tienes un pago pendiente de $${payment.amount} USD correspondiente a ${payment.month}/${payment.year}. Concepto: ${payment.concept || 'Pago mensual'}. Realiza la transferencia a los datos bancarios configurados e ingresa el concepto en tu panel de Pagos.`,
    type: 'payment',
    severity: payment.status === 'overdue' ? 'high' : 'warning',
  });

  // Send email
  if (smtpConfig?.smtpHost) {
    await sendNotificationEmail(smtpConfig, {
      title: 'Recordatorio de Pago — SecureLab',
      message: `Hola ${user.companyName || ''},\n\nTienes un pago pendiente de $${payment.amount} USD correspondiente a ${payment.month}/${payment.year}.\n\nConcepto: ${payment.concept || 'Pago mensual'}\n\nIngresa a tu panel de Pagos en SecureLab para registrar el pago con el concepto correspondiente.\n\nSi ya realizaste el pago, ignora este mensaje.\n\nSaludos,\nEquipo SecureLab`,
      severity: payment.status === 'overdue' ? 'high' : 'warning',
    }, [user.email]);
  }

  res.json({ success: true, notified: true });
});

// ─── Auto-create monthly payments for all active/preapproved users ───
router.post('/payments/auto-create-monthly', async (req, res) => {
  const { token } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const targetUsers = await User.find({
    paymentStatus: { $in: ['preapproved', 'active'] },
    customPrice: { $gt: 0 },
  });

  let created = 0;
  for (const u of targetUsers) {
    const exists = await Payment.findOne({ userId: u._id, month, year });
    if (!exists) {
      await Payment.create({
        userId: u._id,
        month,
        year,
        amount: u.customPrice,
        concept: `Pago mensual ${month}/${year}`,
        status: 'pending',
      });
      created++;
    }
  }

  res.json({ success: true, created, total: targetUsers.length });
});

export default router;

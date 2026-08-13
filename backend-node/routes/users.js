import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, AuditLog, SupportTicket, Scan, Vulnerability, Subdomain, Report, ScheduledScan } from '../models/db.js';
import DatabaseConnection from '../models/databaseConnection.js';
import Alert from '../models/alert.js';
import { DataInventory, DataConsent, BreachReport } from '../models/compliance.js';
import { deleteLogsByUserId } from '../services/localLogStore.js';
import ArcoRequest from '../models/arcoRequest.js';
import { validateToken, isAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/info', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await validateToken(token);
    if (!user) return res.json({ error: 'token inválido' });
    res.json({
      user_id: user.UserID,
      companyName: user.companyName,
      domain: user.domain,
      email: user.email,
      planType: user.planType,
      isActive: user.isActive,
      paymentStatus: user.paymentStatus,
      twoFactorEnabled: user.twoFactorEnabled,
      role: user.role || 'user',
      isAdmin: isAdmin(user),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin-only: list all users
router.post('/list', async (req, res) => {
  try {
    const { token } = req.body;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: create user
router.post('/admin/create-user', async (req, res) => {
  try {
    const { token, companyName, email, domain, password, planType, role, isActive } = req.body;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

    if (!companyName || !email || !password) return res.json({ error: 'companyName, email, and password required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      companyName,
      email: email.toLowerCase(),
      domain: domain || '',
      password: hash,
      planType: planType || 'free',
      isActive: isActive !== false,
      role: role || 'user',
      paymentStatus: 'pending_approval',
    });

    await AuditLog.create({ userId: admin._id, action: 'created_user', details: { email: email.toLowerCase(), companyName } });
    res.json({ success: true, userId: user._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: update user
router.post('/update', async (req, res) => {
  try {
    const { token, userId, planType, isActive, aiRetention, role, suspensionReason } = req.body;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

    const update = {};
    if (planType) update.planType = planType;
    if (isActive !== undefined) update.isActive = isActive === true || isActive === 'true';
    if (aiRetention && ['weekly', 'monthly', 'yearly', 'never'].includes(aiRetention)) update.aiRetention = aiRetention;
    if (role && ['user', 'support', 'finance', 'admin', 'superadmin'].includes(role)) update.role = role;
    if (suspensionReason !== undefined) update.suspensionReason = suspensionReason;
    if (update.isActive === true) update.suspensionReason = '';

    await User.findByIdAndUpdate(userId, update);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: purge AI records for a user
router.post('/purge-ai', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.json({ error: 'User not found' });

    const cutoff = new Date();
    switch (user.aiRetention) {
      case 'weekly': cutoff.setDate(cutoff.getDate() - 7); break;
      case 'monthly': cutoff.setMonth(cutoff.getMonth() - 1); break;
      case 'yearly': cutoff.setFullYear(cutoff.getFullYear() - 1); break;
      default: return res.json({ message: 'Retention set to never, nothing purged' });
    }

    const deletedLogs = await AuditLog.deleteMany({ userId, createdAt: { $lt: cutoff } });
    const deletedTickets = await SupportTicket.deleteMany({ userId, createdAt: { $lt: cutoff } });

    res.json({ success: true, deletedLogs: deletedLogs.deletedCount, deletedTickets: deletedTickets.deletedCount, cutoff });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// Admin: reset user password
router.post('/admin/reset-password', async (req, res) => {
  try {
    const { token, userId, newPassword } = req.body;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });
    if (!newPassword || newPassword.length < 4) return res.json({ error: 'Password must be at least 4 characters' });
    const user = await User.findById(userId);
    if (!user) return res.json({ error: 'User not found' });
    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hash });
    await AuditLog.create({ userId: admin._id, action: 'reset_password', details: { targetUser: user.email } });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: update user full details (companyName, email, domain, planType, etc.)
router.post('/admin/update-user', async (req, res) => {
  try {
    const { token, userId, companyName, email, domain, planType, isActive, aiRetention, role, customPrice, paymentStatus } = req.body;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });
    const user = await User.findById(userId);
    if (!user) return res.json({ error: 'User not found' });
    const update = {};
    if (companyName !== undefined) update.companyName = companyName;
    if (email !== undefined) update.email = email.toLowerCase();
    if (domain !== undefined) update.domain = domain;
    if (planType !== undefined) update.planType = planType;
    if (isActive !== undefined) update.isActive = isActive === true || isActive === 'true';
    if (aiRetention !== undefined && ['weekly', 'monthly', 'yearly', 'never'].includes(aiRetention)) update.aiRetention = aiRetention;
    if (role !== undefined && ['user', 'support', 'finance', 'admin', 'superadmin'].includes(role)) update.role = role;
    if (customPrice !== undefined) update.customPrice = Number(customPrice);
    if (paymentStatus !== undefined) update.paymentStatus = paymentStatus;
    await User.findByIdAndUpdate(userId, update);
    await AuditLog.create({ userId: admin._id, action: 'updated_user_full', details: { targetUser: email || user.email, changes: Object.keys(update) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: get user details (with databases, scans, settings, compliance)
router.post('/admin/user-details', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });
    const user = await User.findById(userId).select('-password').lean();
    if (!user) return res.json({ error: 'User not found' });
    const [databases, scans, scheduledScans, alerts, breaches, inventory, consents, arcoRequests] = await Promise.all([
      DatabaseConnection.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      Scan.find({ userId }).sort({ startedAt: -1 }).limit(20).lean(),
      ScheduledScan.find({ userId }).lean(),
      Alert.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
      BreachReport.find({ userId }).sort({ detectedAt: -1 }).lean(),
      DataInventory.find({ userId }).lean(),
      DataConsent.find({ userId }).lean(),
      ArcoRequest.find({ companyId: userId }).sort({ createdAt: -1 }).lean(),
    ]);
    // Compute per-database compliance scores (Ley 21.719)
    const dbCompliance = databases.map(db => {
      const dbBreaches = breaches.filter(b => b.description?.toLowerCase().includes(db.name?.toLowerCase() || ''));
      const dbInventory = inventory.filter(i => i.storageLocation?.toLowerCase().includes(db.name?.toLowerCase() || ''));
      const hasConsent = dbInventory.every(i => {
        if (i.legalBasis && i.legalBasis !== 'consent') return true;
        const invPurpose = (i.purpose || '').trim().toLowerCase();
        if (!invPurpose) return consents.some(c => !c.revokedAt);
        return consents.some(c => !c.revokedAt && (c.purpose || '').trim().toLowerCase() === invPurpose);
      });
      const openBreaches = dbBreaches.filter(b => b.status !== 'resolved');
      const score = Math.max(0, Math.min(100,
        (hasConsent ? 30 : 0) +
        (dbInventory.length > 0 ? 25 : 0) +
        (openBreaches.length === 0 ? 25 : 0) +
        (db.metrics?.lastScanned ? 20 : 0)
      ));
      return {
        dbId: db._id,
        dbName: db.name,
        engine: db.engine,
        ssl: db.ssl || false,
        encryption: db.metrics?.encryption || false,
        accessControl: db.metrics?.accessControl || false,
        auditLogging: db.metrics?.auditLogging || false,
        backupEncryption: db.metrics?.backupEncryption || false,
        tablesCount: db.metrics?.tablesCount || 0,
        recordsCount: db.metrics?.recordsCount || 0,
        lastScanned: db.metrics?.lastScanned,
        complianceScore: score,
        compliant: score >= 70,
        openBreaches: openBreaches.length,
        consentOk: hasConsent,
        inventoryCount: dbInventory.length,
      };
    });
    const vulnerableUsersCount = inventory.filter(i => i.sensitive || i.risk === 'high' || i.risk === 'critical').length;
    const openBreachesCount = breaches.filter(b => b.status !== 'resolved').length;
    const dpdRequestsPending = arcoRequests.filter(r => r.estado === 'pending' || r.estado === 'in_progress').length;
    const avgComplianceScore = dbCompliance.length > 0
      ? Math.round(dbCompliance.reduce((sum, db) => sum + db.complianceScore, 0) / dbCompliance.length)
      : 0;
    res.json({
      user,
      databases,
      scans,
      scheduledScans,
      alerts,
      compliance: {
        dbCompliance,
        avgComplianceScore,
        compliantDbs: dbCompliance.filter(db => db.compliant).length,
        totalDbs: dbCompliance.length,
        vulnerableUsersCount,
        openBreachesCount,
        dpdRequestsPending,
        totalArcoRequests: arcoRequests.length,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: delete user (full cleanup)
router.post('/admin/delete-user-full', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });
    const user = await User.findById(userId);
    if (!user) return res.json({ error: 'User not found' });
    await Promise.allSettled([
      DatabaseConnection.deleteMany({ userId }),
      Scan.deleteMany({ userId }),
      Vulnerability.deleteMany({ scanId: { $in: (await Scan.find({ userId }).select('_id').lean()).map(s => s._id) } }),
      Subdomain.deleteMany({ scanId: { $in: (await Scan.find({ userId }).select('_id').lean()).map(s => s._id) } }),
      Report.deleteMany({ userId }),
      ScheduledScan.deleteMany({ userId }),
      DataInventory.deleteMany({ userId }),
      Alert.deleteMany({ userId }),
      AuditLog.deleteMany({ userId }),
      deleteLogsByUserId(userId),
      SupportTicket.deleteMany({ userId }),
    ]);
    await User.findByIdAndDelete(userId);
    await AuditLog.create({ userId: admin._id, action: 'deleted_user_full', details: { targetUser: user.email, companyName: user.companyName } });
    res.json({ success: true, message: 'User and all associated data deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: reset 2FA for a user
router.post('/admin/reset-2fa', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.json({ error: 'User not found' });

    await User.findByIdAndUpdate(userId, { twoFactorSecret: '', twoFactorEnabled: false });
    res.json({ success: true, message: '2FA reset for user' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: get audit logs
router.post('/logs', async (req, res) => {
  try {
    const { token } = req.body;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

    const { limit = 200 } = req.body;
    const logs = await AuditLog.find().populate('userId', 'email companyName').sort({ createdAt: -1 }).limit(parseInt(limit)).lean();
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

import { Router } from 'express';
import { AdminSettings, AuditLog, User } from '../models/db.js';
import { validateToken, isAdmin } from '../middleware/auth.js';
import ReportHistory from '../models/reportHistory.js';
import fs from 'fs';

const router = Router();

function getSettings() {
  return AdminSettings.findOne();
}

// ─── Alerts ─────────────────────────────────────────────────────

router.post('/admin/alerts/list', async (req, res) => {
  const { token } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  const settings = await getSettings();
  res.json(settings?.alerts || []);
});

router.post('/admin/alerts/save', async (req, res) => {
  const { token, title, message, type, enabled, showOnLanding, alertId } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  if (!title || !title.trim()) return res.json({ error: 'Title required' });

  let settings = await getSettings();
  if (!settings) {
    settings = await AdminSettings.create({});
  }

  const alert = {
    title: title.trim(),
    message: message || '',
    type: type || 'info',
    enabled: enabled === 'true' || enabled === true,
    showOnLanding: showOnLanding === 'true' || showOnLanding === true,
    createdAt: new Date(),
  };

  if (alertId) {
    await AdminSettings.findOneAndUpdate(
      { 'alerts._id': alertId },
      { $set: {
        'alerts.$.title': alert.title,
        'alerts.$.message': alert.message,
        'alerts.$.type': alert.type,
        'alerts.$.enabled': alert.enabled,
        'alerts.$.showOnLanding': alert.showOnLanding,
      }}
    );
  } else {
    await AdminSettings.findOneAndUpdate(
      {},
      { $push: { alerts: alert } },
      { upsert: true }
    );
  }

  await AuditLog.create({ userId: admin._id, action: alertId ? 'updated_alert' : 'created_alert', details: { title } });
  res.json({ success: true });
});

router.post('/admin/alerts/toggle', async (req, res) => {
  const { token, alertId, enabled } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  await AdminSettings.findOneAndUpdate(
    { 'alerts._id': alertId },
    { $set: { 'alerts.$.enabled': enabled === 'true' || enabled === true } }
  );

  res.json({ success: true });
});

router.post('/admin/alerts/delete', async (req, res) => {
  const { token, alertId } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  await AdminSettings.findOneAndUpdate(
    {},
    { $pull: { alerts: { _id: alertId } } }
  );

  await AuditLog.create({ userId: admin._id, action: 'deleted_alert' });
  res.json({ success: true });
});

// Public endpoint - no auth needed
router.post('/admin/alerts/public', async (_req, res) => {
  const settings = await getSettings();
  const alerts = (settings?.alerts || []).filter(a => a.enabled);
  res.json(alerts);
});

// ─── Maintenance ────────────────────────────────────────────────

router.post('/admin/maintenance/status', async (_req, res) => {
  const settings = await getSettings();
  if (!settings) return res.json({ maintenanceMode: false, maintenanceMessage: '', maintenanceScheduledAt: null });

  let active = settings.maintenanceMode;
  if (settings.maintenanceScheduledAt && new Date(settings.maintenanceScheduledAt) <= new Date()) {
    active = true;
  }

  res.json({
    maintenanceMode: active,
    maintenanceMessage: settings.maintenanceMessage || '',
    maintenanceScheduledAt: settings.maintenanceScheduledAt,
  });
});

router.post('/admin/maintenance/toggle', async (req, res) => {
  const { token, maintenanceMode, maintenanceMessage, maintenanceScheduledAt } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  const update = {};
  if (maintenanceMode !== undefined) update.maintenanceMode = maintenanceMode === 'true' || maintenanceMode === true;
  if (maintenanceMessage !== undefined) update.maintenanceMessage = maintenanceMessage;
  if (maintenanceScheduledAt !== undefined) update.maintenanceScheduledAt = maintenanceScheduledAt || null;

  await AdminSettings.findOneAndUpdate({}, { $set: update }, { upsert: true });

  await AuditLog.create({ userId: admin._id, action: 'toggled_maintenance', details: { maintenanceMode: update.maintenanceMode } });
  res.json({ success: true });
});

// ─── Enhanced Audit Logs ────────────────────────────────────────

router.post('/admin/audit-logs', async (req, res) => {
  const { token, limit = 100, offset = 0, search, companyName, actionFilter, startDate, endDate } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });

  const query = {};

  if (search) {
    const users = await User.find({
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ]
    }).select('_id').lean();
    const userIds = users.map(u => u._id);
    query.userId = { $in: userIds };
  }

  if (companyName) {
    const users = await User.find({ companyName: { $regex: companyName, $options: 'i' } }).select('_id').lean();
    const userIds = users.map(u => u._id);
    if (query.userId) {
      query.userId.$in = query.userId.$in.filter(id => userIds.includes(id));
    } else {
      query.userId = { $in: userIds };
    }
  }

  if (actionFilter) {
    query.action = { $regex: actionFilter, $options: 'i' };
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('userId', 'email companyName')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  res.json({ logs, total, offset: parseInt(offset), limit: parseInt(limit) });
});

// ─── Dashboard status (for maintenance check) ──────────────────

router.post('/admin/dashboard-status', async (req, res) => {
  const { token } = req.body;
  const user = await validateToken(token);
  if (!user) return res.json({ error: 'token invalido' });

  const settings = await getSettings();
  let maintenanceMode = false;
  if (settings?.maintenanceMode) {
    maintenanceMode = true;
  }
  if (settings?.maintenanceScheduledAt && new Date(settings.maintenanceScheduledAt) <= new Date()) {
    maintenanceMode = true;
  }

  const isAdminUser = isAdmin(user);
  const alerts = (settings?.alerts || []).filter(a => a.enabled);

  res.json({
    maintenanceMode: maintenanceMode && !isAdminUser,
    maintenanceMessage: settings?.maintenanceMessage || '',
    alerts,
    isAdmin: isAdminUser,
  });
});

// ─── Admin Report Management ──────────────────────────────────────

router.post('/admin/reports/list', async (req, res) => {
  const { token, userId, search } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });
  try {
    const query = {};
    if (userId) query.userId = userId;
    const reports = await ReportHistory.find(query).sort({ createdAt: -1 }).limit(200).populate('userId', 'email companyName').lean();
    let mapped = reports.map(r => ({
      _id: r._id, title: r.title, type: r.type, fileSize: r.fileSize,
      createdAt: r.createdAt, userEmail: r.userId?.email || 'Desconocido',
      companyName: r.userId?.companyName || '', userId: r.userId?._id || r.userId,
    }));
    if (search) {
      const q = search.toLowerCase();
      mapped = mapped.filter(r => r.companyName.toLowerCase().includes(q) || r.title.toLowerCase().includes(q));
    }
    res.json(mapped);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/admin/reports/delete', async (req, res) => {
  const { token, reportId } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });
  try {
    const report = await ReportHistory.findById(reportId);
    if (!report) return res.json({ error: 'Reporte no encontrado' });
    if (fs.existsSync(report.filePath)) {
      try { fs.unlinkSync(report.filePath); } catch {}
    }
    await ReportHistory.deleteOne({ _id: reportId });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;

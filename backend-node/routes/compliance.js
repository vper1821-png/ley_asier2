import { Router } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { DataConsent, DataInventory, BreachReport, ComplianceConfig, TrainingRecord, ConsentTemplate, PseudonymizationRule, DataProtectionImpactAssessment, DataProcessingAgreement, ComplianceInvite } from '../models/compliance.js';
import ArcoRequest from '../models/arcoRequest.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuditLog } from '../models/compliance.js';
import { AdminSettings } from '../models/db.js';
import { sendComplianceInviteEmail } from '../services/email.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
import PDFDocument from 'pdfkit';

const router = Router();

// ---- Compliance Config ----
router.get('/compliance/config', authMiddleware, async (req, res) => {
  try {
    let config = await ComplianceConfig.findOne({ userId: req.user.UserID });
    if (!config) config = await ComplianceConfig.create({ userId: req.user.UserID, companyName: req.user.companyName });
    res.json(config);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/config', authMiddleware, async (req, res) => {
  try {
    let config = await ComplianceConfig.findOne({ userId: req.user.UserID });
    if (!config) config = new ComplianceConfig({ userId: req.user.UserID });
    const allowed = ['companyRut', 'companyName', 'dpdName', 'dpdEmail', 'dpdPhone', 'apdpRegistered', 'apdpRegistrationDate', 'complianceLevel', 'lastAudit', 'nextAudit', 'dataRetentionPolicy', 'internationalTransfer', 'internationalTransferCountries', 'consentVersion', 'privacyPolicyUrl', 'privacyPolicyUpdatedAt', 'cookiesPolicyUrl', 'arcoUrls', 'measureOverrides'];
    const updates = {};
    allowed.forEach(k => {
      if (req.body[k] !== undefined) {
        if (k === 'apdpRegistered' || k === 'internationalTransfer') {
          updates[k] = req.body[k] === true || req.body[k] === 'true';
        } else if (k === 'complianceLevel') {
          const valid = ['basic', 'intermediate', 'advanced', 'certified'];
          updates[k] = valid.includes(req.body[k]) ? req.body[k] : 'basic';
        } else if (k === 'measureOverrides') {
          try {
            let val = req.body[k];
            if (typeof val === 'string') val = JSON.parse(val);
            if (Array.isArray(val)) {
              updates[k] = val.map(v => ({
                measureId: v.measureId || '',
                completed: v.completed !== false,
                notes: v.notes || '',
                evidence: v.evidence || '',
                completedAt: v.completedAt ? new Date(v.completedAt) : new Date(),
              }));
            }
          } catch {}
        } else {
          updates[k] = req.body[k];
        }
      }
    });
    config.set(updates);
    await config.save();
    res.json(config);
  } catch (e) { console.error('[SAVE CONFIG ERROR]', e.message, e.stack); res.status(500).json({ error: e.message }); }
});

// ---- Data Consents ----
router.get('/compliance/consents', authMiddleware, async (req, res) => {
  try {
    const { search, active } = req.query;
    const filter = { userId: req.user.UserID };
    if (active === 'true') filter.revokedAt = null;
    if (active === 'false') filter.revokedAt = { $ne: null };
    if (search) filter.titularEmail = new RegExp(escapeRegex(search), 'i');
    const consents = await DataConsent.find(filter).sort({ grantedAt: -1 }).limit(200);
    res.json(consents);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/consents', authMiddleware, async (req, res) => {
  try {
    const consent = await DataConsent.create({ userId: req.user.UserID, ...req.body });
    res.json(consent);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/consents/:id/revoke', authMiddleware, async (req, res) => {
  try {
    const consent = await DataConsent.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { revokedAt: new Date() },
      { new: true }
    );
    if (!consent) return res.status(404).json({ error: 'Consentimiento no encontrado' });
    res.json(consent);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/compliance/consents/:id', authMiddleware, async (req, res) => {
  try {
    const allowed = ['titularEmail', 'titularName', 'titularRut', 'purpose', 'dataCategories', 'source'];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    const consent = await DataConsent.findOneAndUpdate({ _id: req.params.id, userId: req.user.UserID }, updates, { new: true });
    if (!consent) return res.status(404).json({ error: 'Consentimiento no encontrado' });
    res.json(consent);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Data Inventory ----
router.get('/compliance/inventory', authMiddleware, async (req, res) => {
  try {
    const items = await DataInventory.find({ userId: req.user.UserID }).sort({ risk: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const SENSITIVE_KEYWORDS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'apikey', 'api_key', 'api-secret',
  'private_key', 'privatekey', 'certificate', 'cert', 'keyfile', 'credential',
  'auth', 'authorization', 'bearer', 'jwt', 'refresh_token', 'access_token',
  'hash', 'salt', 'pepper', 'cipher', 'encrypt', 'decrypt', 'crypto',
  'security_question', 'security_answer', 'pin', 'otp', '2fa', 'mfa',
  'ssn', 'social_security', 'passport', 'driver_license', 'national_id',
  'health', 'medical', 'biometric', 'fingerprint', 'dna', 'genetic',
  'financial', 'bank', 'credit_card', 'card_number', 'cvv', 'cvc',
  'routing_number', 'account_number', 'iban', 'swift', 'bic',
];

router.post('/compliance/inventory', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    const dataType = (body.dataType || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    const isSensitiveKeyword = SENSITIVE_KEYWORDS.some(kw => dataType.includes(kw));
    if (isSensitiveKeyword) body.sensitive = true;
    const filter = { userId: req.user.UserID, category: body.category, dataType: body.dataType };
    const item = await DataInventory.findOneAndUpdate(filter, { $set: { ...body, userId: req.user.UserID, updatedAt: new Date() } }, { upsert: true, new: true });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/compliance/inventory', authMiddleware, async (req, res) => {
  try {
    await DataInventory.deleteMany({ userId: req.user.UserID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/compliance/inventory/:id', authMiddleware, async (req, res) => {
  try {
    await DataInventory.deleteOne({ _id: req.params.id, userId: req.user.UserID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/compliance/inventory/:id', authMiddleware, async (req, res) => {
  try {
    const allowed = ['category', 'dataType', 'sensitive', 'storage', 'storageLocation', 'retentionDays', 'purpose', 'legalBasis', 'sharedWith', 'securityMeasures', 'risk'];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    const item = await DataInventory.findOneAndUpdate({ _id: req.params.id, userId: req.user.UserID }, updates, { new: true });
    if (!item) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Breach Reports ----
router.get('/compliance/breaches', authMiddleware, async (req, res) => {
  try {
    const breaches = await BreachReport.find({ userId: req.user.UserID }).sort({ detectedAt: -1 });
    res.json(breaches);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/breaches', authMiddleware, async (req, res) => {
  try {
    const breach = await BreachReport.create({ userId: req.user.UserID, ...req.body });
    // Auto-notify if critical/ sensitive data involved
    if (breach.severity === 'critical' || breach.sensitiveDataInvolved || breach.childrenDataInvolved) {
      breach.status = 'reported';
      breach.reportedAt = new Date();
      breach.notifiedAPDP = true;
      breach.notifiedAt = new Date();
      await breach.save();
      // Send actual email notification to APDP contact and affected parties
      try {
        const { AdminSettings } = await import('../models/db.js');
        const { sendNotificationEmail } = await import('../services/email.js');
        const adminSettings = await AdminSettings.findOne().lean();
        if (adminSettings?.smtpHost && adminSettings?.smtpUser) {
          const apdpEmail = adminSettings.contactEmail || 'notificaciones@apdp.gob.cl';
          const notification = {
            title: `[URGENTE] Brecha de Seguridad - Notificación APDP (Art. 14 sexies)`,
            message: `Se ha detectado una brecha de seguridad que requiere notificación obligatoria a la APDP.\n\nTipo: ${breach.type}\nSeveridad: ${breach.severity}\nFecha de detección: ${breach.detectedAt}\nDatos afectados: ${(breach.affectedData || []).join(', ')}\nUsuarios afectados: ${breach.affectedUsers || 'N/A'}\nDatos sensibles: ${breach.sensitiveDataInvolved ? 'SÍ' : 'No'}\nDatos de menores: ${breach.childrenDataInvolved ? 'SÍ' : 'No'}\nDatos económicos: ${breach.economicDataInvolved ? 'SÍ' : 'No'}\n\nDescripción: ${breach.description}\n\nEsta notificación ha sido generada automáticamente por el sistema de cumplimiento conforme al Art. 14 sexies de la Ley 21.719.`,
            severity: 'critical',
          };
          await sendNotificationEmail(adminSettings, notification, [apdpEmail]);
          console.log(`[BREACH] APDP notification sent for breach ${breach._id}`);
        }
      } catch (emailErr) {
        console.error('[BREACH] Email notification error:', emailErr.message);
      }
    }
    res.json(breach);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/breaches/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const allowed = ['rootCause', 'containmentActions', 'description', 'affectedData', 'severity', 'resolvedType', 'notes'];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    updates.status = 'resolved';
    updates.resolvedAt = new Date();
    updates.notifiedAPDP = true;
    const breach = await BreachReport.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      updates,
      { new: true }
    );
    if (!breach) return res.status(404).json({ error: 'Brecha no encontrada' });
    res.json(breach);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Consent Templates ----
router.get('/compliance/templates', authMiddleware, async (req, res) => {
  try {
    const templates = await ConsentTemplate.find({ userId: req.user.UserID });
    res.json(templates);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/templates', authMiddleware, async (req, res) => {
  try {
    const template = await ConsentTemplate.create({ userId: req.user.UserID, ...req.body });
    res.json(template);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/compliance/templates/:id', authMiddleware, async (req, res) => {
  try {
    await ConsentTemplate.deleteOne({ _id: req.params.id, userId: req.user.UserID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Consolidated overview (replaces 7 separate calls) ----
router.get('/compliance/overview', authMiddleware, async (req, res) => {
  try {
    const [config, consents, inventory, breaches, templates, trainings, arcoRequests, totalConsents, activeConsents, inventoryItems, sensitiveItems, totalBreaches, activeBreaches, criticalBreaches, totalArco, pendingArco, completedArco, arcoByType, totalTrainings, completedTrainings] = await Promise.all([
      ComplianceConfig.findOne({ userId: req.user.UserID }),
      DataConsent.find({ userId: req.user.UserID }).sort({ grantedAt: -1 }).limit(200),
      DataInventory.find({ userId: req.user.UserID }).sort({ risk: -1 }).limit(200),
      BreachReport.find({ userId: req.user.UserID }).sort({ detectedAt: -1 }).limit(100),
      ConsentTemplate.find({ userId: req.user.UserID }).sort({ createdAt: -1 }).limit(50),
      TrainingRecord.find({ userId: req.user.UserID }).sort({ date: -1 }).limit(200),
      ArcoRequest.find({ userId: req.user.UserID }).sort({ submittedAt: -1 }).limit(200),
      DataConsent.countDocuments({ userId: req.user.UserID }),
      DataConsent.countDocuments({ userId: req.user.UserID, revokedAt: null }),
      DataInventory.countDocuments({ userId: req.user.UserID }),
      DataInventory.countDocuments({ userId: req.user.UserID, sensitive: true }),
      BreachReport.countDocuments({ userId: req.user.UserID }),
      BreachReport.countDocuments({ userId: req.user.UserID, status: { $ne: 'resolved' } }),
      BreachReport.countDocuments({ userId: req.user.UserID, severity: 'critical' }),
      ArcoRequest.countDocuments({ userId: req.user.UserID }),
      ArcoRequest.countDocuments({ userId: req.user.UserID, status: { $in: ['pending', 'in_progress'] } }),
      ArcoRequest.countDocuments({ userId: req.user.UserID, status: 'completed' }),
      ArcoRequest.aggregate([
        { $match: { userId: req.user.UserID } },
        { $group: { _id: '$tipo', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, pending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'in_progress']] }, 1, 0] } } } },
      ]),
      TrainingRecord.countDocuments({ userId: req.user.UserID }),
      TrainingRecord.countDocuments({ userId: req.user.UserID, completed: true }),
    ]);
    res.json({
      config: config || {},
      consents,
      inventory,
      breaches,
      templates,
      trainings,
      arcoRequests,
      stats: {
        totalConsents,
        activeConsents,
        inventoryItems,
        sensitiveItems,
        totalBreaches,
        activeBreaches,
        criticalBreaches,
        complianceLevel: config?.complianceLevel || 'basic',
        dpdAssigned: !!config?.dpdEmail,
        apdpRegistered: config?.apdpRegistered || false,
        totalArco,
        pendingArco,
        completedArco,
        arcoByType,
        totalTrainings,
        completedTrainings,
      },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Stats for dashboard ----
router.get('/compliance/stats', authMiddleware, async (req, res) => {
  try {
    const [totalConsents, activeConsents, inventoryItems, sensitiveItems, totalBreaches, activeBreaches, criticalBreaches, config, totalArco, pendingArco, completedArco, arcoByType, totalTrainings, completedTrainings, auditLogCount] = await Promise.all([
      DataConsent.countDocuments({ userId: req.user.UserID }),
      DataConsent.countDocuments({ userId: req.user.UserID, revokedAt: null }),
      DataInventory.countDocuments({ userId: req.user.UserID }),
      DataInventory.countDocuments({ userId: req.user.UserID, sensitive: true }),
      BreachReport.countDocuments({ userId: req.user.UserID }),
      BreachReport.countDocuments({ userId: req.user.UserID, status: { $ne: 'resolved' } }),
      BreachReport.countDocuments({ userId: req.user.UserID, severity: 'critical' }),
      ComplianceConfig.findOne({ userId: req.user.UserID }),
      ArcoRequest.countDocuments({ userId: req.user.UserID }),
      ArcoRequest.countDocuments({ userId: req.user.UserID, status: { $in: ['pending', 'in_progress'] } }),
      ArcoRequest.countDocuments({ userId: req.user.UserID, status: 'completed' }),
      ArcoRequest.aggregate([
        { $match: { userId: req.user.UserID } },
        { $group: { _id: '$tipo', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, pending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'in_progress']] }, 1, 0] } } } },
      ]),
      TrainingRecord.countDocuments({ userId: req.user.UserID }),
      TrainingRecord.countDocuments({ userId: req.user.UserID, completed: true }),
      AuditLog.countDocuments({ userId: req.user.UserID }),
    ]);
    res.json({
      totalConsents,
      activeConsents,
      inventoryItems,
      sensitiveItems,
      totalBreaches,
      activeBreaches,
      criticalBreaches,
      complianceLevel: config?.complianceLevel || 'basic',
      dpdAssigned: !!config?.dpdEmail,
      apdpRegistered: config?.apdpRegistered || false,
      totalArco,
      pendingArco,
      completedArco,
      arcoByType,
      totalTrainings,
      completedTrainings,
      auditLogCount,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- ARCO Requests ----
router.get('/compliance/arco-requests', authMiddleware, async (req, res) => {
  try {
    const { tipo, status, search } = req.query;
    const filter = { userId: req.user.UserID };
    if (tipo && tipo !== 'all') filter.tipo = tipo;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { titularName: { $regex: safe, $options: 'i' } },
        { titularEmail: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }
    const requests = await ArcoRequest.find(filter).sort({ submittedAt: -1 }).limit(200);
    res.json(requests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/arco-requests', authMiddleware, async (req, res) => {
  try {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    const request = await ArcoRequest.create({
      userId: req.user.UserID,
      ...req.body,
      deadline,
      submittedAt: new Date(),
      status: 'pending',
    });
    res.json(request);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/arco-requests/:id/respond', authMiddleware, async (req, res) => {
  try {
    const allowed = ['response', 'respuesta'];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    updates.status = 'completed';
    updates.completedAt = new Date();
    const request = await ArcoRequest.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      updates,
      { new: true }
    );
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
    res.json(request);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/arco-requests/:id/reject', authMiddleware, async (req, res) => {
  try {
    const allowed = ['response', 'respuesta'];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    updates.status = 'rejected';
    updates.completedAt = new Date();
    if (!updates.response && !updates.respuesta) updates.response = 'Solicitud rechazada';
    const request = await ArcoRequest.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      updates,
      { new: true }
    );
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
    res.json(request);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Training Records ----
router.get('/compliance/trainings', authMiddleware, async (req, res) => {
  try {
    const { id } = req.query;
    if (id) {
      const record = await TrainingRecord.findOne({ _id: id, userId: req.user.UserID });
      return res.json(record || { error: 'No encontrado' });
    }
    const records = await TrainingRecord.find({ userId: req.user.UserID }).sort({ date: -1 }).limit(200);
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/compliance/trainings/:id', authMiddleware, async (req, res) => {
  try {
    const record = await TrainingRecord.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!record) return res.status(404).json({ error: 'No encontrado' });
    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/trainings', authMiddleware, async (req, res) => {
  try {
    const record = await TrainingRecord.create({ userId: req.user.UserID, ...req.body });
    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/trainings/:id/complete', authMiddleware, async (req, res) => {
  try {
    const allowed = ['signature', 'signedAt'];
    const updates = { completed: true };
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    const record = await TrainingRecord.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      updates,
      { new: true }
    );
    if (!record) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/compliance/trainings/:id', authMiddleware, async (req, res) => {
  try {
    await TrainingRecord.findOneAndDelete({ _id: req.params.id, userId: req.user.UserID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/trainings/:id/unsign', authMiddleware, async (req, res) => {
  try {
    const record = await TrainingRecord.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { $unset: { signatureData: 1, signedAt: 1 }, completed: false },
      { new: true }
    );
    if (!record) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Compliance Invites (consentimiento / capacitación vía email, link o QR de un solo uso) ----
function buildInviteUrl(baseUrl, token) {
  const base = (baseUrl || '').replace(/\/+$/, '');
  return `${base}/firmar/${token}`;
}

router.post('/compliance/invites', authMiddleware, async (req, res) => {
  try {
    const { kind, recipientEmail, recipientName, recipientRut, purpose, dataCategories, trainingId, channel, expiresHours, baseUrl, sendEmail } = req.body;
    if (!['consent', 'training'].includes(kind)) return res.status(400).json({ error: 'kind inválido' });

    if (kind === 'consent' && !purpose) return res.status(400).json({ error: 'La finalidad (purpose) es requerida' });
    let training = null;
    if (kind === 'training') {
      training = await TrainingRecord.findOne({ _id: trainingId, userId: req.user.UserID });
      if (!training) return res.status(404).json({ error: 'Capacitación no encontrada' });
      if (training.signatureData) return res.status(400).json({ error: 'Esta capacitación ya está firmada' });
    }

    const hours = Math.min(Math.max(parseInt(expiresHours) || 168, 1), 720); // 7 días por defecto, máx 30
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
    const inviteToken = crypto.randomBytes(24).toString('hex');

    const invite = await ComplianceInvite.create({
      userId: req.user.UserID,
      kind,
      token: inviteToken,
      channel: ['email', 'link', 'qr'].includes(channel) ? channel : 'link',
      recipientEmail: recipientEmail || training?.employeeEmail || '',
      recipientName: recipientName || training?.employeeName || '',
      recipientRut: recipientRut || training?.employeeRut || '',
      purpose: purpose || '',
      dataCategories: typeof dataCategories === 'string' ? dataCategories.split(',').map(s => s.trim()).filter(Boolean) : (dataCategories || []),
      trainingId: kind === 'training' ? trainingId : undefined,
      expiresAt,
    });

    const url = buildInviteUrl(baseUrl, inviteToken);
    const qr = await QRCode.toDataURL(url, { width: 320, margin: 2 });

    let emailSent = false;
    let emailError = null;
    if (sendEmail === true || sendEmail === 'true') {
      try {
        const settings = await AdminSettings.findOne().lean();
        await sendComplianceInviteEmail(settings, invite, url, qr);
        invite.sentAt = new Date();
        await invite.save();
        emailSent = true;
      } catch (err) {
        emailError = err.message;
      }
    }

    res.json({ invite, url, qr, emailSent, emailError });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Envío masivo: hasta 100 destinatarios por lote (el frontend divide el CSV en lotes)
router.post('/compliance/invites/bulk', authMiddleware, async (req, res) => {
  try {
    const { kind, purpose, dataCategories, topic, date, expiresHours, baseUrl, sendEmail } = req.body;
    if (!['consent', 'training'].includes(kind)) return res.status(400).json({ error: 'kind inválido' });
    if (kind === 'consent' && !purpose) return res.status(400).json({ error: 'La finalidad (purpose) es requerida' });

    let recipients = [];
    try { recipients = JSON.parse(req.body.recipients || '[]'); } catch { return res.status(400).json({ error: 'recipients inválido (JSON esperado)' }); }
    if (!Array.isArray(recipients) || !recipients.length) return res.status(400).json({ error: 'Sin destinatarios' });
    if (recipients.length > 100) return res.status(400).json({ error: 'Máximo 100 destinatarios por lote' });

    const hours = Math.min(Math.max(parseInt(expiresHours) || 168, 1), 720);
    const cats = typeof dataCategories === 'string' ? dataCategories.split(',').map(s => s.trim()).filter(Boolean) : (dataCategories || []);
    const doEmail = sendEmail === true || sendEmail === 'true';
    const settings = doEmail ? await AdminSettings.findOne().lean() : null;
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    let created = 0;
    let emailsSent = 0;
    const failed = [];

    for (const r of recipients) {
      const email = String(r.email || '').trim().toLowerCase();
      if (!emailRegex.test(email)) { failed.push({ email: r.email || '(vacío)', error: 'Email inválido' }); continue; }
      try {
        let trainingId;
        if (kind === 'training') {
          const training = await TrainingRecord.create({
            userId: req.user.UserID,
            employeeName: r.name || email,
            employeeEmail: email,
            employeeRut: r.rut || '',
            employeePosition: r.position || '',
            employeeDepartment: r.department || '',
            topic: topic || 'ley_21719',
            date: date ? new Date(date) : new Date(),
          });
          trainingId = training._id;
        }

        const inviteToken = crypto.randomBytes(24).toString('hex');
        const invite = await ComplianceInvite.create({
          userId: req.user.UserID,
          kind,
          token: inviteToken,
          channel: 'email',
          recipientEmail: email,
          recipientName: r.name || '',
          recipientRut: r.rut || '',
          purpose: purpose || '',
          dataCategories: cats,
          trainingId,
          expiresAt: new Date(Date.now() + hours * 3600 * 1000),
        });
        created++;

        if (doEmail) {
          const url = buildInviteUrl(baseUrl, inviteToken);
          const qr = await QRCode.toDataURL(url, { width: 320, margin: 2 });
          try {
            await sendComplianceInviteEmail(settings, invite, url, qr);
            invite.sentAt = new Date();
            await invite.save();
            emailsSent++;
          } catch (err) {
            failed.push({ email, error: 'Invitación creada pero email no enviado: ' + err.message });
          }
        }
      } catch (err) {
        failed.push({ email, error: err.message });
      }
    }

    res.json({ total: recipients.length, created, emailsSent, failed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/compliance/invites', authMiddleware, async (req, res) => {
  try {
    const invites = await ComplianceInvite.find({ userId: req.user.UserID }).sort({ createdAt: -1 }).limit(100);
    res.json(invites);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/compliance/invites/:id', authMiddleware, async (req, res) => {
  try {
    await ComplianceInvite.deleteOne({ _id: req.params.id, userId: req.user.UserID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Público: información de la invitación (sin auth)
router.get('/compliance/public/invites/:token', async (req, res) => {
  try {
    const invite = await ComplianceInvite.findOne({ token: req.params.token });
    if (!invite) return res.status(404).json({ error: 'Invitación no encontrada' });
    if (invite.usedAt) return res.json({ status: 'used', kind: invite.kind });
    if (invite.expiresAt < new Date()) return res.json({ status: 'expired', kind: invite.kind });

    const config = await ComplianceConfig.findOne({ userId: invite.userId }).lean();
    const payload = {
      status: 'valid',
      kind: invite.kind,
      companyName: config?.companyName || '',
      dpdEmail: config?.dpdEmail || '',
      recipientEmail: invite.recipientEmail,
      recipientName: invite.recipientName,
      recipientRut: invite.recipientRut,
      expiresAt: invite.expiresAt,
    };
    if (invite.kind === 'consent') {
      payload.purpose = invite.purpose;
      payload.dataCategories = invite.dataCategories;
    } else {
      const training = await TrainingRecord.findById(invite.trainingId).lean();
      if (!training) return res.status(404).json({ error: 'Capacitación no encontrada' });
      payload.training = {
        topic: training.topic,
        date: training.date,
        employeeName: training.employeeName,
        employeePosition: training.employeePosition,
        employeeDepartment: training.employeeDepartment,
        completed: training.completed,
      };
    }
    res.json(payload);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Público: enviar consentimiento o firma (sin auth, un solo uso)
router.post('/compliance/public/invites/:token/submit', async (req, res) => {
  try {
    const invite = await ComplianceInvite.findOne({ token: req.params.token });
    if (!invite) return res.status(404).json({ error: 'Invitación no encontrada' });
    if (invite.usedAt) return res.status(400).json({ error: 'Esta invitación ya fue utilizada' });
    if (invite.expiresAt < new Date()) return res.status(400).json({ error: 'Esta invitación ha expirado' });

    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    if (invite.kind === 'consent') {
      const { titularEmail, titularName, titularRut, accepted } = req.body;
      if (accepted !== true && accepted !== 'true') return res.status(400).json({ error: 'Debes aceptar el consentimiento' });
      const email = titularEmail || invite.recipientEmail;
      if (!email) return res.status(400).json({ error: 'Email requerido' });
      const proofHash = crypto.createHash('sha256')
        .update(`${invite.token}|${email}|${invite.purpose}|${Date.now()}`)
        .digest('hex');
      const consent = await DataConsent.create({
        userId: invite.userId,
        titularEmail: email,
        titularName: titularName || invite.recipientName,
        titularRut: titularRut || invite.recipientRut,
        purpose: invite.purpose,
        dataCategories: invite.dataCategories,
        source: 'web_form',
        proofHash,
        ipAddress,
        userAgent,
      });
      invite.usedAt = new Date();
      invite.resultId = consent._id;
      await invite.save();
      return res.json({ success: true, kind: 'consent' });
    }

    // training
    const { signatureData } = req.body;
    if (!signatureData) return res.status(400).json({ error: 'La firma es requerida' });
    const training = await TrainingRecord.findOneAndUpdate(
      { _id: invite.trainingId, userId: invite.userId },
      { signatureData, signedAt: new Date(), completed: true, acknowledgedContent: true, acknowledgedAt: new Date() },
      { new: true }
    );
    if (!training) return res.status(404).json({ error: 'Capacitación no encontrada' });
    invite.usedAt = new Date();
    invite.resultId = training._id;
    await invite.save();
    res.json({ success: true, kind: 'training' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Pseudonymization Rules (Art. 30) ----
router.get('/compliance/pseudonymization', authMiddleware, async (req, res) => {
  try {
    const rules = await PseudonymizationRule.find({ userId: req.user.UserID }).sort({ createdAt: -1 });
    res.json(rules);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/pseudonymization', authMiddleware, async (req, res) => {
  try {
    const { name, description, databaseId, databaseName, tableName, columnName, method, inventoryItemId } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });
    const rule = await PseudonymizationRule.create({
      userId: req.user.UserID, name, description, databaseName, tableName, columnName,
      method: method || 'hash',
      ...(databaseId && databaseId !== '' ? { databaseId } : {}),
      inventoryItemId,
    });
    res.json(rule);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/compliance/pseudonymization/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, databaseId, databaseName, tableName, columnName, method } = req.body;
    const rule = await PseudonymizationRule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { $set: { name, description, databaseId, databaseName, tableName, columnName, method } },
      { new: true }
    );
    if (!rule) return res.status(404).json({ error: 'regla no encontrada' });
    res.json(rule);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/compliance/pseudonymization/:id', authMiddleware, async (req, res) => {
  try {
    const rule = await PseudonymizationRule.findOneAndDelete({ _id: req.params.id, userId: req.user.UserID });
    if (!rule) return res.status(404).json({ error: 'regla no encontrada' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/pseudonymization/:id/execute', authMiddleware, async (req, res) => {
  try {
    const rule = await PseudonymizationRule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { $set: { status: 'executed', executedAt: new Date() } },
      { new: true }
    );
    if (!rule) return res.status(404).json({ error: 'regla no encontrada' });
    // Auto-add "seudonimización" to linked inventory item's securityMeasures
    const invFilter = { userId: req.user.UserID };
    if (rule.inventoryItemId) {
      invFilter._id = rule.inventoryItemId;
    } else if (rule.databaseId) {
      invFilter.databaseId = rule.databaseId;
    }
    await DataInventory.updateMany(invFilter, { $addToSet: { securityMeasures: 'seudonimización' } });
    res.json(rule);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/pseudonymization/:id/revert', authMiddleware, async (req, res) => {
  try {
    const rule = await PseudonymizationRule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { $set: { status: 'reverted', revertedAt: new Date() } },
      { new: true }
    );
    if (!rule) return res.status(404).json({ error: 'regla no encontrada' });
    res.json(rule);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- DPIA — Evaluación de Impacto (Art. 14 quater / Art. 16) ----
router.get('/compliance/dpia', authMiddleware, async (req, res) => {
  try {
    const items = await DataProtectionImpactAssessment.find({ userId: req.user.UserID }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/dpia', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    // Calculate risk score from risk indicators
    const riskIndicators = [
      body.sensitiveData === 'true', body.childrenData === 'true', body.largeScale === 'true',
      body.automatedDecisions === 'true', body.profiling === 'true', body.biometricData === 'true',
      body.geolocationData === 'true', body.videoSurveillance === 'true',
      body.crossBorderTransfer === 'true', body.vulnerableSubjects === 'true',
      body.systematicMonitoring === 'true', body.newTechnologies === 'true',
    ];
    const trueCount = riskIndicators.filter(Boolean).length;
    const riskScore = Math.min(100, Math.round((trueCount / riskIndicators.length) * 100));
    let riskLevel = 'low';
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';
    body.riskScore = riskScore;
    body.riskLevel = riskLevel;
    // Convert string booleans
    riskIndicators.forEach((_, i) => {
      const key = Object.keys(body).find(k =>
        ['sensitiveData','childrenData','largeScale','automatedDecisions','profiling',
         'biometricData','geolocationData','videoSurveillance','crossBorderTransfer',
         'vulnerableSubjects','systematicMonitoring','newTechnologies'].includes(k)
      );
    });
    const boolFields = ['sensitiveData','childrenData','largeScale','automatedDecisions','profiling',
      'biometricData','geolocationData','videoSurveillance','crossBorderTransfer',
      'vulnerableSubjects','systematicMonitoring','newTechnologies'];
    boolFields.forEach(f => {
      if (body[f] === 'true') body[f] = true;
      else if (body[f] === 'false' || body[f] === undefined) body[f] = false;
    });
    body.userId = req.user.UserID;
    const item = await DataProtectionImpactAssessment.create(body);
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/compliance/dpia/:id', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    const boolFields = ['sensitiveData','childrenData','largeScale','automatedDecisions','profiling',
      'biometricData','geolocationData','videoSurveillance','crossBorderTransfer',
      'vulnerableSubjects','systematicMonitoring','newTechnologies'];
    boolFields.forEach(f => {
      if (body[f] === 'true') body[f] = true;
      else if (body[f] === 'false') body[f] = false;
    });
    // Recalculate risk score
    const riskIndicators = [
      body.sensitiveData === true, body.childrenData === true, body.largeScale === true,
      body.automatedDecisions === true, body.profiling === true, body.biometricData === true,
      body.geolocationData === true, body.videoSurveillance === true,
      body.crossBorderTransfer === true, body.vulnerableSubjects === true,
      body.systematicMonitoring === true, body.newTechnologies === true,
    ];
    const trueCount = riskIndicators.filter(Boolean).length;
    const riskScore = Math.min(100, Math.round((trueCount / riskIndicators.length) * 100));
    let riskLevel = 'low';
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';
    body.riskScore = riskScore;
    body.riskLevel = riskLevel;
    const item = await DataProtectionImpactAssessment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { $set: body },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'DPIA no encontrada' });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/compliance/dpia/:id', authMiddleware, async (req, res) => {
  try {
    await DataProtectionImpactAssessment.findOneAndDelete({ _id: req.params.id, userId: req.user.UserID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/dpia/:id/approve', authMiddleware, async (req, res) => {
  try {
    const item = await DataProtectionImpactAssessment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { $set: { status: 'approved', approvedBy: req.body.approvedBy || req.user.Email, approvedAt: new Date() } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'DPIA no encontrada' });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- DPA — Acuerdos de Tratamiento con Encargados (Art. 9) ----
router.get('/compliance/dpa', authMiddleware, async (req, res) => {
  try {
    const items = await DataProcessingAgreement.find({ userId: req.user.UserID }).sort({ contractDate: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/dpa', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    body.userId = req.user.UserID;
    if (body.dataCategories && typeof body.dataCategories === 'string') body.dataCategories = body.dataCategories.split(',').map(s => s.trim()).filter(Boolean);
    if (body.subProcessors && typeof body.subProcessors === 'string') {
      try { body.subProcessors = JSON.parse(body.subProcessors); } catch (e) { body.subProcessors = []; }
    }
    if (body.securityMeasures && typeof body.securityMeasures === 'string') body.securityMeasures = body.securityMeasures.split(',').map(s => s.trim()).filter(Boolean);
    const item = await DataProcessingAgreement.create(body);
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/compliance/dpa/:id', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.dataCategories && typeof body.dataCategories === 'string') body.dataCategories = body.dataCategories.split(',').map(s => s.trim()).filter(Boolean);
    if (body.subProcessors && typeof body.subProcessors === 'string') {
      try { body.subProcessors = JSON.parse(body.subProcessors); } catch (e) { body.subProcessors = []; }
    }
    if (body.securityMeasures && typeof body.securityMeasures === 'string') body.securityMeasures = body.securityMeasures.split(',').map(s => s.trim()).filter(Boolean);
    const item = await DataProcessingAgreement.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { $set: body },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'DPA no encontrado' });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/compliance/dpa/:id', authMiddleware, async (req, res) => {
  try {
    await DataProcessingAgreement.findOneAndDelete({ _id: req.params.id, userId: req.user.UserID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- ROPA Export (Registro de Actividades de Tratamiento - formato oficial APDP) ----
router.get('/compliance/ropa-export', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.UserID;
    const [config, inventory] = await Promise.all([
      ComplianceConfig.findOne({ userId }),
      DataInventory.find({ userId }).sort({ category: 1, dataType: 1 }),
    ]);

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
    const companyName = config?.companyName || 'Empresa no configurada';
    const M = 45, PW = 841.89, PH = 595.28, W = PW - M * 2;
    const C = { dark: '#1a1a1a', muted: '#777', body: '#1a1a1a', sec: '#555', border: '#bbb', bg: '#f5f5f5', hdr: '#0f172a' };

    const doc = new PDFDocument({ size: 'a4', layout: 'landscape', margin: M, bufferPages: true, info: { Title: 'ROPA - Registro de Actividades de Tratamiento', Author: 'Invisia Compliance', Subject: 'Art. 15 Ley 21.719' } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ROPA_${companyName.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    const rect = (x, y, w, h, color) => { doc.rect(x, y, w, h).fill(color); };

    const pageHdr = () => {
      rect(0, 0, PW, 36, C.hdr);
      doc.fillColor('#fff').fontSize(7.5).font('Helvetica').text('Ley 21.719 · Protección de Datos Personales · Chile', M, 9, { width: W });
      doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold').text('ROPA — Registro de Actividades de Tratamiento', M, 21, { width: W });
      doc.y = 52;
    };

    const sectionTitle = (num, title) => {
      if (doc.y > PH - 50) doc.addPage();
      rect(M, doc.y, 3.5, 18, C.hdr);
      doc.fillColor(C.dark).fontSize(8).font('Helvetica-Bold').text(String(num).padStart(2, '0'), M + 10, doc.y + 1, { width: 25 });
      doc.fillColor(C.dark).fontSize(11).font('Helvetica-Bold').text(title, M + 30, doc.y + 1, { width: W - 40 });
      doc.y += 22;
      doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.y += 8;
    };

    const stamp = () => {
      const pages = doc.bufferedPageRange();
      for (let i = pages.start; i < pages.start + pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(6).fillColor(C.muted).font('Helvetica')
          .text(`Invisia Compliance · ${dateStr}`, M, PH - 20, { width: W, align: 'left', lineBreak: false })
          .text(`Página ${i + 1} de ${pages.count}`, M, PH - 20, { width: W, align: 'right', lineBreak: false });
      }
    };

    // ── Page 1: Cover ──
    pageHdr();
    rect(0, 36, PW, 1, '#000');

    doc.fillColor(C.muted).fontSize(8).font('Helvetica').text('REPÚBLICA DE CHILE', M, 80, { width: W, align: 'center' });
    doc.fillColor(C.muted).fontSize(7).font('Helvetica').text('Ley 21.719 — Protección de Datos Personales', M, 94, { width: W, align: 'center' });

    doc.moveTo(M + 80, 115).lineTo(PW - M - 80, 115).strokeColor('#000').lineWidth(0.5).stroke();

    doc.fillColor(C.body).fontSize(12).font('Helvetica-Bold').text(companyName.toUpperCase(), M, 135, { width: W, align: 'center' });
    doc.fillColor(C.body).fontSize(16).font('Helvetica-Bold').text('Registro de Actividades de\nTratamiento (ROPA)', M, 158, { width: W, align: 'center' });
    doc.fillColor(C.sec).fontSize(9).font('Helvetica').text('Formato Oficial APDP — Art. 15 Ley 21.719', M, 205, { width: W, align: 'center' });

    doc.moveTo(M + 80, 225).lineTo(PW - M - 80, 225).strokeColor('#000').lineWidth(0.5).stroke();

    // Info box
    const bx = M + 80, bw = W - 160;
    rect(bx, 245, bw, 36, C.bg);
    doc.rect(bx, 245, bw, 36).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.fillColor(C.sec).fontSize(7).font('Helvetica').text('FECHA DE EMISIÓN', bx + 10, 252, { width: bw - 20, align: 'center' });
    doc.fillColor(C.body).fontSize(9).font('Helvetica-Bold').text(dateStr, bx + 10, 264, { width: bw - 20, align: 'center' });

    rect(bx, 295, bw, 28, C.bg);
    doc.rect(bx, 295, bw, 28).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.fillColor(C.body).fontSize(7).font('Helvetica-Bold').text('CLASIFICACIÓN: CONFIDENCIAL — USO INTERNO Y/O ANTE LA APDP', bx + 10, 304, { width: bw - 20, align: 'center' });

    doc.y = 345;
    doc.fillColor(C.sec).fontSize(7.5).font('Helvetica').text(`Empresa: ${companyName} · RUT: ${config?.companyRut || '-'}`, M, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.3);
    doc.text(`DPD: ${config?.dpdName || 'No designado'} ${config?.dpdEmail ? '· ' + config.dpdEmail : ''}`, M, doc.y, { width: W, align: 'center' });

    // ── Section 1: Identificación del Responsable ──
    doc.addPage();
    pageHdr();
    sectionTitle(1, 'Identificación del Responsable');

    const infoRows = [
      ['Responsable del Tratamiento', companyName],
      ['RUT', config?.companyRut || '-'],
      ['Delegado de Protección de Datos (DPD)', `${config?.dpdName || 'No designado'} ${config?.dpdEmail ? '· ' + config.dpdEmail : ''} ${config?.dpdPhone ? '· ' + config.dpdPhone : ''}`],
      ['Registro APDP', config?.apdpRegistered ? `Sí (${config?.apdpRegistrationDate ? new Date(config.apdpRegistrationDate).toLocaleDateString('es-CL') : ''})` : 'No'],
      ['Política de Privacidad', config?.privacyPolicyUrl || 'No configurada'],
      ['Política de Cookies', config?.cookiesPolicyUrl || 'No configurada'],
      ['Transferencias Internacionales', config?.internationalTransfer ? `Sí — Países: ${config?.internationalTransferCountries?.join(', ') || 'No especificados'}` : 'No'],
    ];

    for (const [label, value] of infoRows) {
      if (doc.y > PH - 40) { doc.addPage(); pageHdr(); }
      doc.fillColor(C.sec).fontSize(7.5).font('Helvetica').text(label, M + 8, doc.y, { width: 190 });
      doc.fillColor(C.body).fontSize(8).font('Helvetica-Bold').text(value || '-', M + 200, doc.y - 11, { width: W - 210 });
      doc.y += 4;
      doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.border).lineWidth(0.3).stroke();
      doc.y += 6;
    }
    doc.moveDown(1);

    // ── Section 2: Activities table ──
    sectionTitle(2, 'Registro de Actividades de Tratamiento');

    if (inventory.length === 0) {
      doc.fillColor(C.muted).fontSize(8).font('Helvetica-Oblique').text('No hay actividades de tratamiento registradas.', M, doc.y, { width: W });
    } else {
      const hdrs = ['#', 'Categoría', 'Tipo de Dato', 'Finalidad', 'Base Legal', 'Sensible', 'Almacenamiento', 'Retención', 'Riesgo'];
      const cw = [25, 75, 85, 90, 70, 45, 70, 55, 50];
      const hdrH = 20, rowH = 18;
      let y = doc.y;

      const drawTableHeader = (yy) => {
        rect(M, yy, W, hdrH, C.hdr);
        doc.fillColor('#f1f5f9').fontSize(7).font('Helvetica-Bold');
        let x = M + 6;
        hdrs.forEach((h, i) => { doc.text(h, x, yy + 6, { width: cw[i] }); x += cw[i]; });
        return yy + hdrH;
      };

      y = drawTableHeader(y);

      for (let ri = 0; ri < inventory.length; ri++) {
        const i = inventory[ri];
        if (y + rowH > PH - 40) { doc.addPage(); pageHdr(); y = drawTableHeader(doc.y); }
        if (ri % 2 === 1) rect(M, y, W, rowH, '#f1f5f9');

        const cells = [
          String(ri + 1), i.category || '-', i.dataType || '-', i.purpose || '-',
          i.legalBasis || '-', i.sensitive ? 'Sí' : 'No', i.storage || '-',
          i.retentionDays ? `${i.retentionDays} días` : '-',
          i.risk || '-',
        ];

        let x = M + 6;
        cells.forEach((c, ci) => {
          const clr = ci === 5 && i.sensitive ? '#991b1b' : ci === 8 ? (i.risk === 'critical' ? '#991b1b' : i.risk === 'high' ? '#854d0e' : C.body) : C.body;
          doc.fillColor(clr).fontSize(7).font('Helvetica').text(c, x, y + 4, { width: cw[ci] });
          x += cw[ci];
        });
        y += rowH;
      }
      doc.y = y + 12;

      // Extended fields for each item
      doc.fillColor(C.dark).fontSize(8).font('Helvetica-Bold').text('Detalle Extendido por Actividad:', M, doc.y, { width: W });
      doc.moveDown(0.5);

      for (let ri = 0; ri < inventory.length; ri++) {
        const i = inventory[ri];
        if (doc.y > PH - 80) { doc.addPage(); pageHdr(); }

        rect(M, doc.y, W, 16, '#e8edf3');
        doc.fillColor(C.dark).fontSize(7.5).font('Helvetica-Bold').text(`${ri + 1}. ${i.category} — ${i.dataType}`, M + 6, doc.y + 4, { width: W - 12 });
        doc.y += 20;

        const details = [
          ['Almacenamiento', i.storage || '-'],
          ['Ubicación', i.storageLocation || '-'],
          ['Compartido con', Array.isArray(i.sharedWith) && i.sharedWith.length ? i.sharedWith.join(', ') : '-'],
          ['Medidas de seguridad', Array.isArray(i.securityMeasures) && i.securityMeasures.length ? i.securityMeasures.join(', ') : '-'],
          ['Período de retención', i.retentionDays ? `${i.retentionDays} días` : '-'],
        ];
        for (const [lbl, val] of details) {
          doc.fillColor(C.sec).fontSize(7).font('Helvetica').text(`${lbl}: `, M + 12, doc.y, { continued: true, lineBreak: false });
          doc.fillColor(C.body).font('Helvetica').text(val, { lineBreak: false });
        }
        doc.moveDown(0.4);
        doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.border).lineWidth(0.3).stroke();
        doc.y += 5;
      }
    }

    // ── Section 3: Summary ──
    doc.addPage();
    pageHdr();
    sectionTitle(3, 'Resumen del ROPA');

    const totalActs = inventory.length;
    const sensCount = inventory.filter(i => i.sensitive).length;
    const basisMap = {};
    inventory.forEach(i => { basisMap[i.legalBasis] = (basisMap[i.legalBasis] || 0) + 1; });
    const topBasis = Object.entries(basisMap).sort((a, b) => b[1] - a[1])[0];

    const summaryRows = [
      ['Total actividades de tratamiento', String(totalActs)],
      ['Datos personales sensibles', String(sensCount)],
      ['Base legal más utilizada', topBasis ? `${topBasis[0]} (${topBasis[1]})` : '-'],
      ['Nivel de cumplimiento', config?.complianceLevel || 'básico'],
      ['Registro APDP', config?.apdpRegistered ? 'Sí' : 'No'],
      ['DPD designado', config?.dpdName ? 'Sí' : 'No'],
    ];

    for (const [lbl, val] of summaryRows) {
      doc.fillColor(C.sec).fontSize(8).font('Helvetica').text(lbl, M + 8, doc.y, { width: 220 });
      doc.fillColor(C.body).fontSize(8).font('Helvetica-Bold').text(val, M + 230, doc.y - 10, { width: W - 240 });
      doc.y += 4;
      doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.border).lineWidth(0.3).stroke();
      doc.y += 7;
    }

    doc.moveDown(2);
    rect(M, doc.y, W, 20, '#f1f5f9');
    doc.fillColor(C.body).fontSize(7.5).font('Helvetica-Oblique')
      .text('Este documento constituye el ROPA según el Art. 15 de la Ley 21.719 y puede ser presentado ante la Agencia Chilena de Protección de Datos Personales (APDP).', M + 8, doc.y + 5, { width: W - 16 });

    stamp();
    doc.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- PDF Report Generation ----
router.get('/compliance/report', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.UserID;
    const [config, consents, inventory, breaches] = await Promise.all([
      ComplianceConfig.findOne({ userId }),
      DataConsent.find({ userId }).sort({ grantedAt: -1 }).limit(100),
      DataInventory.find({ userId }).sort({ risk: -1 }).limit(100),
      BreachReport.find({ userId }).sort({ detectedAt: -1 }).limit(50),
    ]);

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
    const companyName = config?.companyName || 'Empresa no configurada';
    const M = 45, PW = 595.28, PH = 841.89, W = PW - M * 2;
    const C = { dark: '#1a1a1a', bg: '#f5f5f5', bgCard: '#f8fafc', hdr: '#0f172a', body: '#1a1a1a', sec: '#555', muted: '#777', border: '#bbb', green: '#166534', red: '#991b1b', yellow: '#854d0e', blue: '#1e40af' };

    const doc = new PDFDocument({ size: 'A4', margin: M, bufferPages: true, info: { Title: 'Informe de Cumplimiento - Ley 21.719', Author: 'Invisia Compliance', Subject: 'Protección de Datos Personales' } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Informe_Cumplimiento_${companyName.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    const rect = (x, y, w, h, color) => { doc.rect(x, y, w, h).fill(color); };

    const pageHdr = (title) => {
      rect(0, 0, PW, 36, C.hdr);
      doc.fillColor('#fff').fontSize(7.5).font('Helvetica').text('Ley 21.719 · Protección de Datos Personales · Chile', M, 9, { width: W });
      doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold').text(title || 'Informe de Cumplimiento', M, 21, { width: W });
      doc.y = 52;
    };

    const sectionTitle = (num, title) => {
      if (doc.y > PH - 50) doc.addPage();
      rect(M, doc.y, 3.5, 18, C.hdr);
      doc.fillColor(C.dark).fontSize(8).font('Helvetica-Bold').text(String(num).padStart(2, '0'), M + 10, doc.y + 1, { width: 25 });
      doc.fillColor(C.dark).fontSize(12).font('Helvetica-Bold').text(title, M + 30, doc.y + 1, { width: W - 40 });
      doc.y += 22;
      doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.y += 10;
    };

    const infoRow = (label, value) => {
      doc.fillColor(C.sec).fontSize(7.5).font('Helvetica').text(label, M + 8, doc.y, { width: 170 });
      doc.fillColor(C.body).fontSize(8).font('Helvetica-Bold').text(value || '-', M + 180, doc.y - 11, { width: W - 190 });
      doc.y += 4;
      doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.border).lineWidth(0.3).stroke();
      doc.y += 6;
    };

    const stamp = () => {
      const pages = doc.bufferedPageRange();
      for (let i = pages.start; i < pages.start + pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(6).fillColor(C.muted).font('Helvetica')
          .text(`Invisia Compliance · ${dateStr}`, M, PH - 20, { width: W, align: 'left', lineBreak: false })
          .text(`Página ${i + 1} de ${pages.count}`, M, PH - 20, { width: W, align: 'right', lineBreak: false });
      }
    };

    // ── Cover page ──
    rect(0, 0, PW, PH, '#ffffff');
    rect(0, 0, PW, 2, '#000');

    doc.fillColor(C.muted).fontSize(9).font('Helvetica').text('REPÚBLICA DE CHILE', M, 120, { width: W, align: 'center' });
    doc.fillColor(C.muted).fontSize(8).font('Helvetica').text('Ley 21.719 — Protección de Datos Personales', M, 138, { width: W, align: 'center' });
    doc.moveTo(M + 60, 160).lineTo(PW - M - 60, 160).strokeColor('#000').lineWidth(0.5).stroke();

    doc.fillColor(C.body).fontSize(14).font('Helvetica-Bold').text(companyName.toUpperCase(), M, 190, { width: W, align: 'center' });
    doc.fillColor(C.body).fontSize(20).font('Helvetica-Bold').text('Informe de Cumplimiento', M, 225, { width: W, align: 'center' });
    doc.fillColor(C.sec).fontSize(10).font('Helvetica').text('Ley 21.719 — Protección de Datos Personales', M, 260, { width: W, align: 'center' });

    doc.moveTo(M + 60, 290).lineTo(PW - M - 60, 290).strokeColor('#000').lineWidth(0.5).stroke();

    const bx = M + 60, bw = W - 120;
    rect(bx, 320, bw, 40, C.bg);
    doc.rect(bx, 320, bw, 40).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.fillColor(C.sec).fontSize(8).font('Helvetica').text('FECHA DE EMISIÓN', bx + 10, 328, { width: bw - 20, align: 'center' });
    doc.fillColor(C.body).fontSize(10).font('Helvetica-Bold').text(dateStr, bx + 10, 342, { width: bw - 20, align: 'center' });

    rect(bx, 375, bw, 30, C.bg);
    doc.rect(bx, 375, bw, 30).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.fillColor(C.body).fontSize(8).font('Helvetica-Bold').text(`NIVEL DE CUMPLIMIENTO: ${(config?.complianceLevel || 'básico').toUpperCase()}`, bx + 10, 384, { width: bw - 20, align: 'center' });

    // ── KPI Summary ──
    doc.addPage();
    pageHdr('Resumen Ejecutivo');

    const kpis = [
      { label: 'Nivel de Cumplimiento', value: config?.complianceLevel || 'básico' },
      { label: 'Consentimientos Activos', value: String(consents.filter(c => !c.revokedAt).length) },
      { label: 'Items en Inventario', value: String(inventory.length) },
      { label: 'Brechas Reportadas', value: String(breaches.length) },
    ];

    const kw = W / 4;
    for (let i = 0; i < kpis.length; i++) {
      const kx = M + i * kw;
      rect(kx, doc.y, kw - 6, 44, C.bgCard);
      doc.rect(kx, doc.y, kw - 6, 44).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.fillColor(C.muted).fontSize(7).font('Helvetica').text(kpis[i].label.toUpperCase(), kx + 8, doc.y + 8, { width: kw - 22 });
      doc.fillColor(C.dark).fontSize(16).font('Helvetica-Bold').text(kpis[i].value, kx + 8, doc.y + 24, { width: kw - 22 });
    }
    doc.y += 60;

    // ── Section 1: Config ──
    sectionTitle(1, 'Configuración General');

    const configRows = [
      ['Empresa', companyName],
      ['RUT', config?.companyRut || '-'],
      ['Delegado de Protección de Datos (DPD)', `${config?.dpdName || 'No asignado'} ${config?.dpdEmail ? '· ' + config.dpdEmail : ''} ${config?.dpdPhone ? '· ' + config.dpdPhone : ''}`],
      ['Registro APDP', config?.apdpRegistered ? `Sí (${config?.apdpRegistrationDate ? new Date(config.apdpRegistrationDate).toLocaleDateString('es-CL') : ''})` : 'No registrado'],
      ['Política de Privacidad', config?.privacyPolicyUrl || 'No configurada'],
    ];
    for (const [lbl, val] of configRows) infoRow(lbl, val);
    doc.moveDown(1);

    // ── Section 2: Inventory ──
    sectionTitle(2, 'Inventario de Datos Personales (Art. 15)');

    if (inventory.length === 0) {
      doc.fillColor(C.muted).fontSize(8).font('Helvetica-Oblique').text('No hay items registrados en el inventario.', M, doc.y, { width: W });
    } else {
      const hdrs = ['Categoría', 'Tipo de Dato', 'Base Legal', 'Riesgo', 'Sensible', 'Almacenamiento'];
      const cw = [85, 100, 90, 60, 55, 95];
      const hdrH = 20, rowH = 18;
      let y = doc.y;

      const drawHdr = (yy) => {
        rect(M, yy, W, hdrH, C.hdr);
        doc.fillColor('#f1f5f9').fontSize(7).font('Helvetica-Bold');
        let x = M + 6;
        hdrs.forEach((h, i) => { doc.text(h, x, yy + 6, { width: cw[i] }); x += cw[i]; });
        return yy + hdrH;
      };

      y = drawHdr(y);
      for (let ri = 0; ri < inventory.length; ri++) {
        const i = inventory[ri];
        if (y + rowH > PH - 60) { doc.addPage(); pageHdr('Inventario de Datos Personales (Art. 15)'); y = drawHdr(doc.y); }
        if (ri % 2 === 1) rect(M, y, W, rowH, '#f1f5f9');

        const riskColor = i.risk === 'critical' ? C.red : i.risk === 'high' ? C.yellow : i.risk === 'medium' ? C.blue : C.sec;
        let x = M + 6;
        const cells = [i.category, i.dataType, i.legalBasis, i.risk, i.sensitive ? 'Sí' : 'No', i.storage];
        cells.forEach((c, ci) => {
          const clr = ci === 4 && i.sensitive ? C.red : ci === 3 ? riskColor : C.body;
          doc.fillColor(clr).fontSize(7).font('Helvetica').text(String(c ?? '-'), x, y + 4, { width: cw[ci] });
          x += cw[ci];
        });
        y += rowH;
      }
      doc.y = y + 12;
    }

    // ── Section 3: Consents ──
    sectionTitle(3, 'Consentimientos (Art. 12)');

    if (consents.length === 0) {
      doc.fillColor(C.muted).fontSize(8).font('Helvetica-Oblique').text('No hay consentimientos registrados.', M, doc.y, { width: W });
    } else {
      const hdrs = ['Email Titular', 'Finalidad', 'Estado', 'Otorgado'];
      const cw = [150, 160, 80, 100];
      const hdrH = 20, rowH = 18;
      let y = doc.y;

      const drawHdr = (yy) => {
        rect(M, yy, W, hdrH, C.hdr);
        doc.fillColor('#f1f5f9').fontSize(7).font('Helvetica-Bold');
        let x = M + 6;
        hdrs.forEach((h, i) => { doc.text(h, x, yy + 6, { width: cw[i] }); x += cw[i]; });
        return yy + hdrH;
      };

      y = drawHdr(y);
      for (let ri = 0; ri < consents.length; ri++) {
        const c = consents[ri];
        if (y + rowH > PH - 60) { doc.addPage(); pageHdr('Consentimientos (Art. 12)'); y = drawHdr(doc.y); }
        if (ri % 2 === 1) rect(M, y, W, rowH, '#f1f5f9');

        const revoked = !!c.revokedAt;
        let x = M + 6;
        const cells = [c.titularEmail, c.purpose, revoked ? 'Revocado' : 'Activo', c.grantedAt ? new Date(c.grantedAt).toLocaleDateString('es-CL') : '-'];
        cells.forEach((c2, ci) => {
          const clr = ci === 2 ? (revoked ? C.red : C.green) : C.body;
          doc.fillColor(clr).fontSize(7).font('Helvetica').text(String(c2 ?? '-'), x, y + 4, { width: cw[ci] });
          x += cw[ci];
        });
        y += rowH;
      }
      doc.y = y + 12;
    }

    // ── Section 4: Breaches ──
    sectionTitle(4, 'Brechas de Seguridad (Art. 26)');

    if (breaches.length === 0) {
      doc.fillColor(C.muted).fontSize(8).font('Helvetica-Oblique').text('No hay brechas reportadas.', M, doc.y, { width: W });
    } else {
      const hdrs = ['Fecha', 'Tipo', 'Severidad', 'Estado', 'Notif. APDP'];
      const cw = [100, 130, 80, 90, 80];
      const hdrH = 20, rowH = 18;
      let y = doc.y;

      const drawHdr = (yy) => {
        rect(M, yy, W, hdrH, C.hdr);
        doc.fillColor('#f1f5f9').fontSize(7).font('Helvetica-Bold');
        let x = M + 6;
        hdrs.forEach((h, i) => { doc.text(h, x, yy + 6, { width: cw[i] }); x += cw[i]; });
        return yy + hdrH;
      };

      y = drawHdr(y);
      for (let ri = 0; ri < breaches.length; ri++) {
        const b = breaches[ri];
        if (y + rowH > PH - 60) { doc.addPage(); pageHdr('Brechas de Seguridad (Art. 26)'); y = drawHdr(doc.y); }
        if (ri % 2 === 1) rect(M, y, W, rowH, '#f1f5f9');

        const sevColor = b.severity === 'critical' ? C.red : b.severity === 'high' ? C.yellow : C.blue;
        const stColor = b.status === 'resolved' ? C.green : b.status === 'reported' ? C.yellow : C.red;
        let x = M + 6;
        const cells = [
          b.detectedAt ? new Date(b.detectedAt).toLocaleDateString('es-CL') : '-',
          b.type, b.severity, b.status, b.notifiedAPDP ? 'Sí' : 'No'
        ];
        cells.forEach((c, ci) => {
          const clr = ci === 2 ? sevColor : ci === 3 ? stColor : C.body;
          doc.fillColor(clr).fontSize(7).font('Helvetica').text(String(c ?? '-'), x, y + 4, { width: cw[ci] });
          x += cw[ci];
        });
        y += rowH;
      }
      doc.y = y + 12;
    }

    // ── Section 5: Checklist ──
    sectionTitle(5, 'Checklist de Cumplimiento');

    const checks = [
      ['DPD Designado', !!config?.dpdEmail, 'Art. 28 — Delegado de Protección de Datos'],
      ['Registro APDP', config?.apdpRegistered, 'Art. 31 — Registro ante Agencia'],
      ['Inventario de Datos', inventory.length > 0, 'Art. 15 — Inventario de datos personales'],
      ['Política de Privacidad', !!config?.privacyPolicyUrl, 'Art. 14 — Información al titular'],
      ['Consentimientos', consents.length > 0, 'Art. 12 — Consentimiento explícito'],
      ['Notificación Brechas', breaches.some(b => b.notifiedAPDP), 'Art. 26 — Notificación de brechas'],
    ];

    const cw2 = (W - 12) / 2;
    for (let i = 0; i < checks.length; i += 2) {
      if (doc.y > PH - 80) { doc.addPage(); pageHdr('Checklist de Cumplimiento'); }

      for (let j = 0; j < 2 && i + j < checks.length; j++) {
        const [label, ok, ref] = checks[i + j];
        const cx = M + j * (cw2 + 12);
        rect(cx, doc.y, cw2, 36, C.bgCard);
        doc.rect(cx, doc.y, cw2, 36).strokeColor(C.border).lineWidth(0.5).stroke();

        doc.fillColor(ok ? C.green : C.red).fontSize(7).font('Helvetica-Bold')
          .text(`${ok ? '✓' : '✗'} ${label}`, cx + 8, doc.y + 6, { width: cw2 - 16 });
        doc.fillColor(ok ? C.green : C.red).fontSize(7).font('Helvetica-Bold')
          .text(ok ? 'Cumple' : 'Pendiente', cx + 8, doc.y + 18, { width: cw2 - 16 });
        doc.fillColor(C.muted).fontSize(6).font('Helvetica-Oblique')
          .text(ref, cx + 8, doc.y + 27, { width: cw2 - 16 });
      }
      doc.y += 44;
    }

    stamp();
    doc.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Audit Log (Art. 3 / Art. 14 quinquies) ----
router.get('/compliance/audit-log', authMiddleware, async (req, res) => {
  try {
    const { action, resource, search, limit } = req.query;
    const filter = { userId: req.user.UserID };
    if (action && action !== 'all') filter.action = action;
    if (resource && resource !== 'all') filter.resourceType = resource;
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { description: { $regex: safe, $options: 'i' } },
        { performedBy: { $regex: safe, $options: 'i' } },
      ];
    }
    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit) || 200);
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance/audit-log', authMiddleware, async (req, res) => {
  try {
    const log = await AuditLog.create({
      userId: req.user.UserID,
      ...req.body,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    res.json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Portabilidad — Export datos del titular en CSV/JSON (Art. 9) ----
router.post('/compliance/portability/export', authMiddleware, async (req, res) => {
  try {
    const { titularEmail, format } = req.body;
    if (!titularEmail) return res.status(400).json({ error: 'Email del titular requerido' });
    const [consents, inventory] = await Promise.all([
      DataConsent.find({ userId: req.user.UserID, titularEmail }).lean(),
      DataInventory.find({ userId: req.user.UserID }).lean(),
    ]);
    const exportData = {
      exportDate: new Date().toISOString(),
      law: 'Ley 21.719 - Protección de Datos Personales',
      right: 'Portabilidad (Art. 9)',
      titular: { email: titularEmail },
      consents: consents.map(c => ({
        purpose: c.purpose,
        dataCategories: c.dataCategories,
        grantedAt: c.grantedAt,
        revokedAt: c.revokedAt,
        source: c.source,
      })),
      inventory: inventory.map(i => ({
        category: i.category,
        dataType: i.dataType,
        purpose: i.purpose,
        legalBasis: i.legalBasis,
        sensitive: i.sensitive,
      })),
    };
    if (format === 'csv') {
      let csv = 'Tipo,Finalidad,Categorías,Fecha Otorgamiento,Estado\n';
      consents.forEach(c => {
        csv += `Consentimiento,"${c.purpose}","${(c.dataCategories || []).join('; ')}",${c.grantedAt ? new Date(c.grantedAt).toLocaleDateString('es-CL') : ''},${c.revokedAt ? 'Revocado' : 'Activo'}\n`;
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="portabilidad_${titularEmail}_${Date.now()}.csv"`);
      res.send('\uFEFF' + csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="portabilidad_${titularEmail}_${Date.now()}.json"`);
      res.json(exportData);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Supresión Real — Eliminar datos del titular (Art. 7) ----
router.post('/compliance/suppression/execute', authMiddleware, async (req, res) => {
  try {
    const { titularEmail } = req.body;
    if (!titularEmail) return res.status(400).json({ error: 'Email del titular requerido' });
    const deletedConsents = await DataConsent.deleteMany({ userId: req.user.UserID, titularEmail });
    await AuditLog.create({
      userId: req.user.UserID,
      action: 'delete',
      resource: 'consent',
      description: `Supresión ejecutada para ${titularEmail} (Art. 7 Ley 21.719)`,
      performedBy: req.user.Email || req.user.email,
      metadata: { titularEmail, deletedCount: deletedConsents.deletedCount },
    });
    res.json({ success: true, deletedConsents: deletedConsents.deletedCount, message: 'Datos eliminados conforme al Art. 7 de la Ley 21.719' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- DPIA Export en PDF (Art. 14 quater / Art. 16) ----
router.get('/compliance/dpia/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const item = await DataProtectionImpactAssessment.findOne({ _id: req.params.id, userId: req.user.UserID }).lean();
    if (!item) return res.status(404).json({ error: 'DPIA no encontrada' });
    const config = await ComplianceConfig.findOne({ userId: req.user.UserID }).lean();
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DPIA_${item.title?.replace(/\s+/g, '_') || 'evaluacion'}.pdf"`);
    doc.pipe(res);
    // Header
    doc.fontSize(8).font('Helvetica').fillColor('#888').text('REPÚBLICA DE CHILE', 50, 50, { align: 'center' });
    doc.fontSize(8).fillColor('#888').text('Ley 21.719 - Protección de Datos Personales', 50, 62, { align: 'center' });
    doc.moveTo(100, 80).lineTo(495, 80).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#000').text('Evaluación de Impacto\nde Protección de Datos', 50, 100, { align: 'center', width: 445 });
    doc.fontSize(10).font('Helvetica').fillColor('#555').text(`(DPIA) — Art. 14 quater / Art. 16`, 50, 145, { align: 'center', width: 445 });
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica').fillColor('#333');
    doc.text(`Empresa: ${config?.companyName || '-'}`, 50, doc.y, { width: 445 });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 50, doc.y + 4, { width: 445 });
    doc.text(`Estado: ${item.status || 'draft'}`, 50, doc.y + 4, { width: 445 });
    if (item.approvedBy) doc.text(`Aprobado por: ${item.approvedBy}`, 50, doc.y + 4, { width: 445 });
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(495, doc.y).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.moveDown(1);
    // Section: Description
    const addSection = (title, content) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text(title, 50, doc.y, { width: 445 });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').fillColor('#333').text(content || '-', 50, doc.y, { width: 445, align: 'justify' });
      doc.moveDown(1);
    };
    addSection('1. Título de la Evaluación', item.title);
    addSection('2. Propósito del Tratamiento', item.processingPurpose);
    addSection('3. Descripción', item.description);
    addSection('4. Categorías de Datos', (item.dataCategories || []).join(', ') || 'No especificado');
    addSection('5. Sujetos de Datos', item.dataSubjects || 'No especificado');
    addSection('6. Base Legal', item.legalBasis || 'No especificado');
    // Risk Indicators
    if (doc.y > 600) doc.addPage();
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('7. Indicadores de Riesgo', 50, doc.y, { width: 445 });
    doc.moveDown(0.3);
    const indicators = [
      ['Datos Sensibles', item.sensitiveData],
      ['Datos de Menores', item.childrenData],
      ['Tratamiento a Gran Escala', item.largeScale],
      ['Decisiones Automatizadas', item.automatedDecisions],
      ['Perfilamiento', item.profiling],
      ['Datos Biométricos', item.biometricData],
      ['Geolocalización', item.geolocationData],
      ['Videovigilancia', item.videoSurveillance],
      ['Transferencia Internacional', item.crossBorderTransfer],
      ['Sujetos Vulnerables', item.vulnerableSubjects],
      ['Monitoreo Sistemático', item.systematicMonitoring],
      ['Nuevas Tecnologías', item.newTechnologies],
    ];
    doc.fontSize(8).font('Helvetica');
    indicators.forEach(([label, val]) => {
      doc.fillColor(val ? '#c00' : '#555').text(`${val ? '●' : '○'} ${label}`, 60, doc.y, { width: 420 });
    });
    doc.moveDown(1);
    // Risk Score
    addSection('8. Nivel de Riesgo', `Puntaje: ${item.riskScore}/100 — Nivel: ${(item.riskLevel || 'not_assessed').toUpperCase()}`);
    addSection('9. Medidas de Mitigación', (item.mitigationMeasures || []).join('\n• ') || 'No especificado');
    addSection('10. Justificación del Riesgo', item.riskJustification);
    // Footer
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(495, doc.y).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(7).font('Helvetica').fillColor('#999').text('Documento generado electrónicamente · Invisia Compliance · Ley 21.719 Chile', 50, doc.y, { align: 'center', width: 445 });
    doc.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- DPA Export en PDF (Art. 9) ----
router.get('/compliance/dpa/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const item = await DataProcessingAgreement.findOne({ _id: req.params.id, userId: req.user.UserID }).lean();
    if (!item) return res.status(404).json({ error: 'DPA no encontrado' });
    const config = await ComplianceConfig.findOne({ userId: req.user.UserID }).lean();
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DPA_${item.processorName?.replace(/\s+/g, '_') || 'acuerdo'}.pdf"`);
    doc.pipe(res);
    doc.fontSize(8).font('Helvetica').fillColor('#888').text('REPÚBLICA DE CHILE', 50, 50, { align: 'center' });
    doc.fontSize(8).fillColor('#888').text('Ley 21.719 - Protección de Datos Personales', 50, 62, { align: 'center' });
    doc.moveTo(100, 80).lineTo(495, 80).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000').text('Acuerdo de Tratamiento\nde Datos Personales', 50, 100, { align: 'center', width: 445 });
    doc.fontSize(10).font('Helvetica').fillColor('#555').text('(DPA) — Art. 9 Ley 21.719', 50, 140, { align: 'center', width: 445 });
    doc.moveDown(2);
    const addField = (label, value) => {
      if (doc.y > 720) doc.addPage();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#666').text(label + ':', 50, doc.y, { width: 445 });
      doc.fontSize(9).font('Helvetica').fillColor('#000').text(value || '-', 50, doc.y + 2, { width: 445 });
      doc.moveDown(0.8);
    };
    addField('Responsable del Tratamiento', config?.companyName || '-');
    addField('RUT Responsable', config?.companyRut || '-');
    addField('Encargado del Tratamiento', item.processorName);
    addField('RUT Encargado', item.processorRut || '-');
    addField('Contacto Encargado', `${item.processorContactName || ''} ${item.processorEmail || ''} ${item.processorPhone || ''}`);
    addField('Dirección Encargado', item.processorAddress || '-');
    addField('Descripción del Servicio', item.serviceDescription);
    addField('Categorías de Datos', (item.dataCategories || []).join(', ') || '-');
    addField('Sujetos de Datos', item.dataSubjects || '-');
    addField('Finalidad del Tratamiento', item.processingPurpose);
    addField('Fecha del Contrato', item.contractDate ? new Date(item.contractDate).toLocaleDateString('es-CL') : '-');
    addField('Vencimiento', item.expirationDate ? new Date(item.expirationDate).toLocaleDateString('es-CL') : '-');
    addField('Referencia del Contrato', item.contractReference || '-');
    addField('Medidas de Seguridad', (item.securityMeasures || []).join(', ') || '-');
    addField('Transferencia Internacional', item.internationalTransfer ? `Sí — País: ${item.transferCountry || '-'}` : 'No');
    if (item.internationalTransfer) addField('Garantías de Transferencia', item.transferGuarantees || '-');
    addField('Estado', item.status || '-');
    if (item.notes) addField('Notas', item.notes);
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(495, doc.y).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(7).font('Helvetica').fillColor('#999').text('Documento generado electrónicamente · Invisia Compliance · Ley 21.719 Chile', 50, doc.y, { align: 'center', width: 445 });
    doc.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- ROPA Export en PDF (Art. 15) ----
router.get('/compliance/ropa-pdf', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.UserID;
    const [config, inventory] = await Promise.all([
      ComplianceConfig.findOne({ userId }).lean(),
      DataInventory.find({ userId }).sort({ category: 1, dataType: 1 }).lean(),
    ]);
    const doc = new PDFDocument({ margin: 40, size: 'A4', info: { Title: 'ROPA - Ley 21.719', Author: 'Invisia Compliance' } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ROPA_${config?.companyName?.replace(/\s+/g, '_') || 'empresa'}.pdf"`);
    doc.pipe(res);
    const M = 40, PW = 595.28, PH = 841.89, WW = PW - M * 2;
    doc.fontSize(8).font('Helvetica').fillColor('#888').text('REPÚBLICA DE CHILE', M, 50, { width: WW, align: 'center' });
    doc.fontSize(8).fillColor('#888').text('Ley 21.719 - Protección de Datos Personales', M, 62, { width: WW, align: 'center' });
    doc.moveTo(M + 60, 80).lineTo(PW - M - 60, 80).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#000').text('Registro de Actividades\nde Tratamiento (ROPA)', M, 100, { width: WW, align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#555').text(`Art. 15 — Ley 21.719`, M, 145, { width: WW, align: 'center' });
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica').fillColor('#333');
    doc.text(`Empresa: ${config?.companyName || '-'}`, M, doc.y, { width: WW });
    doc.text(`RUT: ${config?.companyRut || '-'}`, M, doc.y + 2, { width: WW });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}`, M, doc.y + 2, { width: WW });
    doc.text(`DPD: ${config?.dpdName || 'No designado'} ${config?.dpdEmail || ''}`, M, doc.y + 2, { width: WW });
    doc.text(`Registro APDP: ${config?.apdpRegistered ? 'Sí' : 'No'}`, M, doc.y + 2, { width: WW });
    doc.text(`Transferencias internacionales: ${config?.internationalTransfer ? 'Sí (' + (config.internationalTransferCountries || []).join(', ') + ')' : 'No'}`, M, doc.y + 2, { width: WW });
    doc.moveDown(1);
    doc.moveTo(M, doc.y).lineTo(PW - M, doc.y).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    // Section 2: Activities table
    if (doc.y > PH - 100) doc.addPage();
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('Registro de Actividades de Tratamiento', M, doc.y, { width: WW });
    doc.moveDown(0.5);
    if (inventory.length === 0) {
      doc.fontSize(9).font('Helvetica').fillColor('#666').text('No hay actividades de tratamiento registradas.', M, doc.y, { width: WW });
    } else {
      const headers = ['#', 'Categoría', 'Tipo', 'Finalidad', 'Base Legal', 'Sensible', 'Riesgo'];
      const colW = [25, 70, 70, 100, 70, 50, 50];
      // Header row
      doc.rect(M, doc.y, WW, 18).fill('#1a1a1a');
      let x = M + 5;
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#fff');
      headers.forEach((h, i) => { doc.text(h, x, doc.y + 5, { width: colW[i] }); x += colW[i]; });
      doc.y += 18;
      // Data rows
      inventory.slice(0, 40).forEach((item, idx) => {
        if (doc.y > PH - 60) {
          doc.addPage();
          doc.rect(M, doc.y, WW, 18).fill('#1a1a1a');
          let rx = M + 5;
          doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#fff');
          headers.forEach((h, i) => { doc.text(h, rx, doc.y + 5, { width: colW[i] }); rx += colW[i]; });
          doc.y += 18;
        }
        if (idx % 2 === 1) doc.rect(M, doc.y, WW, 16).fill('#f5f5f5');
        let rx = M + 5;
        doc.fontSize(7).font('Helvetica').fillColor('#333');
        const row = [String(idx + 1), item.category, item.dataType, item.purpose || '-', item.legalBasis, item.sensitive ? 'Sí' : 'No', item.risk || '-'];
        row.forEach((cell, ci) => { doc.text(cell, rx, doc.y + 3, { width: colW[ci] }); rx += colW[ci]; });
        doc.y += 16;
      });
    }
    // Section 3: Summary
    doc.moveDown(1);
    if (doc.y > PH - 100) doc.addPage();
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('Resumen', M, doc.y, { width: WW });
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica').fillColor('#333');
    doc.text(`Total actividades: ${inventory.length}`, M, doc.y, { width: WW });
    doc.text(`Datos sensibles: ${inventory.filter(i => i.sensitive).length}`, M, doc.y + 2, { width: WW });
    doc.text(`Nivel de cumplimiento: ${config?.complianceLevel || 'básico'}`, M, doc.y + 2, { width: WW });
    // Footer
    doc.moveDown(2);
    doc.moveTo(M, doc.y).lineTo(PW - M, doc.y).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(7).font('Helvetica').fillColor('#999').text('Este documento constituye el ROPA según el Art. 15 de la Ley 21.719 y puede ser presentado ante la APDP.', M, doc.y, { width: WW, align: 'center' });
    doc.text('Documento generado electrónicamente · Invisia Compliance · Ley 21.719 Chile', M, doc.y + 10, { width: WW, align: 'center' });
    doc.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Cláusula Laboral de Datos (Art. 154 bis Código del Trabajo) ----
router.get('/compliance/labor-clause', authMiddleware, async (req, res) => {
  try {
    const config = await ComplianceConfig.findOne({ userId: req.user.UserID }).lean();
    const companyName = config?.companyName || '_______________';
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="clausula_laboral_datos_${Date.now()}.pdf"`);
    doc.pipe(res);
    doc.fontSize(8).font('Helvetica').fillColor('#888').text('REPÚBLICA DE CHILE', 50, 50, { align: 'center' });
    doc.moveTo(100, 70).lineTo(495, 70).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Cláusula de Protección\nde Datos Personales', 50, 90, { align: 'center', width: 445 });
    doc.fontSize(9).font('Helvetica').fillColor('#555').text('Para inclusión en Contratos de Trabajo', 50, 130, { align: 'center', width: 445 });
    doc.fontSize(8).fillColor('#555').text('Art. 154 bis Código del Trabajo · Ley 21.719', 50, 145, { align: 'center', width: 445 });
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(495, doc.y).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.moveDown(1);
    const clauses = [
      ['CLÁUSULA PRIMERA — TRATAMIENTO DE DATOS PERSONALES', `${companyName}, en su calidad de responsable del tratamiento de datos personales conforme a la Ley N° 21.719, informa al(à) trabajador(a) que los datos personales recolectados serán utilizados exclusivamente para las siguientes finalidades: (i) cumplimiento de obligaciones laborales, previsionales y de seguridad social; (ii) gestión administrativa y remuneracional; (iii) evaluación del desempeño laboral; (iv) cumplimiento de obligaciones legales ante organismos fiscalizadores; y (v) las demás finalidades comunicadas previamente al trabajador(a).`],
      ['CLÁUSULA SEGUNDA — BASE LEGAL', 'El tratamiento se fundamenta en: (i) la ejecución del contrato de trabajo (Art. 13 letra b, Ley 21.719); (ii) el cumplimiento de obligaciones legales (Art. 13 letra a); y (iii) cuando corresponda, el consentimiento expreso del trabajador(a) para finalidades adicionales.'],
      ['CLÁUSULA TERCERA — DERECHOS DEL TRABAJADOR(A)', 'El(à) trabajador(a) tiene derecho a: (i) acceder a sus datos personales (Art. 5); (ii) rectificar datos inexactos (Art. 6); (iii) solicitar la supresión cuando corresponda (Art. 7); (iv) oponerse al tratamiento para fines específicos (Art. 8); (v) solicitar portabilidad de sus datos (Art. 9); y (vi) solicitar el bloqueo temporal de tratamiento (Art. 8 ter). Estos derechos pueden ejercerse mediante solicitud al Delegado de Protección de Datos o al correo indicado en la política de privacidad.'],
      ['CLÁUSULA CUARTA — CONSERVACIÓN', 'Los datos personales serán conservados durante la vigencia del contrato de trabajo y por los plazos legales exigidos (prescripciones laborales, previsionales y tributarias). Una vez extinguido el vínculo laboral, los datos serán eliminados o anonimizados salvo obligación legal de conservación.'],
      ['CLÁUSULA QUINTA — SEGURIDAD', `${companyName} se compromete a adoptar medidas técnicas y organizativas apropiadas para proteger los datos personales del trabajador(a) contra acceso no autorizado, pérdida, alteración o destrucción, conforme al Art. 14 quinquies de la Ley 21.719.`],
      ['CLÁUSULA SEXTA — DATOS SENSIBLES', 'En caso de recolectar datos sensibles (Art. 16, Ley 21.719), se solicitará consentimiento expreso y separado, informando previamente sobre la finalidad específica y la necesidad del tratamiento. El trabajador(a) podrá revocar este consentimiento en cualquier momento.'],
    ];
    clauses.forEach(([title, body]) => {
      if (doc.y > 680) doc.addPage();
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000').text(title, 50, doc.y, { width: 445 });
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica').fillColor('#333').text(body, 50, doc.y, { width: 445, align: 'justify' });
      doc.moveDown(1.2);
    });
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(495, doc.y).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(7).font('Helvetica').fillColor('#999').text('Documento generado electrónicamente · Invisia Compliance · Ley 21.719 Chile', 50, doc.y, { align: 'center', width: 445 });
    doc.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Validación de Transferencias Internacionales (Art. 27-29) ----
router.post('/compliance/transfer-validation', authMiddleware, async (req, res) => {
  try {
    const { country } = req.body;
    if (!country) return res.status(400).json({ error: 'País requerido' });
    // APDP approved countries list (Art. 28) — placeholder list based on GDPR adequacy + regional standards
    const adequateCountries = [
      'Argentina', 'Uruguay', 'Costa Rica', 'México', 'Brasil', 'Colombia',
      'España', 'Alemania', 'Francia', 'Italia', 'Países Bajos', 'Bélgica',
      'Portugal', 'Suecia', 'Dinamarca', 'Finlandia', 'Austria', 'Irlanda',
      'Luxemburgo', 'Malta', 'Chipre', 'Estonia', 'Letonia', 'Lituania',
      'Polonia', 'Chequia', 'Eslovaquia', 'Eslovenia', 'Croacia', 'Rumanía',
      'Bulgaria', 'Grecia', 'Hungria', 'Reino Unido', 'Suiza', 'Noruega',
      'Islandia', 'Liechtenstein', 'Canadá', 'Japón', 'Corea del Sur',
      'Nueva Zelanda', 'Israel', 'Australia', 'Andorra', 'Uruguay',
    ];
    const isAdequate = adequateCountries.some(c => c.toLowerCase() === country.toLowerCase());
    res.json({
      country,
      adequate: isAdequate,
      message: isAdequate
        ? `${country} tiene nivel adecuado de protección según la APDP (Art. 28). La transferencia es lícita.`
        : `${country} NO tiene nivel adecuado de protección determinado por la APDP. Se requieren garantías adicionales: cláusulas contractuales (Art. 27), normas corporativas vinculantes, o consentimiento expreso del titular para la transferencia específica.`,
      requiredGuarantees: isAdequate ? [] : ['cláusulas_contractuales', 'normas_corporativas', 'consentimiento_expreso'],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;

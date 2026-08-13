import { Router } from 'express';
import { User, AuditLog } from '../models/db.js';
import { Scan, Vulnerability } from '../models/db.js';
import { DataConsent, DataInventory, BreachReport, ComplianceConfig } from '../models/compliance.js';
import Agent from '../models/agent.js';
import DatabaseConnection from '../models/databaseConnection.js';
import { validateToken, isAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/user-monitor/:userId', async (req, res) => {
  try {
    const { token } = req.body;
    const { userId } = req.params;
    const admin = await validateToken(token);
    if (!admin || !isAdmin(admin)) {
      return res.json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password').lean();
    if (!user) return res.json({ error: 'User not found' });

    const [complianceConfig, breaches, consents, inventory, agents, databases, logs, scans] = await Promise.all([
      ComplianceConfig.findOne({ userId }).lean(),
      BreachReport.find({ userId }).sort({ detectedAt: -1 }).lean(),
      DataConsent.find({ userId }).sort({ grantedAt: -1 }).lean(),
      DataInventory.find({ userId }).lean(),
      Agent.find({ userId }).sort({ lastHeartbeat: -1 }).lean(),
      DatabaseConnection.find({ userId }).sort({ lastConnected: -1 }).lean(),
      AuditLog.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
      Scan.find({ userId }).sort({ startedAt: -1 }).limit(20).lean(),
    ]);

    const scanIds = scans.map(s => s._id);
    const vulnerabilities = await Vulnerability.find({ scanId: { $in: scanIds } }).sort({ severity: -1 }).lean();

    const scansWithVulns = scans.map(s => ({
      ...s,
      vulnerabilities: vulnerabilities.filter(v => v.scanId.toString() === s._id.toString()),
    }));

    const complianceChecklist = buildComplianceChecklist(user, complianceConfig, breaches, consents, inventory, agents, databases);

    res.json({
      user,
      complianceConfig,
      breaches,
      consents,
      inventory,
      agents,
      databases,
      logs,
      scans: scansWithVulns,
      complianceChecklist,
    });
  } catch (e) {
    console.error('[userMonitor]', e);
    res.status(500).json({ error: e.message });
  }
});

function buildComplianceChecklist(user, config, breaches, consents, inventory, agents, databases) {
  const checks = [];

  checks.push({
    id: 'dpd_appointed',
    label: 'DPD designado (Art. 28)',
    passed: !!(config?.dpdName && config?.dpdEmail),
    detail: config?.dpdName ? `${config.dpdName} <${config.dpdEmail}>` : 'No hay DPD registrado',
  });

  checks.push({
    id: 'apdp_registered',
    label: 'Registrado ante APDP (Art. 29)',
    passed: !!config?.apdpRegistered,
    detail: config?.apdpRegistrationDate
      ? `Registrado el ${new Date(config.apdpRegistrationDate).toLocaleDateString()}`
      : 'No registrado',
  });

  checks.push({
    id: 'consent_management',
    label: 'Gestión de consentimientos (Art. 8)',
    passed: consents && consents.length > 0,
    detail: `${consents?.length || 0} consentimientos registrados`,
  });

  checks.push({
    id: 'data_inventory',
    label: 'Inventario de datos (Art. 10)',
    passed: inventory && inventory.length > 0,
    detail: `${inventory?.length || 0} registros en inventario`,
  });

  checks.push({
    id: 'breach_management',
    label: 'Gestión de brechas (Art. 12)',
    passed: breaches && breaches.length > 0,
    detail: `${breaches?.length || 0} brechas reportadas (${breaches?.filter(b => b.status === 'resolved').length || 0} resueltas)`,
  });

  const openBreaches = breaches?.filter(b => b.status !== 'resolved' && b.status !== 'closed') || [];
  checks.push({
    id: 'no_open_breaches',
    label: 'Sin brechas abiertas (Art. 12)',
    passed: openBreaches.length === 0,
    detail: openBreaches.length > 0 ? `${openBreaches.length} brecha(s) sin resolver` : 'No hay brechas abiertas',
  });

  checks.push({
    id: 'agent_installed',
    label: 'Agente de monitoreo instalado (Art. 18)',
    passed: agents && agents.length > 0,
    detail: `${agents?.length || 0} agente(s) conectado(s)`,
  });

  const onlineAgents = agents?.filter(a => a.status === 'online') || [];
  checks.push({
    id: 'agent_online',
    label: 'Agente(s) activo(s)',
    passed: onlineAgents.length > 0,
    detail: `${onlineAgents.length}/${agents?.length || 0} agente(s) online`,
  });

  checks.push({
    id: 'database_connected',
    label: 'Base(s) de datos monitoreada(s)',
    passed: databases && databases.length > 0,
    detail: `${databases?.length || 0} base(s) de datos registrada(s)`,
  });

  if (config?.complianceLevel) {
    checks.push({
      id: 'compliance_level',
      label: 'Nivel de cumplimiento registrado',
      passed: true,
      detail: `Nivel: ${config.complianceLevel}`,
    });
  }

  checks.push({
    id: 'data_retention_policy',
    label: 'Política de retención de datos (Art. 11)',
    passed: !!config?.dataRetentionPolicy && config.dataRetentionPolicy !== 'none',
    detail: config?.dataRetentionPolicy || 'No definida',
  });

  return checks;
}

export default router;

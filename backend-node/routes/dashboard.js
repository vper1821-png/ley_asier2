import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import Agent from '../models/agent.js';
import DatabaseConnection from '../models/databaseConnection.js';
import Alert from '../models/alert.js';
import ReportHistory from '../models/reportHistory.js';
import { DataConsent, DataInventory, BreachReport, ComplianceConfig } from '../models/compliance.js';

const router = Router();

function auth(req, res, next) {
  const token = req.body?.token || req.query?.token || req.headers?.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'token requerido' });
  try {
    req.user = jwt.verify(token, CONFIG.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'token inválido' });
  }
}

// GET /api/dashboard/stats — aggregated dashboard data
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [agents, databases, breaches, inventory, consents, alerts, reports] = await Promise.all([
      Agent.find({ userId }).lean(),
      DatabaseConnection.find({ userId }).lean(),
      BreachReport.find({ userId }).sort({ detectedAt: -1 }).limit(20).lean(),
      DataInventory.find({ userId }).lean(),
      DataConsent.find({ userId }).lean(),
      Alert.find({ userId, resolved: { $ne: true } }).lean(),
      ReportHistory.find({ userId }).lean(),
    ]);

    const onlineAgents = agents.filter(a => a.status === 'online').length;
    const totalTables = databases.reduce((sum, db) => sum + (db.metrics?.tablesCount || 0), 0);
    const totalRecords = databases.reduce((sum, db) => sum + (db.metrics?.recordsCount || 0), 0);
    const vulnerableUsers = [];
    const dbCompliance = [];

    // DB compliance check against Ley 21.719
    databases.forEach(db => {
      const dbBreaches = breaches.filter(b => b.description?.toLowerCase().includes(db.name?.toLowerCase() || ''));
      const dbInventory = inventory.filter(i => i.storageLocation?.toLowerCase().includes(db.name?.toLowerCase() || ''));
      const hasConsent = dbInventory.every(i => {
        if (i.legalBasis && i.legalBasis !== 'consent') return true;
        const invPurpose = (i.purpose || '').trim().toLowerCase();
        if (!invPurpose) return consents.some(c => !c.revokedAt);
        return consents.some(c => !c.revokedAt && (c.purpose || '').trim().toLowerCase() === invPurpose);
      });
      const hasSensitiveInventory = dbInventory.some(i => i.sensitive);
      const openBreaches = dbBreaches.filter(b => b.status !== 'resolved');
      const score = Math.max(0, Math.min(100,
        (hasConsent ? 30 : 0) +
        (dbInventory.length > 0 ? 25 : 0) +
        (openBreaches.length === 0 ? 25 : 0) +
        (db.metrics?.lastScanned ? 20 : 0)
      ));
      dbCompliance.push({
        dbId: db._id,
        dbName: db.name,
        engine: db.engine,
        tablesCount: db.metrics?.tablesCount || 0,
        recordsCount: db.metrics?.recordsCount || 0,
        lastScanned: db.metrics?.lastScanned,
        status: db.status,
        complianceScore: score,
        compliant: score >= 70,
        openBreaches: openBreaches.length,
        hasSensitiveData: hasSensitiveInventory,
        consentOk: hasConsent,
        inventoryCount: dbInventory.length,
        tables: db.tables || [],
      });
    });

    // Vulnerable users from inventory + breaches + database scans
    inventory.forEach(item => {
      if (item.sensitive || item.risk === 'high' || item.risk === 'critical') {
        const relatedBreaches = breaches.filter(b =>
          b.affectedData?.some(d => d.toLowerCase().includes(item.dataType?.toLowerCase() || ''))
        );
        const reasons = [];
        if (item.sensitive) reasons.push('Dato sensible sin protección adicional');
        if (item.risk === 'high' || item.risk === 'critical') reasons.push(`Riesgo ${item.risk}`);
        if (relatedBreaches.length > 0) reasons.push(`${relatedBreaches.length} brecha(s) relacionada(s)`);
        vulnerableUsers.push({
          dataType: item.dataType,
          category: item.category,
          storage: item.storageLocation,
          risk: item.risk,
          sensitive: item.sensitive,
          breaches: relatedBreaches.length,
          reasons,
          severity: relatedBreaches.length > 0 || item.risk === 'critical' ? 'red' : item.risk === 'high' ? 'red' : 'yellow',
        });
      }
    });

    // Breach-based vulnerable entries
    breaches.forEach(b => {
      if (b.status !== 'resolved') {
        (b.affectedData || []).forEach(data => {
          const exists = vulnerableUsers.some(v => v.dataType === data);
          if (!exists) {
            vulnerableUsers.push({
              dataType: data,
              category: 'breached',
              storage: 'unknown',
              risk: b.severity,
              sensitive: b.sensitiveDataInvolved,
              breaches: 1,
              reasons: [b.description?.slice(0, 80) || 'Dato comprometido en brecha'],
              severity: b.severity === 'critical' || b.severity === 'high' ? 'red' : 'yellow',
            });
          }
        });
      }
    });

    const complianceScore = dbCompliance.length > 0
      ? Math.round(dbCompliance.reduce((s, d) => s + d.complianceScore, 0) / dbCompliance.length)
      : 0;

    res.json({
      stats: {
        totalAgents: agents.length,
        onlineAgents,
        totalDatabases: databases.length,
        totalTables,
        totalRecords,
        totalBreaches: breaches.length,
        openBreaches: breaches.filter(b => b.status !== 'resolved').length,
        totalConsents: consents.length,
        activeConsents: consents.filter(c => !c.revokedAt).length,
        compliantDBs: dbCompliance.filter(d => d.compliant).length,
        nonCompliantDBs: dbCompliance.filter(d => !d.compliant).length,
        complianceScore,
        vulnerableUsersCount: vulnerableUsers.length,
        activeAlerts: alerts.length,
        completedScans: databases.filter(d => d.metrics?.lastScanned).length,
        totalScans: databases.length,
        generatedReports: reports.length,
      },
      dbCompliance,
      vulnerableUsers: vulnerableUsers.slice(0, 50),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/live-events — recent activity
router.get('/live-events', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const agents = await Agent.find({ userId }).sort({ lastHeartbeat: -1 }).limit(10).lean();
    const breaches = await BreachReport.find({ userId }).sort({ detectedAt: -1 }).limit(10).lean();
    const databases = await DatabaseConnection.find({ userId }).sort({ updatedAt: -1 }).limit(10).lean();

    const events = [];

    agents.forEach(a => {
      events.push({
        type: a.status === 'online' ? 'agent_online' : 'agent_offline',
        severity: a.status === 'online' ? 'info' : 'warning',
        title: a.hostname || a.agentId,
        description: a.status === 'online' ? 'Agente conectado' : 'Agente desconectado',
        timestamp: a.lastHeartbeat || a.updatedAt,
        source: 'agent',
        icon: 'agent',
      });
    });

    breaches.forEach(b => {
      events.push({
        type: 'breach',
        severity: b.severity || 'medium',
        title: b.type || 'Brecha de seguridad',
        description: b.description?.slice(0, 120) || '',
        timestamp: b.detectedAt,
        source: 'breach',
        icon: 'breach',
      });
    });

    databases.forEach(db => {
      if (db.metrics?.lastScanned) {
        events.push({
          type: 'scan',
          severity: 'info',
          title: `${db.name} (${db.engine})`,
          description: `Escaneado — ${db.metrics.tablesCount} tablas, ${db.metrics.recordsCount} registros`,
          timestamp: db.metrics.lastScanned,
          source: 'database',
          icon: 'database',
        });
      }
    });

    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(events.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

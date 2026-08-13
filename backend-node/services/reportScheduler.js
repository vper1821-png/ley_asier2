import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ReportConfig from '../models/report.js';
import ReportHistory from '../models/reportHistory.js';
import Agent from '../models/agent.js';
import DatabaseConnection from '../models/databaseConnection.js';
import { DataConsent, DataInventory, BreachReport, ComplianceConfig } from '../models/compliance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

let intervalId = null;

export function startReportScheduler() {
  if (intervalId) return;
  console.log('[REPORT-SCHEDULER] Starting report scheduler (interval: 1h)');
  intervalId = setInterval(checkScheduledReports, CHECK_INTERVAL_MS);
}

export function stopReportScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[REPORT-SCHEDULER] Report scheduler stopped');
  }
}

async function generateScheduledReport(userId) {
  const [consents, breaches, inventory, config] = await Promise.all([
    DataConsent.find({ userId }).lean(),
    BreachReport.find({ userId }).lean(),
    DataInventory.find({ userId }).lean(),
    ComplianceConfig.findOne({ userId }).lean(),
  ]);

  const activeConsents = consents.filter(c => !c.revokedAt).length;
  const openBreaches = breaches.filter(b => b.status !== 'resolved').length;
  const resolvedBreaches = breaches.filter(b => b.status === 'resolved').length;

  const summary = {
    generatedAt: new Date().toISOString(),
    userId: userId.toString(),
    reportType: 'scheduled_compliance',
    companyName: config?.companyName || 'Empresa',
    stats: {
      consentsTotal: consents.length,
      consentsActive: activeConsents,
      breachesTotal: breaches.length,
      breachesOpen: openBreaches,
      breachesResolved: resolvedBreaches,
      inventoryCount: inventory.length,
      complianceLevel: config?.complianceLevel || 'basic',
      dataRetentionPolicy: config?.dataRetentionPolicy || 'No definida',
    },
  };

  const dateFile = new Date().toISOString().split('T')[0];
  const fileName = `reporte-automatico-${dateFile}-${Date.now()}.json`;
  const filePath = path.join(REPORTS_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));

  return ReportHistory.create({
    userId,
    title: `Reporte Automático - ${dateFile}`,
    type: 'compliance',
    filePath,
    fileSize: fs.statSync(filePath).size,
    automated: true,
    includeSections: ['summary'],
  });
}

async function checkScheduledReports() {
  try {
    const configs = await ReportConfig.find({ 'schedule.enabled': true }).lean();
    const now = new Date();

    for (const config of configs) {
      const lastRun = config.schedule?.lastRun ? new Date(config.schedule.lastRun) : null;
      const frequency = config.schedule?.frequency || 'weekly';
      let shouldRun = false;

      if (!lastRun) {
        shouldRun = true;
      } else {
        const diffMs = now - lastRun;
        switch (frequency) {
          case 'daily': shouldRun = diffMs >= 24 * 60 * 60 * 1000; break;
          case 'weekly': shouldRun = diffMs >= 7 * 24 * 60 * 60 * 1000; break;
          case 'monthly': shouldRun = diffMs >= 30 * 24 * 60 * 60 * 1000; break;
          default: shouldRun = diffMs >= 7 * 24 * 60 * 60 * 1000;
        }
      }

      if (shouldRun) {
        console.log(`[REPORT-SCHEDULER] Generating report for user ${config.userId} (frequency: ${frequency})`);
        try {
          await generateScheduledReport(config.userId);
          console.log(`[REPORT-SCHEDULER] Report generated for user ${config.userId}`);
        } catch (err) {
          console.error(`[REPORT-SCHEDULER] Failed to generate report for user ${config.userId}:`, err.message);
        }
        await ReportConfig.findOneAndUpdate(
          { _id: config._id },
          { $set: { 'schedule.lastRun': now } }
        );
      }
    }
  } catch (err) {
    console.error('[REPORT-SCHEDULER] Error:', err.message);
  }
}

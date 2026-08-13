import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Scan, ScanProgress, Report } from '../models/db.js';
import { validateToken } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

router.get('/ping', (req, res) => res.json({ ok: true, timestamp: Date.now() }));

const activeScans = new Map();

async function getUserId(token) {
  const user = await validateToken(token);
  return user ? user.UserID : null;
}

function generateScanResults(domain, scanType) {
  const severities = ['critical', 'high', 'medium', 'low'];
  const vulnTypes = ['SQL Injection', 'XSS', 'CSRF', 'LFI', 'SSRF', 'Command Injection', 'Open Redirect'];
  const vulns = [];
  for (let i = 0; i < Math.floor(Math.random() * 15) + 3; i++) {
    vulns.push({
      type: vulnTypes[i % vulnTypes.length],
      severity: severities[Math.floor(Math.random() * severities.length)],
      title: `${vulnTypes[i % vulnTypes.length]} en ${domain}`,
      url: `https://${domain}/${Math.random().toString(36).substring(7)}`,
      cve: `CVE-2024-${Math.floor(Math.random() * 9999)}`,
      cvss: (Math.random() * 10).toFixed(1),
    });
  }
  const ports = [21, 22, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 1433, 3306, 3389, 5432, 6379, 8080, 8443, 27017]
    .sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 10) + 5)
    .map(p => ({ port: p, service: ({ 21: 'FTP', 22: 'SSH', 80: 'HTTP', 443: 'HTTPS', 3306: 'MySQL', 5432: 'PostgreSQL' }[p]) || 'Unknown', status: Math.random() > 0.2 ? 'open' : 'filtered' }));

  const prefixes = ['www', 'mail', 'api', 'admin', 'blog', 'dev', 'cdn', 'app', 'forum', 'wiki', 'shop', 'support'];
  const subdomains = prefixes.map(p => ({
    subdomain: `${p}.${domain}`, ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, isAlive: Math.random() > 0.3,
  }));

  return {
    domain, scanType,
    summary: {
      totalVulnerabilities: vulns.length,
      critical: vulns.filter(v => v.severity === 'critical').length,
      high: vulns.filter(v => v.severity === 'high').length,
      medium: vulns.filter(v => v.severity === 'medium').length,
      low: vulns.filter(v => v.severity === 'low').length,
      openPorts: ports.filter(p => p.status === 'open').length,
      totalSubdomains: subdomains.length,
    },
    vulnerabilities: vulns, ports, subdomains,
  };
}

function processScanAsync(scanId, domain, scanType, userId, resumeFrom = 0) {
  const scan = activeScans.get(scanId);
  if (!scan) return;

  let step = resumeFrom;
  const interval = setInterval(async () => {
    if (!activeScans.has(scanId) || scan.status === 'cancelled') {
      clearInterval(interval); return;
    }
    if (scan.status === 'paused') return;

    step += Math.floor(Math.random() * 5) + 1;
    if (step >= 100) {
      step = 100; scan.status = 'completed'; scan.progress = 100;
      const results = generateScanResults(domain, scanType);
      await Scan.create({ userId, domain, scanType, status: 'completed', results, startedAt: scan.startedAt, completedAt: new Date(), durationSeconds: Math.floor(Math.random() * 120) + 10 });
      await ScanProgress.deleteOne({ scanId });
      activeScans.delete(scanId);
      clearInterval(interval); return;
    }
    scan.progress = step;
    await ScanProgress.updateOne({ scanId }, { $set: { progressJson: { progress: step, currentStep: `Scanning ${step}%` }, status: 'running' } }, { upsert: true });
  }, 2000);
}

router.post('/start', async (req, res) => {
  const { token, domain, scanType } = req.body;
  const userId = await getUserId(token);
  if (!userId) return res.json({ error: 'token inválido' });

  const scanId = uuidv4();
  activeScans.set(scanId, { id: scanId, userId, domain, scanType: scanType || 'full', status: 'running', progress: 0, startedAt: new Date() });
  await ScanProgress.create({ scanId, userId, domain, scanType: scanType || 'full', status: 'running', progressJson: { progress: 0 } });
  processScanAsync(scanId, domain, scanType || 'full', userId);
  res.json({ scanId, message: 'Escaneo iniciado', status: 'running', startedAt: new Date().toISOString() });
});

router.post('/async', async (req, res) => {
  const { token, domain, scanType, resumeFrom } = req.body;
  const userId = await getUserId(token);
  if (!userId) return res.json({ error: 'token inválido' });

  const scanId = uuidv4();
  activeScans.set(scanId, { id: scanId, userId, domain, scanType: scanType || 'full', status: 'running', progress: resumeFrom || 0, startedAt: new Date() });
  await ScanProgress.create({ scanId, userId, domain, scanType: scanType || 'full', status: 'running', progressJson: { progress: resumeFrom || 0 } });
  processScanAsync(scanId, domain, scanType || 'full', userId, resumeFrom || 0);
  res.json({ scanId, message: 'Escaneo asíncrono iniciado', status: 'running' });
});

router.post('/progress', async (req, res) => {
  const { token, scanID } = req.body;
  if (!await validateToken(token)) return res.json({ error: 'token inválido' });

  const scan = activeScans.get(scanID);
  if (!scan) return res.json({ error: 'Escaneo no encontrado', completed: true });

  const progress = await ScanProgress.findOne({ scanId: scanID });
  res.json({ scanId: scanID, status: scan.status, progress: scan.progress, data: progress?.progressJson || {}, domain: scan.domain, scanType: scan.scanType, startedAt: scan.startedAt });
});

router.post('/cancel', async (req, res) => {
  const { token, scanID } = req.body;
  if (!await validateToken(token)) return res.json({ error: 'token inválido' });
  const scan = activeScans.get(scanID);
  if (scan) { scan.status = 'cancelled'; activeScans.delete(scanID); await ScanProgress.updateOne({ scanId: scanID }, { status: 'cancelled' }); }
  res.json({ success: true, status: 'cancelled' });
});

router.post('/pause', async (req, res) => {
  const { token, scanID } = req.body;
  if (!await validateToken(token)) return res.json({ error: 'token inválido' });
  const scan = activeScans.get(scanID);
  if (scan) { scan.status = 'paused'; await ScanProgress.updateOne({ scanId: scanID }, { status: 'paused' }); }
  res.json({ success: true, status: 'paused' });
});

router.post('/resume', async (req, res) => {
  const { token, scanID } = req.body;
  if (!await validateToken(token)) return res.json({ error: 'token inválido' });
  const scan = activeScans.get(scanID);
  if (scan && scan.status === 'paused') { scan.status = 'running'; await ScanProgress.updateOne({ scanId: scanID }, { status: 'running' }); processScanAsync(scanID, scan.domain, scan.scanType, scan.userId, scan.progress); }
  res.json({ success: true, status: 'running' });
});

router.post('/stop', async (req, res) => {
  const { token } = req.body;
  const userId = await getUserId(token);
  if (!userId) return res.json({ error: 'token inválido' });
  for (const [id, scan] of activeScans) { if (scan.userId === userId && scan.status === 'running') { scan.status = 'cancelled'; await ScanProgress.updateOne({ scanId: id }, { status: 'cancelled' }); activeScans.delete(id); } }
  res.json({ success: true });
});

router.post('/skip', (req, res) => res.json({ success: true }));
router.post('/checkDomain', async (req, res) => {
  const { token, domain } = req.body;
  const userId = await getUserId(token);
  if (!userId) return res.json({ error: 'token inválido' });
  const scan = await Scan.findOne({ userId, domain }).sort({ startedAt: -1 });
  res.json({ exists: !!scan, scan });
});

router.post('/history', async (req, res) => {
  const { token } = req.body;
  const userId = await getUserId(token);
  if (!userId) return res.json({ error: 'token inválido' });
  const scans = await Scan.find({ userId }).sort({ startedAt: -1 }).lean();
  res.json(scans);
});

router.post('/byId', async (req, res) => {
  const { token, scanID } = req.body;
  if (!await validateToken(token)) return res.json({ error: 'token inválido' });
  const scan = await Scan.findById(scanID).lean();
  if (!scan) return res.json({ error: 'Scan not found' });
  res.json(scan);
});

router.post('/delete', async (req, res) => {
  const { token, scanID } = req.body;
  const userId = await getUserId(token);
  if (!userId) return res.json({ error: 'token inválido' });
  await Scan.deleteOne({ _id: scanID, userId });
  res.json({ success: true });
});

router.post('/deleteAll', async (req, res) => {
  const { token } = req.body;
  const userId = await getUserId(token);
  if (!userId) return res.json({ error: 'token inválido' });
  const result = await Scan.deleteMany({ userId });
  res.json({ success: true, deletedCount: result.deletedCount });
});

router.post('/recover', async (req, res) => {
  const { token, scanID } = req.body;
  if (!await validateToken(token)) return res.json({ error: 'token inválido' });
  const progress = await ScanProgress.findOne({ scanId: scanID });
  if (!progress) return res.json({ error: 'No progress found' });
  res.json({ scanId: scanID, progress: progress.progressJson, status: progress.status });
});

router.post('/allowedDomain', async (req, res) => {
  const user = await validateToken(req.body.token);
  if (!user) return res.json({ error: 'token inválido' });
  res.json({ domain: user.domain });
});

router.post('/generatePdf', async (req, res) => {
  const { token, scanID } = req.body;
  if (!await validateToken(token)) return res.json({ error: 'token inválido' });
  const scan = await Scan.findById(scanID);
  if (!scan) return res.json({ error: 'Scan not found' });

  const reportsDir = path.resolve(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const filename = `report_${scanID}_${Date.now()}.pdf`;
  const filePath = path.join(reportsDir, filename);
  fs.writeFileSync(filePath, `Domain Scan Report - ${scan.domain}\nType: ${scan.scanType}\nStatus: ${scan.status}`);

  await Report.create({ scanId: scan._id, userId: scan.userId, reportType: 'pdf', filePath: filename });
  res.json({ success: true, filename, message: 'Reporte generado correctamente' });
});

router.get('/downloadPdf', (req, res) => {
  const { filename } = req.query;
  if (!filename) return res.status(400).json({ error: 'Filename required' });
  const safeName = path.basename(filename);
  const filePath = path.resolve(__dirname, '..', 'reports', safeName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.download(filePath, safeName);
});

export default router;

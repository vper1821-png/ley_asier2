import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { CONFIG } from '../config.js';
import ReportHistory from '../models/reportHistory.js';
import Agent from '../models/agent.js';
import DatabaseConnection from '../models/databaseConnection.js';
import { DataConsent, DataInventory, BreachReport, ComplianceConfig, TrainingRecord, DataProtectionImpactAssessment, DataProcessingAgreement, AuditLog, PseudonymizationRule } from '../models/compliance.js';
import { authMiddleware } from '../middleware/auth.js';
import { AdminSettings, User } from '../models/db.js';
import { sendReportEmail } from '../services/email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();
const REPORTS_DIR = path.join(__dirname, '..', CONFIG.REPORTS_DIR || 'reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

export async function cleanupLegacyReports() {
  try {
    const oldReports = await ReportHistory.find({ filePath: /\.html$/i }).lean();
    for (const r of oldReports) {
      if (fs.existsSync(r.filePath)) {
        try { fs.unlinkSync(r.filePath); } catch {}
      }
    }
    await ReportHistory.deleteMany({ filePath: /\.html$/i });
    if (oldReports.length > 0) console.log(`[REPORTS] Cleaned up ${oldReports.length} old HTML report(s)`);
  } catch {}
}

const MARGIN = 45;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const W = PAGE_W - MARGIN * 2;

const C = {
  bgDark: '#1a1a1a',
  bgCard: '#2a2a2a',
  bgBody: '#f5f5f5',
  primary: '#000000',
  danger: '#4a4a4a',
  warning: '#6a6a6a',
  info: '#3a3a3a',
  textWhite: '#ffffff',
  textMuted: '#777777',
  textBody: '#1a1a1a',
  textSecondary: '#555555',
  border: '#bbbbbb',
};

function rect(doc, x, y, w, h, color) {
  doc.rect(x, y, w, h).fill(color);
}

function coverPage(doc, title, companyName, dateStr) {
  rect(doc, 0, 0, PAGE_W, PAGE_H, '#ffffff');

  // Top border line
  rect(doc, 0, 0, PAGE_W, 2, '#000000');

  // Legal document label
  doc.fillColor(C.textMuted).fontSize(9).font('Helvetica')
    .text('REPÚBLICA DE CHILE', MARGIN, 120, { width: W, align: 'center' });
  doc.fillColor(C.textMuted).fontSize(8).font('Helvetica')
    .text('Ley 21.719 - Protección de Datos Personales', MARGIN, 138, { width: W, align: 'center' });

  // Horizontal separator
  const sepTop = 170;
  doc.moveTo(MARGIN + 60, sepTop).lineTo(PAGE_W - MARGIN - 60, sepTop).strokeColor('#000000').lineWidth(0.5).stroke();

  // Company name
  doc.fillColor(C.textBody).fontSize(14).font('Helvetica-Bold')
    .text(companyName.toUpperCase(), MARGIN, 200, { width: W, align: 'center' });

  // Report title
  doc.fillColor(C.textBody).fontSize(20).font('Helvetica-Bold')
    .text(title, MARGIN, 235, { width: W, align: 'center' });

  // Subtitle
  doc.fillColor(C.textSecondary).fontSize(10).font('Helvetica')
    .text('Reporte de Cumplimiento', MARGIN, 280, { width: W, align: 'center' });

  // Bottom separator
  const sepBottom = 310;
  doc.moveTo(MARGIN + 60, sepBottom).lineTo(PAGE_W - MARGIN - 60, sepBottom).strokeColor('#000000').lineWidth(0.5).stroke();

  // Date box
  rect(doc, MARGIN + 60, 340, W - 120, 40, C.bgBody);
  doc.rect(MARGIN + 60, 340, W - 120, 40).strokeColor(C.border).lineWidth(0.5).stroke();
  doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica')
    .text('FECHA DE EMISIÓN', MARGIN + 70, 348, { width: W - 140, align: 'center' });
  doc.fillColor(C.textBody).fontSize(10).font('Helvetica-Bold')
    .text(dateStr, MARGIN + 70, 362, { width: W - 140, align: 'center' });

  // Classification
  rect(doc, MARGIN + 60, 395, W - 120, 30, C.bgBody);
  doc.rect(MARGIN + 60, 395, W - 120, 30).strokeColor(C.border).lineWidth(0.5).stroke();
  doc.fillColor(C.textBody).fontSize(8).font('Helvetica-Bold')
    .text('CLASIFICACIÓN: CONFIDENCIAL', MARGIN + 70, 403, { width: W - 140, align: 'center' });
}

function pageHeader(doc, title) {
  rect(doc, 0, 0, PAGE_W, 40, '#000000');
  rect(doc, 0, 40, PAGE_W, 1, '#000000');

  doc.fillColor(C.textWhite).fontSize(8).font('Helvetica')
    .text('Ley 21.719 · Protección de Datos Personales · Chile', MARGIN, 10, { width: W });
  doc.fillColor(C.textWhite).fontSize(10).font('Helvetica-Bold')
    .text(title, MARGIN, 22, { width: W });
  doc.moveDown(4);
  doc.y = 60;
}

function pageFooter(doc) {
  const fy = doc.page.height - 30;
  doc.rect(0, fy, doc.page.width, 30).fill('#f5f5f5');
  doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(0, fy).lineTo(doc.page.width, fy).stroke();
  doc.fillColor('#999999').fontSize(7).font('Helvetica')
    .text('Ley 21.719 · Reporte de Cumplimiento', MARGIN, fy + 10, { width: W, lineBreak: false });
}

function sectionTitle(doc, number, title) {
  const y = doc.y;
  if (y > PAGE_H - 50) doc.addPage();

  rect(doc, MARGIN, doc.y, 4, 22, '#000000');
  doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
    .text(`${String(number).padStart(2, '0')}`, MARGIN + 14, doc.y + 1, { width: 30 });
  doc.fillColor(C.textBody).fontSize(14).font('Helvetica-Bold')
    .text(title, MARGIN + 40, doc.y + 1, { width: W - 50 });
  doc.y += 26;
  doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + W, doc.y).strokeColor(C.border).lineWidth(0.5).stroke();
  doc.y += 10;
}

function kpiSummary(doc, items) {
  if (doc.y > PAGE_H - 80) doc.addPage();
  doc.fillColor(C.textBody).fontSize(9).font('Helvetica');
  items.forEach((item, i) => {
    doc.text(`${item.label}: ${item.value}`, MARGIN, doc.y, { width: W, continued: false });
    doc.moveDown(0.6);
  });
  doc.moveDown(1);
}

function dataTable(doc, headers, rows, colWidths, rowColors) {
  const rowH = 20;
  const headerH = 24;
  const startY = doc.y;

  if (startY + headerH + rows.length * rowH + 20 > PAGE_H - 60) {
    doc.addPage();
  }

  let y = doc.y;

  // Header
  rect(doc, MARGIN, y, W, headerH, C.bgDark);
  doc.fillColor(C.textMuted).fontSize(7.5).font('Helvetica-Bold');
  let x = MARGIN + 8;
  headers.forEach((h, i) => {
    doc.text(h, x, y + 7, { width: colWidths[i] || 80 });
    x += colWidths[i] || 80;
  });

  y += headerH;

  // Rows
  rows.forEach((row, ri) => {
    if (y + rowH > PAGE_H - 60) {
      // New page with repeated header
      doc.addPage();
      y = MARGIN;
      rect(doc, MARGIN, y, W, headerH, C.bgDark);
      doc.fillColor(C.textMuted).fontSize(7.5).font('Helvetica-Bold');
      x = MARGIN + 8;
      headers.forEach((h, i) => {
        doc.text(h, x, y + 7, { width: colWidths[i] || 80 });
        x += colWidths[i] || 80;
      });
      y += headerH;
    }

    if (ri % 2 === 1) {
      rect(doc, MARGIN, y, W, rowH, '#f1f5f9');
    }

    x = MARGIN + 8;
    row.forEach((cell, ci) => {
      const color = rowColors?.[ri]?.[ci] || C.textBody;
      doc.fillColor(color).fontSize(7.5).font('Helvetica');
      doc.text(String(cell ?? '-'), x, y + 5.5, { width: colWidths[ci] || 80 });
      x += colWidths[ci] || 80;
    });
    y += rowH;
  });

  doc.y = y + 8;
}



// POST /api/reports/list
router.post('/list', authMiddleware, async (req, res) => {
  try {
    const reports = await ReportHistory.find({ userId: req.user.UserID })
      .sort({ createdAt: -1 }).lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/generate
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { title } = req.body;

    const [agents, databases, consents, inventory, breaches, config, dpias, dpas, auditLogs, trainings, pseudoRules] = await Promise.all([
      Agent.find({ userId }).lean(),
      DatabaseConnection.find({ userId }).lean(),
      DataConsent.find({ userId }).lean(),
      DataInventory.find({ userId }).lean(),
      BreachReport.find({ userId }).lean(),
      ComplianceConfig.findOne({ userId }).lean(),
      DataProtectionImpactAssessment.find({ userId }).sort({ createdAt: -1 }).lean(),
      DataProcessingAgreement.find({ userId }).sort({ createdAt: -1 }).lean(),
      AuditLog.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      TrainingRecord.find({ userId }).sort({ date: -1 }).lean(),
      PseudonymizationRule.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    const companyName = config?.companyName || req.user.email || 'Empresa';
    const dateStr = new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const dateFile = new Date().toISOString().split('T')[0];
    const reportTitle = title || `Reporte de Cumplimiento - ${dateFile}`;

    const onlineAgents = agents.filter(a => a.status === 'online').length;
    const totalTables = databases.reduce((s, d) => s + (d.metrics?.tablesCount || 0), 0);
    const totalRecords = databases.reduce((s, d) => s + (d.metrics?.recordsCount || 0), 0);
    const openBreaches = breaches.filter(b => b.status !== 'resolved').length;
    const resolvedBreaches = breaches.filter(b => b.status === 'resolved').length;
    const activeConsents = consents.filter(c => !c.revokedAt).length;
    const sensitiveItems = inventory.filter(i => i.sensitive);
    const highRiskItems = inventory.filter(i => i.risk === 'high' || i.risk === 'critical');
    const trainedCount = trainings.filter(t => t.signatureData).length;

    const dbScores = databases.map(db => {
      const dbBreaches = breaches.filter(b => (b.description || '').toLowerCase().includes((db.name || '').toLowerCase()));
      const dbInventory = inventory.filter(i => (i.storageLocation || '').toLowerCase().includes((db.name || '').toLowerCase()));
      const hasConsent = dbInventory.every(i => consents.some(c => c.purpose === i.purpose && !c.revokedAt));
      const score = Math.max(0, Math.min(100,
        (hasConsent ? 30 : 0) + (dbInventory.length > 0 ? 25 : 0) +
        (dbBreaches.filter(b => b.status !== 'resolved').length === 0 ? 25 : 0) +
        (db.metrics?.lastScanned ? 20 : 0)
      ));
      return { name: db.name, engine: db.engine, tables: db.metrics?.tablesCount || 0, score, compliant: score >= 70 };
    });
    const complianceScore = dbScores.length > 0 ? Math.round(dbScores.reduce((s, d) => s + d.score, 0) / dbScores.length) : 0;

    // ─── COMPLIANCE CHECKLIST ────────────────────────────────────
    const hasDpd = !!(config?.dpdEmail);
    const hasApdp = !!(config?.apdpRegistered);
    const hasPrivacyPolicy = !!(config?.privacyPolicyUrl);
    const hasCookiesPolicy = !!(config?.cookiesPolicyUrl);
    const hasRetentionPolicy = !!(config?.dataRetentionPolicy);
    const hasInventory = inventory.length > 0;
    const hasConsents = consents.length > 0;
    const allConsentsActive = hasConsents && consents.every(c => !c.revokedAt);
    const hasDpias = dpias.length > 0;
    const approvedDpias = dpias.filter(d => d.status === 'approved').length;
    const hasDpas = dpas.length > 0;
    const activeDpas = dpas.filter(d => d.status === 'active').length;
    const hasBreaches = breaches.length > 0;
    const hasTrainings = trainings.length > 0;
    const allTrained = hasTrainings && trainedCount === trainings.length;
    const hasAudit = auditLogs.length > 0;
    const hasSensitiveHandled = sensitiveItems.length === 0 || sensitiveItems.every(si => consents.some(c => !c.revokedAt && c.purpose === si.purpose));
    const hasHighRiskDpias = highRiskItems.length === 0 || hasDpias;
    const hasIntlTransferOk = !dpas.some(d => d.internationalTransfer && (!d.transferGuarantees || d.status !== 'active'));
    const hasPseudo = pseudoRules.length > 0;

    const checks = [
      { category: 'Identificación y Registro', items: [
        { label: 'Delegado de Protección de Datos (DPD) designado', pass: hasDpd, article: 'Art. 28', severity: 'grave', detail: hasDpd ? `DPD: ${config.dpdName} (${config.dpdEmail})` : 'No se ha designado un Delegado de Protección de Datos' },
        { label: 'Inscripción en Registro de la APDP', pass: hasApdp, article: 'Art. 31', severity: 'grave', detail: hasApdp ? 'Registrado ante la APDP' : 'No se ha registrado ante la Agencia de Protección de Datos Personales' },
        { label: 'Razón social y RUT identificados', pass: !!(config?.companyName && config?.companyRut), article: 'Art. 14 ter', severity: 'leve', detail: config?.companyRut ? `RUT: ${config.companyRut}` : 'Falta identificación formal de la empresa' },
      ]},
      { category: 'Política de Privacidad', items: [
        { label: 'Política de privacidad publicada', pass: hasPrivacyPolicy, article: 'Art. 14 ter', severity: 'leve', detail: hasPrivacyPolicy ? `URL: ${config.privacyPolicyUrl}` : 'No se ha publicado política de privacidad' },
        { label: 'Política de cookies publicada', pass: hasCookiesPolicy, article: 'Art. 14 ter', severity: 'leve', detail: hasCookiesPolicy ? `URL: ${config.cookiesPolicyUrl}` : 'No se ha publicado política de cookies' },
        { label: 'Política de retención de datos definida', pass: hasRetentionPolicy, article: 'Art. 14', severity: 'leve', detail: hasRetentionPolicy ? `Retención: ${config.dataRetentionPolicy}` : 'No se ha definido política de retención' },
      ]},
      { category: 'Base de Licitud y Consentimiento', items: [
        { label: 'Consentimientos registrados para datos tratados', pass: allConsentsActive, article: 'Art. 12', severity: 'grave', detail: hasConsents ? `${activeConsents} consentimiento(s) activo(s) de ${consents.length} total` : 'No existen consentimientos registrados' },
        { label: 'Todos los datos sensibles con base legal', pass: hasSensitiveHandled, article: 'Art. 16', severity: 'gravísima', detail: hasSensitiveHandled ? 'Todos los datos sensibles tienen base legal asociada' : `${sensitiveItems.filter(si => !consents.some(c => !c.revokedAt && c.purpose === si.purpose)).length} dato(s) sensible(s) sin base legal` },
        { label: 'Datos de menores con consentimiento parental', pass: !inventory.some(i => i.category === 'children') || consents.some(c => c.purpose === 'children_data' && !c.revokedAt), article: 'Art. 16 quáter', severity: 'gravísima', detail: 'Consentimiento de padres/tutores para menores de 14 años' },
      ]},
      { category: 'Inventario de Tratamiento (RAT)', items: [
        { label: 'Inventario de datos personales registrado', pass: hasInventory, article: 'Art. 14', severity: 'grave', detail: hasInventory ? `${inventory.length} item(s) en inventario` : 'No existe registro de actividades de tratamiento' },
        { label: 'Categorías de datos documentadas', pass: inventory.length === 0 || inventory.every(i => i.category), article: 'Art. 14', severity: 'leve', detail: 'Cada item debe tener categoría asignada' },
        { label: 'Finalidades del tratamiento definidas', pass: inventory.length === 0 || inventory.every(i => i.purpose), article: 'Art. 3 literal b)', severity: 'grave', detail: 'Finalidad específica documentada para cada tratamiento' },
      ]},
      { category: 'Medidas de Seguridad', items: [
        { label: 'Nivel de seguridad adecuado al riesgo', pass: !!(config?.complianceLevel && config.complianceLevel !== 'basic'), article: 'Art. 14 quinquies', severity: 'grave', detail: config?.complianceLevel ? `Nivel: ${config.complianceLevel}` : 'No se ha evaluado el nivel de seguridad' },
        { label: 'Cifrado/seudonimización implementado', pass: hasPseudo, article: 'Art. 14 quinquies', severity: 'grave', detail: hasPseudo ? `${pseudoRules.length} regla(s) de seudonimización` : 'No se han configurado reglas de seudonimización' },
        { label: 'Monitoreo de seguridad activo', pass: onlineAgents > 0, article: 'Art. 14 quinquies', severity: 'grave', detail: onlineAgents > 0 ? `${onlineAgents} agente(s) monitoreando` : 'No hay agentes de monitoreo activos' },
      ]},
      { category: 'Brechas de Seguridad', items: [
        { label: 'Protocolo de notificación de brechas', pass: !hasBreaches || resolvedBreaches > 0, article: 'Art. 14 sexies', severity: 'gravísima', detail: hasBreaches ? `${resolvedBreaches} brecha(s) resuelta(s) de ${breaches.length} total` : 'Sin incidentes registrados' },
        { label: 'Notificación a APDP dentro de plazo', pass: !breaches.some(b => b.status !== 'resolved' && !b.notifiedAPDP), article: 'Art. 14 sexies', severity: 'gravísima', detail: breaches.filter(b => b.status !== 'resolved' && !b.notifiedAPDP).length > 0 ? `${breaches.filter(b => b.status !== 'resolved' && !b.notifiedAPDP).length} brecha(s) abierta(s) sin notificar a APDP` : 'Todas las brechas notificadas' },
      ]},
      { category: 'Evaluación de Impacto (DPIA)', items: [
        { label: 'DPIA realizadas para tratamientos de alto riesgo', pass: hasHighRiskDpias, article: 'Art. 14 quater', severity: 'grave', detail: hasDpias ? `${approvedDpias} DPIA aprobada(s) de ${dpias.length} total` : highRiskItems.length > 0 ? 'Existen items de alto riesgo sin DPIA' : 'No se requiere DPIA actualmente' },
        { label: 'DPIA aprobadas para datos sensibles', pass: sensitiveItems.length === 0 || dpias.some(d => d.sensitiveData && d.status === 'approved'), article: 'Art. 14 quater', severity: 'grave', detail: 'Evaluación de impacto para tratamientos con datos sensibles' },
      ]},
      { category: 'Acuerdos con Encargados (DPA)', items: [
        { label: 'Acuerdos con encargados vigentes', pass: !hasDpas || activeDpas > 0, article: 'Art. 29', severity: 'grave', detail: hasDpas ? `${activeDpas} DPA activo(s) de ${dpas.length} total` : 'No hay acuerdos con encargados registrados' },
        { label: 'Sin transferencias internacionales sin garantías', pass: hasIntlTransferOk, article: 'Art. 27', severity: 'gravísima', detail: hasIntlTransferOk ? 'Transferencias internacionales con garantías adecuadas' : 'Existe transferencia internacional sin garantías documentadas' },
      ]},
      { category: 'Capacitación', items: [
        { label: 'Programa de capacitación implementado', pass: hasTrainings, article: 'Art. 28 letra c)', severity: 'leve', detail: hasTrainings ? `${trainings.length} capacitación(es) registrada(s)` : 'No se ha implementado programa de capacitación' },
        { label: 'Personal capacitado con firma', pass: allTrained, article: 'Art. 28 letra c)', severity: 'leve', detail: hasTrainings ? `${trainedCount}/${trainings.length} colaborador(es) con firma` : 'Sin registros de capacitación' },
      ]},
      { category: 'Derechos ARCO', items: [
        { label: 'Mecanismo para ejercer derechos ARCO', pass: !!(config?.privacyPolicyUrl), article: 'Art. 4-9', severity: 'leve', detail: config?.privacyPolicyUrl ? 'Política de privacidad publicada (debe incluir mecanismo ARCO)' : 'Sin mecanismo documentado para derechos ARCO' },
        { label: 'Registro de solicitudes ARCO', pass: auditLogs.some(a => a.action === 'arco_response'), article: 'Art. 11', severity: 'leve', detail: auditLogs.filter(a => a.action === 'arco_response').length > 0 ? `${auditLogs.filter(a => a.action === 'arco_response').length} respuesta(s) ARCO registrada(s)` : 'Sin solicitudes ARCO registradas' },
      ]},
    ];

    const totalChecks = checks.reduce((s, c) => s + c.items.length, 0);
    const passedChecks = checks.reduce((s, c) => s + c.items.filter(i => i.pass).length, 0);
    const failedGravissima = checks.reduce((s, c) => s + c.items.filter(i => !i.pass && i.severity === 'gravísima').length, 0);
    const failedGrave = checks.reduce((s, c) => s + c.items.filter(i => !i.pass && i.severity === 'grave').length, 0);
    const failedLeve = checks.reduce((s, c) => s + c.items.filter(i => !i.pass && i.severity === 'leve').length, 0);

    // ═══════════════════════════════════════════════════════════════
    // BUILD PDF
    // ═══════════════════════════════════════════════════════════════
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 30, bottom: 50, left: MARGIN, right: MARGIN },
      info: { Title: reportTitle, Author: 'Plataforma de Cumplimiento - Ley 21.719' },
    });

    let pageNum = 0;
    doc.on('pageAdded', () => {
      pageNum++;
      if (pageNum === 1) return;
      doc.page.margins.left = MARGIN;
      const fy = doc.page.height - 30;
      doc.rect(0, fy, doc.page.width, 30).fill('#f5f5f5');
      doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(0, fy).lineTo(doc.page.width, fy).stroke();
      doc.fillColor('#999999').fontSize(7).font('Helvetica');
      const saveBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.text('Ley 21.719 · Reporte de Cumplimiento', MARGIN, fy + 8, { lineBreak: false });
      doc.text(`Página ${pageNum - 1}`, MARGIN, fy + 16, { lineBreak: false, align: 'right' });
      doc.page.margins.bottom = saveBottom;
      doc.y = 60;
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);

      // ══════ COVER ══════
      coverPage(doc, reportTitle, companyName, dateStr);

      // ══════ PAGE 2: IDENTIFICACIÓN DEL RESPONSABLE ══════
      doc.addPage();
      pageHeader(doc, 'Identificación del Responsable del Tratamiento');
      sectionTitle(doc, 1, 'Datos de la Organización');

      const idFields = [
        ['Razón Social', config?.companyName || '—'],
        ['RUT', config?.companyRut || '—'],
        ['Giro / Actividad', config?.companyActivity || '—'],
        ['Domicilio', config?.companyAddress || '—'],
        ['Email de Contacto', req.user.email || '—'],
        ['Nivel de Cumplimiento', config?.complianceLevel ? config.complianceLevel.charAt(0).toUpperCase() + config.complianceLevel.slice(1) : 'No evaluado'],
      ];
      idFields.forEach(([label, value]) => {
        doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica').text(label + ':', MARGIN, doc.y, { width: 120 });
        doc.fillColor(C.textBody).fontSize(9).font('Helvetica-Bold').text(value, MARGIN + 125, doc.y - 11, { width: W - 130 });
        doc.moveDown(0.8);
      });
      doc.moveDown(1);

      sectionTitle(doc, 2, 'Delegado de Protección de Datos (DPD)');
      if (hasDpd) {
        const dpdFields = [
          ['Nombre', config.dpdName || '—'],
          ['Email', config.dpdEmail || '—'],
          ['Teléfono', config.dpdPhone || '—'],
        ];
        dpdFields.forEach(([label, value]) => {
          doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica').text(label + ':', MARGIN, doc.y, { width: 120 });
          doc.fillColor(C.textBody).fontSize(9).font('Helvetica-Bold').text(value, MARGIN + 125, doc.y - 11, { width: W - 130 });
          doc.moveDown(0.8);
        });
      } else {
        doc.fillColor('#4a4a4a').fontSize(9).font('Helvetica-Bold')
          .text('⚠ NO SE HA DESIGNADO UN DELEGADO DE PROTECCIÓN DE DATOS', MARGIN, doc.y, { width: W });
        doc.moveDown(0.3);
        doc.fillColor(C.textBody).fontSize(8).font('Helvetica')
          .text('Art. 28 Ley 21.719: La designación del DPD es obligatoria para responsables que realizan tratamiento a gran escala de datos sensibles. Su ausencia constituye infracción grave sancionable con multa de hasta 10.000 UTM.', MARGIN, doc.y, { width: W });
      }
      doc.moveDown(1);

      sectionTitle(doc, 3, 'Registro ante la APDP');
      if (hasApdp) {
        doc.fillColor(C.textBody).fontSize(9).font('Helvetica')
          .text('La organización se encuentra inscrita en el Registro Nacional de Sanciones y Cumplimiento de la Agencia de Protección de Datos Personales (Art. 31).', MARGIN, doc.y, { width: W });
      } else {
        doc.fillColor('#4a4a4a').fontSize(9).font('Helvetica-Bold')
          .text('⚠ NO SE HA REGISTRADO ANTE LA APDP', MARGIN, doc.y, { width: W });
        doc.moveDown(0.3);
        doc.fillColor(C.textBody).fontSize(8).font('Helvetica')
          .text('Art. 31 Ley 21.719: Todo responsable del tratamiento debe inscribirse en el Registro Nacional. La omisión constituye infracción grave sancionable con multa de hasta 10.000 UTM.', MARGIN, doc.y, { width: W });
      }

      // ══════ PAGE 3: RESUMEN EJECUTIVO ══════
      doc.addPage();
      pageHeader(doc, 'Resumen Ejecutivo de Cumplimiento');
      sectionTitle(doc, 4, 'Indicadores Clave');

      const passRate = totalChecks > 0 ? Math.round(passedChecks / totalChecks * 100) : 0;
      const kpiItems = [
        { label: 'Score de Cumplimiento General', value: `${passRate}% (${passedChecks}/${totalChecks} requisitos cumplidos)` },
        { label: 'Infracciones Gravísimas Pendientes', value: `${failedGravissima}` },
        { label: 'Infracciones Graves Pendientes', value: `${failedGrave}` },
        { label: 'Infracciones Leves Pendientes', value: `${failedLeve}` },
        { label: 'Bases de Datos Monitoreadas', value: databases.length },
        { label: 'Items de Datos Registrados', value: inventory.length },
        { label: 'Consentimientos Activos', value: activeConsents },
        { label: 'Brechas de Seguridad', value: `${openBreaches} abierta(s) / ${resolvedBreaches} resuelta(s)` },
        { label: 'Agentes de Monitoreo', value: `${onlineAgents}/${agents.length}` },
        { label: 'Capacitaciones Firmadas', value: `${trainedCount}/${trainings.length}` },
      ];
      kpiSummary(doc, kpiItems);

      doc.moveDown(1);
      doc.fillColor(C.textBody).fontSize(9).font('Helvetica');
      if (passRate >= 90) {
        doc.text('Nivel de cumplimiento: EXCELENTE. La organización cumple con la mayoría de los requisitos establecidos en la Ley 21.719. Se recomienda mantener los controles actuales y realizar auditorías periódicas.', MARGIN, doc.y, { width: W });
      } else if (passRate >= 70) {
        doc.text(`Nivel de cumplimiento: ACEPTABLE. Se cumplen ${passedChecks} de ${totalChecks} requisitos. Se recomienda atender los ${totalChecks - passedChecks} requisitos pendientes para alcanzar un nivel óptimo de cumplimiento.`, MARGIN, doc.y, { width: W });
      } else if (passRate >= 50) {
        doc.text(`Nivel de cumplimiento: DEFICIENTE. Solo se cumplen ${passedChecks} de ${totalChecks} requisitos. La organización se expone a sanciones significativas. Se requiere acción inmediata.`, MARGIN, doc.y, { width: W });
      } else {
        doc.text(`Nivel de cumplimiento: CRÍTICO. Solo se cumplen ${passedChecks} de ${totalChecks} requisitos. La organización se encuentra en alto riesgo de sanciones de hasta 20.000 UTM. Se requiere plan de acción urgente.`, MARGIN, doc.y, { width: W });
      }

      // ══════ CHECKLIST DE CUMPLIMIENTO ══════
      doc.addPage();
      pageHeader(doc, 'Checklist de Cumplimiento - Ley 21.719');
      sectionTitle(doc, 5, 'Evaluación Detallada por Obligación Legal');

      checks.forEach((cat, ci) => {
        if (doc.y > PAGE_H - 100) doc.addPage();

        // Category header
        rect(doc, MARGIN, doc.y, W, 22, '#f0f0f0');
        doc.rect(MARGIN, doc.y, W, 22).strokeColor(C.border).lineWidth(0.3).stroke();
        doc.fillColor(C.textBody).fontSize(9).font('Helvetica-Bold')
          .text(cat.category, MARGIN + 8, doc.y + 5, { width: W - 16 });
        doc.y += 26;

        cat.items.forEach(item => {
          if (doc.y > PAGE_H - 70) {
            doc.addPage();
            pageHeader(doc, 'Checklist de Cumplimiento - Ley 21.719 (cont.)');
          }

          const startY = doc.y;
          const checkmark = item.pass ? '✓' : '✗';
          const checkColor = item.pass ? '#166534' : '#4a4a4a';

          // Status icon
          doc.fillColor(checkColor).fontSize(10).font('Helvetica-Bold')
            .text(checkmark, MARGIN + 4, startY, { width: 14 });

          // Check label
          doc.fillColor(C.textBody).fontSize(8).font('Helvetica')
            .text(item.label, MARGIN + 20, startY, { width: W - 100 });

          // Article reference
          doc.fillColor(C.textSecondary).fontSize(7).font('Helvetica')
            .text(item.article, MARGIN + W - 60, startY, { width: 55, align: 'right' });

          doc.y = startY + 12;

          // Detail line
          doc.fillColor(C.textSecondary).fontSize(7).font('Helvetica')
            .text(item.detail, MARGIN + 20, doc.y, { width: W - 40 });

          doc.y += 14;

          // Severity badge if failed
          if (!item.pass) {
            const sevLabels = { gravísima: 'GRAVÍSIMA', grave: 'GRAVE', leve: 'LEVE' };
            const sevMax = { gravísima: 'hasta 20.000 UTM', grave: 'hasta 10.000 UTM', leve: 'hasta 5.000 UTM' };
            doc.fillColor('#4a4a4a').fontSize(7).font('Helvetica-Bold')
              .text(`Infracción ${sevLabels[item.severity]} — Multa ${sevMax[item.severity]}`, MARGIN + 20, doc.y, { width: W - 40 });
            doc.y += 12;
          }

          // Separator
          doc.moveTo(MARGIN + 20, doc.y).lineTo(MARGIN + W, doc.y).strokeColor('#e0e0e0').lineWidth(0.3).stroke();
          doc.y += 6;
        });

        doc.moveDown(1);
      });

      // ══════ INVENTARIO DE TRATAMIENTO ══════
      if (hasInventory) {
        doc.addPage();
        pageHeader(doc, 'Registro de Actividades de Tratamiento (RAT)');
        sectionTitle(doc, 6, `Inventario de Datos Personales (${inventory.length} items)`);

        doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica')
          .text('Art. 14 Ley 21.719: El responsable debe mantener un registro documentado de las actividades de tratamiento, incluyendo finalidades, categorías de datos, destinatarios y plazos de conservación.', MARGIN, doc.y, { width: W });
        doc.moveDown(1);

        const invColors = inventory.slice(0, 25).map(item => [
          C.textBody,
          C.textSecondary,
          item.sensitive ? '#4a4a4a' : C.textSecondary,
          C.textBody,
        ]);

        dataTable(doc,
          ['Tipo de Dato', 'Categoría', 'Sensibles', 'Propósito'],
          inventory.slice(0, 25).map(item => [
            item.dataType || '-',
            item.category || '-',
            item.sensitive ? 'SÍ' : 'No',
            item.purpose || '-',
          ]),
          [W * 0.22, W * 0.18, W * 0.12, W * 0.38],
          invColors
        );
      }

      // ══════ CONSENTIMIENTOS ══════
      if (hasConsents) {
        doc.addPage();
        pageHeader(doc, 'Gestión de Consentimientos');
        sectionTitle(doc, 7, `Consentimientos Registrados (${consents.length})`);

        doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica')
          .text('Art. 12 Ley 21.719: El consentimiento debe ser libre, informado, específico, previo e inequívoco. Corresponde al responsable probar que contó con el consentimiento del titular.', MARGIN, doc.y, { width: W });
        doc.moveDown(1);

        const consentColors = consents.slice(0, 25).map(c => [
          C.textBody,
          C.textSecondary,
          c.revokedAt ? '#4a4a4a' : '#166534',
          C.textSecondary,
        ]);

        dataTable(doc,
          ['Propósito', 'Usuario', 'Estado', 'Otorgado'],
          consents.slice(0, 25).map(c => [
            c.purpose || '-',
            c.userEmail || c.grantedBy || '-',
            c.revokedAt ? 'Revocado' : 'Activo',
            c.grantedAt ? new Date(c.grantedAt).toLocaleDateString('es') : '-',
          ]),
          [W * 0.3, W * 0.25, W * 0.15, W * 0.15],
          consentColors
        );
      }

      // ══════ BRECHAS ══════
      if (hasBreaches) {
        doc.addPage();
        pageHeader(doc, 'Registro de Brechas de Seguridad');
        sectionTitle(doc, 8, `Brechas Reportadas (${breaches.length})`);

        doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica')
          .text('Art. 14 sexies: El responsable debe reportar a la APDP, sin dilaciones indebidas, las vulneraciones que generen riesgo para los derechos de los titulares. Cuando afecten datos sensibles, niños o datos económicos, debe también comunicar a los titulares.', MARGIN, doc.y, { width: W });
        doc.moveDown(1);

        doc.fillColor(C.textSecondary).fontSize(8.5).font('Helvetica')
          .text(`Total: ${breaches.length} · Abiertas: ${openBreaches} · Resueltas: ${resolvedBreaches}`, MARGIN, doc.y, { width: W });
        doc.moveDown(1);

        const breachColors = breaches.slice(0, 20).map(b => [
          C.textBody,
          b.severity === 'critical' || b.severity === 'high' ? '#4a4a4a' : C.textBody,
          b.status === 'resolved' ? '#166534' : '#4a4a4a',
          C.textSecondary,
        ]);

        dataTable(doc,
          ['Tipo', 'Severidad', 'Estado', 'Detectado'],
          breaches.slice(0, 20).map(b => [
            b.type || '-',
            b.severity || '-',
            b.status === 'resolved' ? 'Resuelta' : 'Abierta',
            b.detectedAt ? new Date(b.detectedAt).toLocaleDateString('es') : '-',
          ]),
          [W * 0.25, W * 0.2, W * 0.15, W * 0.2],
          breachColors
        );
      }

      // ══════ DPIAs ══════
      if (hasDpias) {
        doc.addPage();
        pageHeader(doc, 'Evaluaciones de Impacto en Protección de Datos');
        sectionTitle(doc, 9, `DPIAs Registradas (${dpias.length})`);

        doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica')
          .text('Art. 14 quater: Cuando el tratamiento represente un riesgo alto para los derechos de los titulares, deberá realizarse una Evaluación de Impacto antes de iniciar el tratamiento.', MARGIN, doc.y, { width: W });
        doc.moveDown(1);

        const riskLabels = { not_assessed: 'No evaluado', low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico' };
        const statusLabels = { draft: 'Borrador', in_review: 'En revisión', approved: 'Aprobado', rejected: 'Rechazado', needs_revision: 'Requiere revisión' };

        dpias.slice(0, 15).forEach(dpia => {
          if (doc.y > PAGE_H - 80) doc.addPage();
          doc.fillColor(C.textBody).fontSize(9).font('Helvetica-Bold')
            .text(dpia.title || 'Sin título', MARGIN, doc.y, { width: W });
          doc.fillColor(C.textSecondary).fontSize(7.5).font('Helvetica')
            .text(`Riesgo: ${riskLabels[dpia.riskLevel] || dpia.riskLevel || '-'} · Estado: ${statusLabels[dpia.status] || dpia.status || '-'} · Sensibles: ${dpia.sensitiveData ? 'SÍ' : 'No'}`, MARGIN + 8, doc.y, { width: W - 8 });
          doc.moveDown(0.8);
          doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + W, doc.y).strokeColor('#e0e0e0').lineWidth(0.3).stroke();
          doc.y += 4;
        });
      }

      // ══════ DPAs ══════
      if (hasDpas) {
        doc.addPage();
        pageHeader(doc, 'Acuerdos con Encargados de Tratamiento');
        sectionTitle(doc, 10, `DPAs Registrados (${dpas.length})`);

        doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica')
          .text('Art. 29: El encargado del tratamiento debe ofrecer garantías suficientes para aplicar medidas técnicas y organizativas adecuadas. Las transferencias internacionales requieren países con nivel adecuado o cláusulas contractuales (Art. 27).', MARGIN, doc.y, { width: W });
        doc.moveDown(1);

        dpas.slice(0, 15).forEach(dpa => {
          if (doc.y > PAGE_H - 60) doc.addPage();
          doc.fillColor(C.textBody).fontSize(9).font('Helvetica-Bold')
            .text(dpa.processorName || 'Sin nombre', MARGIN, doc.y, { width: W });
          doc.fillColor(C.textSecondary).fontSize(7.5).font('Helvetica')
            .text(`Servicio: ${dpa.serviceDescription || '-'} · Estado: ${dpa.status || '-'}${dpa.internationalTransfer ? ` · Transferencia internacional a: ${dpa.transferCountry || '?'}` : ''}`, MARGIN + 8, doc.y, { width: W - 8 });
          doc.moveDown(0.8);
          doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + W, doc.y).strokeColor('#e0e0e0').lineWidth(0.3).stroke();
          doc.y += 4;
        });
      }

      // ══════ CAPACITACIÓN ══════
      if (hasTrainings) {
        doc.addPage();
        pageHeader(doc, 'Programa de Capacitación');
        sectionTitle(doc, 11, `Capacitaciones Registradas (${trainings.length})`);

        doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica')
          .text('Art. 28 letra c): El responsable debe implementar programas de capacitación periódica en protección de datos personales para todo el personal que participe en operaciones de tratamiento.', MARGIN, doc.y, { width: W });
        doc.moveDown(1);

        const topicLabels = {
          proteccion_datos: 'Protección de Datos Personales',
          ciberseguridad: 'Ciberseguridad',
          brechas: 'Protocolo de Brechas',
          arco: 'Derechos ARCO',
          consentimientos: 'Gestión de Consentimientos',
          general: 'General',
        };

        const trainColors = trainings.slice(0, 20).map(t => [
          C.textBody,
          C.textSecondary,
          t.signatureData ? '#166534' : t.completed ? C.textBody : '#4a4a4a',
          C.textSecondary,
        ]);

        dataTable(doc,
          ['Colaborador', 'Tema', 'Estado', 'Fecha'],
          trainings.slice(0, 20).map(t => [
            t.employeeName || '-',
            topicLabels[t.topic] || t.topic || '-',
            t.signatureData ? 'Firmado' : t.completed ? 'Completado' : 'Pendiente',
            t.date ? new Date(t.date).toLocaleDateString('es') : '-',
          ]),
          [W * 0.25, W * 0.25, W * 0.15, W * 0.15],
          trainColors
        );
      }

      // ══════ HALLAZGOS CRÍTICOS (reales) ══════
      let sectionNum = 12;

      const criticalFindings = [];

      // Only real critical issues
      const criticalInventory = inventory.filter(item =>
        item.sensitive === true &&
        (item.risk === 'critical' || item.risk === 'high') &&
        !consents.some(c => !c.revokedAt && c.purpose === item.purpose)
      );
      if (criticalInventory.length > 0) {
        criticalFindings.push({ type: 'inventory', count: criticalInventory.length, items: criticalInventory });
      }

      const criticalBreaches = breaches.filter(b =>
        b.status !== 'resolved' && (b.severity === 'critical' || b.severity === 'high')
      );
      if (criticalBreaches.length > 0) {
        criticalFindings.push({ type: 'breaches', count: criticalBreaches.length, items: criticalBreaches });
      }

      const criticalDpas = dpas.filter(d =>
        d.internationalTransfer === true || d.status === 'expired' || d.status === 'terminated'
      );
      if (criticalDpas.length > 0) {
        criticalFindings.push({ type: 'dpas', count: criticalDpas.length, items: criticalDpas });
      }

      if (criticalFindings.length > 0) {
        doc.addPage();
        pageHeader(doc, 'Hallazgos Críticos de Cumplimiento');
        sectionTitle(doc, sectionNum++, 'Incumplimientos que Requieren Acción Inmediata');

        doc.fillColor('#4a4a4a').fontSize(9).font('Helvetica-Bold')
          .text(`Se identificaron ${criticalFindings.reduce((s, f) => s + f.count, 0)} hallazgo(s) crítico(s) que representan riesgo real de sanción ante la APDP.`, MARGIN, doc.y, { width: W });
        doc.moveDown(1);

        if (criticalInventory.length > 0) {
          if (doc.y > PAGE_H - 120) doc.addPage();
          sectionTitle(doc, sectionNum++, `Datos sensibles sin base legal (${criticalInventory.length})`);
          doc.fillColor(C.danger).fontSize(8).font('Helvetica-Bold')
            .text('INFRACCIÓN GRAVE — Art. 16: Tratar datos sensibles sin consentimiento expreso puede acarrear multa de hasta 10.000 UTM.', MARGIN, doc.y, { width: W });
          doc.moveDown(1);
          dataTable(doc,
            ['Tipo de Dato', 'Categoría', 'Sin Base Legal'],
            criticalInventory.map(item => [item.dataType || '-', item.category || '-', item.purpose || 'Sin propósito']),
            [W * 0.3, W * 0.3, W * 0.3],
            criticalInventory.map(() => [C.textBody, C.textSecondary, '#4a4a4a'])
          );
        }

        if (criticalBreaches.length > 0) {
          if (doc.y > PAGE_H - 120) doc.addPage();
          sectionTitle(doc, sectionNum++, `Brechas activas de alta severidad (${criticalBreaches.length})`);
          doc.fillColor(C.danger).fontSize(8).font('Helvetica-Bold')
            .text('Art. 14 sexies: Debe notificarse a la APDP sin dilaciones indebidas.', MARGIN, doc.y, { width: W });
          doc.moveDown(1);
          dataTable(doc,
            ['Tipo', 'Severidad', 'Detectada', 'Causa'],
            criticalBreaches.map(b => [b.type || '-', b.severity || '-', b.detectedAt ? new Date(b.detectedAt).toLocaleDateString('es') : '-', (b.rootCause || '-').substring(0, 40)]),
            [W * 0.2, W * 0.15, W * 0.2, W * 0.35],
            criticalBreaches.map(() => [C.textBody, '#4a4a4a', C.textSecondary, C.textSecondary])
          );
        }

        if (criticalDpas.length > 0) {
          if (doc.y > PAGE_H - 120) doc.addPage();
          sectionTitle(doc, sectionNum++, `Acuerdos con encargados con riesgo (${criticalDpas.length})`);
          doc.fillColor(C.danger).fontSize(8).font('Helvetica-Bold')
            .text('Art. 27-29: Transferencias internacionales requieren países con nivel adecuado o cláusulas contractuales.', MARGIN, doc.y, { width: W });
          doc.moveDown(1);
          for (const dpa of criticalDpas.slice(0, 10)) {
            if (doc.y > PAGE_H - 60) doc.addPage();
            doc.fillColor(C.textBody).fontSize(8).font('Helvetica-Bold').text(dpa.processorName || '-', MARGIN, doc.y, { width: W });
            doc.fillColor(C.danger).fontSize(7.5).font('Helvetica')
              .text(`${dpa.status || '-'}${dpa.internationalTransfer ? ` · Transferencia a: ${dpa.transferCountry || '?'}` : ''}`, MARGIN + 8, doc.y, { width: W - 8 });
            doc.moveDown(0.6);
          }
        }
      }

      // ══════ RECOMENDACIONES ══════
      doc.addPage();
      pageHeader(doc, 'Recomendaciones y Plan de Acción');
      sectionTitle(doc, sectionNum++, 'Acciones Correctivas');

      const recs = [];
      if (!hasDpd) recs.push({ priority: 'ALTA', text: 'Designar un Delegado de Protección de Datos (DPD) según Art. 28. Este será el responsable de supervisar el cumplimiento continuo de la ley.', article: 'Art. 28' });
      if (!hasApdp) recs.push({ priority: 'ALTA', text: 'Inscribirse en el Registro Nacional de Sanciones y Cumplimiento de la APDP antes del 1 de diciembre de 2026.', article: 'Art. 31' });
      if (!hasPrivacyPolicy) recs.push({ priority: 'ALTA', text: 'Publicar una política de privacidad clara y accesible que incluya: identidad del responsable, finalidades, base de licitud, derechos del titular y mecanismo para ejercerlos.', article: 'Art. 14 ter' });
      if (!allConsentsActive) recs.push({ priority: 'ALTA', text: 'Implementar un sistema de gestión de consentimientos que registre el consentimiento libre, informado, específico, previo e inequívoco de cada titular.', article: 'Art. 12' });
      if (!hasInventory) recs.push({ priority: 'ALTA', text: 'Crear un Registro de Actividades de Tratamiento (RAT) documentando cada actividad: qué datos, para qué, base legal, destinatarios y plazos.', article: 'Art. 14' });
      if (!hasPseudo) recs.push({ priority: 'MEDIA', text: 'Implementar medidas de seudonimización o cifrado para datos personales según el nivel de riesgo.', article: 'Art. 14 quinquies' });
      if (!hasDpias && highRiskItems.length > 0) recs.push({ priority: 'ALTA', text: 'Realizar Evaluaciones de Impacto (DPIA) para tratamientos de alto riesgo, especialmente los que involucren datos sensibles.', article: 'Art. 14 quater' });
      if (!hasTrainings) recs.push({ priority: 'MEDIA', text: 'Implementar un programa de capacitación periódica en protección de datos para todo el personal que manipule datos personales.', article: 'Art. 28 c)' });
      if (!hasCookiesPolicy) recs.push({ priority: 'MEDIA', text: 'Publicar una política de cookies que informe claramente sobre el uso de tecnologías de rastreo.', article: 'Art. 14 ter' });
      if (!hasRetentionPolicy) recs.push({ priority: 'MEDIA', text: 'Definir y documentar una política de retención de datos que establezca plazos máximos de conservación para cada categoría.', article: 'Art. 14' });
      if (hasIntlTransferOk === false) recs.push({ priority: 'ALTA', text: 'Regularizar las transferencias internacionales de datos con cláusulas contractuales o verificación de nivel adecuado del país receptor.', article: 'Art. 27' });

      if (recs.length === 0) {
        recs.push({ priority: 'MEDIA', text: 'Mantener los controles actuales y realizar auditorías periódicas de cumplimiento al menos una vez al año.', article: 'Buenas prácticas' });
      }

      recs.forEach(rec => {
        if (doc.y > PAGE_H - 60) doc.addPage();
        const prioColor = rec.priority === 'ALTA' ? '#4a4a4a' : C.textSecondary;
        doc.fillColor(prioColor).fontSize(8).font('Helvetica-Bold')
          .text(`[${rec.priority}]`, MARGIN, doc.y, { width: 40 });
        doc.fillColor(C.textBody).fontSize(8.5).font('Helvetica')
          .text(rec.text, MARGIN + 42, doc.y - 9, { width: W - 52 });
        doc.fillColor(C.textSecondary).fontSize(7).font('Helvetica')
          .text(rec.article, MARGIN + 42, doc.y + 1, { width: W - 52 });
        doc.moveDown(1.5);
      });

      // ══════ MARCO LEGAL ══════
      const lawSections = [
        { title: 'Marco Legal - Ley 21.719', content: [
          'La Ley 21.719, publicada el 13 de diciembre de 2024, regula la protección y el tratamiento de los datos personales en Chile, creando la Agencia de Protección de Datos Personales (APDP). Vigente desde el 1 de diciembre de 2026.',
          'Principios rectores (Art. 3): Licitud y lealtad, finalidad, proporcionalidad, calidad, responsabilidad, seguridad, transparencia e información, y confidencialidad.',
          'Derechos del titular (Art. 4-9): Acceso, Rectificación, Supresión, Oposición, Portabilidad y Bloqueo temporal. Plazo de respuesta: 30 días corridos.',
          'Consentimiento (Art. 12): Libre, informado, específico, previo e inequívoco. Otras bases: obligación legal, ejecución de contrato, interés legítimo.',
          'Medidas de seguridad (Art. 14 quinquies): Cifrado, seudonimización, confidencialidad, integridad, disponibilidad y resiliencia.',
          'Brechas (Art. 14 sexies): Notificación a APDP sin dilaciones indebidas. A titulares cuando afecten datos sensibles, niños o económicos.',
          'DPD (Art. 28): Obligatorio para tratamiento a gran escala de datos sensibles.',
          'Sanciones: Leves hasta 5.000 UTM, graves hasta 10.000 UTM, gravísimas hasta 20.000 UTM (Art. 34 bis-34 quáter).',
        ]},
      ];

      for (const sec of lawSections) {
        doc.addPage();
        pageHeader(doc, 'Ley 21.719 - Protección de Datos Personales');
        sectionTitle(doc, sectionNum++, sec.title);
        doc.fillColor(C.textBody).fontSize(8.5).font('Helvetica');
        for (const line of sec.content) {
          if (doc.y > PAGE_H - 80) doc.addPage();
          if (line.startsWith('-') || line.startsWith('  -')) {
            doc.fillColor('#000000').fontSize(9).font('Helvetica').text(line, MARGIN, doc.y, { width: W - 10 });
          } else {
            doc.fillColor(C.textBody).fontSize(8.5).font('Helvetica').text(line, MARGIN, doc.y, { width: W });
          }
          doc.moveDown(0.6);
        }
      }

      // ══════ CIERRE ══════
      doc.addPage();
      pageHeader(doc, 'Cierre del Reporte');
      sectionTitle(doc, sectionNum++, 'Declaración');

      doc.fillColor(C.textBody).fontSize(9).font('Helvetica');
      doc.text(`El presente reporte ha sido generado electrónicamente por la plataforma de cumplimiento de la Ley 21.719 de Protección de Datos Personales. Refleja el estado de cumplimiento de ${companyName} al momento de su emisión.`, MARGIN, doc.y, { width: W });
      doc.moveDown(1);
      doc.text('Este documento tiene carácter de declaración de cumplimiento y debe ser revisado por el Delegado de Protección de Datos (DPD) o encargado designado. No sustituye una auditoría externa independiente.', MARGIN, doc.y, { width: W });
      doc.moveDown(1);
      doc.text(`Fecha de emisión: ${dateStr}`, MARGIN, doc.y, { width: W });
      doc.moveDown(0.5);
      doc.text(`Score de cumplimiento: ${passRate}%`, MARGIN, doc.y, { width: W });
      doc.moveDown(0.5);
      doc.text(`Requisitos evaluados: ${totalChecks} · Cumplidos: ${passedChecks} · Pendientes: ${totalChecks - passedChecks}`, MARGIN, doc.y, { width: W });

      // Closing
      if (doc.y > PAGE_H - 100) doc.addPage();
      doc.moveDown(2);
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + W, doc.y).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.moveDown(1);
      doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica')
        .text('Documento generado electrónicamente · Ley 21.719 · Protección de Datos Personales · Chile', MARGIN, doc.y, { width: W, align: 'center' });
      doc.fillColor(C.textMuted).fontSize(7.5).font('Helvetica')
        .text(`Fecha de emisión: ${dateStr} · Confidencial`, MARGIN, doc.y + 14, { width: W, align: 'center' });

      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const fileName = `reporte-${dateFile}-${Date.now()}.pdf`;
    const filePath = path.join(REPORTS_DIR, fileName);
    fs.writeFileSync(filePath, pdfBuffer);
    const fileSize = fs.statSync(filePath).size;

    const report = await ReportHistory.create({
      userId,
      title: reportTitle,
      type: 'compliance',
      filePath,
      fileSize,
      includeSections: ['summary', 'inventory', 'consents', 'breaches', 'checklist', 'recommendations'],
    });

    try {
      const adminSettings = await AdminSettings.findOne().lean();
      if (adminSettings?.enablePdfEmailNotification && adminSettings?.smtpHost) {
        const userData = await User.findById(userId).select('email companyName').lean();
        const recipientEmail = adminSettings.contactEmail || userData?.email;
        if (recipientEmail) {
          await sendReportEmail({
            smtp: {
              host: adminSettings.smtpHost,
              port: adminSettings.smtpPort,
              user: adminSettings.smtpUser,
              pass: adminSettings.smtpPassword,
              fromEmail: adminSettings.smtpFromEmail,
            },
            recipients: [recipientEmail],
            subject: adminSettings.pdfEmailSubject || 'SecureLab - Informe de Cumplimiento',
            body: adminSettings.pdfEmailBody || 'Adjunto encontrará el informe de cumplimiento normativo generado automáticamente.',
          }, pdfBuffer);
          console.log(`[REPORTS] Email sent to ${recipientEmail}`);
        } else {
          console.warn('[REPORTS] No recipient email found for report notification');
        }
      }
    } catch (emailErr) {
      console.error('[REPORTS] Email notification error:', emailErr.message);
    }

    res.json({ success: true, report: { _id: report._id, title: report.title, createdAt: report.createdAt, fileSize, format: 'pdf' } });
  } catch (err) {
    console.error('[REPORT ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/training
router.post('/training', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.UserID;
    const trainings = await TrainingRecord.find({ userId }).sort({ date: -1 }).lean();

    const config = await ComplianceConfig.findOne({ userId }).lean();
    const companyName = config?.companyName || req.user.email || 'Empresa';
    const dpdName = config?.dpdName || 'No designado';
    const dateStr = new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const dateFile = new Date().toISOString().split('T')[0];

    const completedCount = trainings.filter(t => t.completed).length;
    const signedCount = trainings.filter(t => t.signatureData).length;
    const pendingCount = trainings.length - completedCount;
    const pctCompletion = trainings.length > 0 ? Math.round(signedCount / trainings.length * 100) : 0;

    const topicLabels = {
      proteccion_datos: 'Protección de Datos Personales (Ley 21.719)',
      ciberseguridad: 'Ciberseguridad',
      brechas: 'Protocolo de Brechas (Art. 26)',
      arco: 'Derechos ARCO',
      consentimientos: 'Gestión de Consentimientos',
      general: 'General',
    };

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 30, bottom: 50, left: MARGIN, right: MARGIN },
      info: { Title: 'Reporte de Capacitaciones - Ley 21.719', Author: 'Plataforma de Cumplimiento' },
    });

    let pageNum = 0;
    doc.on('pageAdded', () => {
      pageNum++;
      if (pageNum === 1) return;
      doc.page.margins.left = MARGIN;
      const fy = doc.page.height - 30;
      doc.rect(0, fy, doc.page.width, 30).fill('#f5f5f5');
      doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(0, fy).lineTo(doc.page.width, fy).stroke();
      doc.fillColor('#999999').fontSize(7).font('Helvetica');
      const saveBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.text('Ley 21.719 · Reporte de Capacitaciones', MARGIN, fy + 8, { lineBreak: false });
      doc.text(`Página ${pageNum - 1}`, MARGIN, fy + 16, { lineBreak: false, align: 'right' });
      doc.page.margins.bottom = saveBottom;
      // Electronic document stamp (Ley 21.719)
      if (pageNum > 1) {
        doc.fontSize(6).font('Helvetica').fillColor('#cccccc');
        doc.text('Documento generado electrónicamente · Sin firma criptográfica · Ley 21.719', MARGIN, fy + 22, { lineBreak: false });
      }
      doc.y = 60;
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);

      coverPage(doc, 'Reporte de Capacitaciones', companyName, dateStr);

      // --- Executive Summary ---
      doc.addPage();
      pageHeader(doc, 'Resumen Ejecutivo');
      sectionTitle(doc, 1, 'Resumen General del Programa de Capacitación');

      kpiSummary(doc, [
        { label: 'Total de Capacitaciones Registradas', value: trainings.length },
        { label: 'Completadas con Firma Digital', value: signedCount },
        { label: 'Completadas sin Firma', value: completedCount - signedCount },
        { label: 'Pendientes', value: pendingCount },
        { label: '% de Cumplimiento (Firmadas)', value: `${pctCompletion}%` },
      ]);

      doc.fillColor(C.textBody).fontSize(9).font('Helvetica');
      const summaryText = trainings.length > 0
        ? `Se han registrado un total de ${trainings.length} capacitaciones en el marco del programa de formación en protección de datos personales. De estas, ${signedCount} cuentan con firma digital como constancia de recepción y comprensión por parte de los colaboradores (${pctCompletion}% de cumplimiento documental).`
        : 'A la fecha de emisión de este reporte, no se han registrado capacitaciones en el sistema. Se recomienda iniciar el programa de formación en protección de datos personales conforme al Art. 28 letra c) de la Ley 21.719.';
      if (doc.y > PAGE_H - 60) doc.addPage();
      doc.text(summaryText, MARGIN, doc.y, { width: W });
      doc.moveDown(2);

      // --- Detailed Records ---
      if (trainings.length > 0) {
        sectionTitle(doc, 2, `Detalle de Capacitaciones (${trainings.length})`);

        // Draw each training as a card-like entry
        trainings.slice(0, 100).forEach((t, i) => {
          if (doc.y > PAGE_H - 80) doc.addPage();

          const statusText = t.signatureData ? 'FIRMADO' : t.completed ? 'COMPLETADO' : 'PENDIENTE';
          const statusColor = t.signatureData ? '#000000' : t.completed ? '#666666' : '#999999';

          // Training entry background
          rect(doc, MARGIN, doc.y, W, i % 2 === 0 ? 38 : 38, i % 2 === 0 ? '#f8f9fa' : '#ffffff');
          doc.rect(MARGIN, doc.y, W, 38).strokeColor('#e0e0e0').lineWidth(0.5).stroke();

          // Left accent bar
          rect(doc, MARGIN, doc.y, 3, 38, '#000000');

          // Employee name
          doc.fillColor(C.textBody).fontSize(9).font('Helvetica-Bold')
            .text(t.employeeName || '-', MARGIN + 12, doc.y + 4, { width: W * 0.25 });

          // Topic
          doc.fillColor(C.textSecondary).fontSize(7.5).font('Helvetica')
            .text(topicLabels[t.topic] || t.topic || '-', MARGIN + 12, doc.y + 18, { width: W * 0.3 });

          // Date
          doc.fillColor(C.textSecondary).fontSize(7.5).font('Helvetica')
            .text(t.date ? new Date(t.date).toLocaleDateString('es') : '-', MARGIN + W * 0.55, doc.y + 4, { width: W * 0.15 });

          // Status badge
          doc.fillColor(statusColor).fontSize(7).font('Helvetica-Bold')
            .text(statusText, MARGIN + W * 0.55, doc.y + 18, { width: W * 0.15 });

          // Signature image
          if (t.signatureData) {
            const b64 = t.signatureData.replace(/^data:image\/\w+;base64,\s*/, '');
            const buf = Buffer.from(b64, 'base64');
            if (buf.length > 100 && buf[0] === 0x89 && buf[1] === 0x50) {
              doc.image(buf, MARGIN + W * 0.72, doc.y + 2, { width: 120, height: 36 });
              if (t.signedAt) {
                doc.fillColor(C.textMuted).fontSize(5.5).font('Helvetica')
                  .text(new Date(t.signedAt).toLocaleString('es'), MARGIN + W * 0.72, doc.y + 38, { width: 120 });
              }
            }
          }

          doc.y += 40;
        });
      }

      // --- Legal Framework ---
      sectionTitle(doc, 3, 'Marco Legal - Ley 21.719');

      doc.fillColor(C.textBody).fontSize(8.5).font('Helvetica');
      const legalLines = [
        { bold: 'Art. 28 letra c) - Programa de Capacitación', body: 'El responsable del tratamiento debe implementar programas de capacitación periódica en protección de datos personales para todo el personal que participe en operaciones de tratamiento. Estos programas deben asegurar que los colaboradores conozcan y apliquen correctamente los principios y obligaciones establecidos en la ley.' },
        { bold: 'Contenido Mínimo de la Capacitación', body: 'Principios rectores, derechos ARCO, gestión de consentimientos, protocolo de brechas (Art. 26), medidas de seguridad (Art. 25), y deber de confidencialidad y secreto profesional.' },
        { bold: 'Registro y Evidencia', body: 'Se debe mantener un registro de cada capacitación que incluya: identificación del colaborador, tema impartido, fecha de realización, y firma digital como constancia de recepción y comprensión. Los registros forman parte de la evidencia de cumplimiento normativo exigible por la APDP.' },
      ];
      legalLines.forEach(sec => {
        if (doc.y > PAGE_H - 80) doc.addPage();
        doc.fillColor(C.textBody).fontSize(9).font('Helvetica-Bold').text(sec.bold, MARGIN, doc.y, { width: W });
        doc.moveDown(0.4);
        doc.fillColor(C.textBody).fontSize(8).font('Helvetica').text(sec.body, MARGIN, doc.y, { width: W });
        doc.moveDown(1);
      });

      // --- Conclusions ---
      sectionTitle(doc, 4, 'Conclusiones y Recomendaciones');

      const recs = [];
      if (trainings.length === 0) {
        recs.push('No se han registrado capacitaciones. Es fundamental implementar un programa de formación en protección de datos personales para dar cumplimiento al Art. 28 letra c).');
      } else {
        if (signedCount < trainings.length) {
          recs.push(`${trainings.length - signedCount} capacitación(es) no cuentan con firma digital. Se recomienda obtener la firma de los colaboradores como respaldo documental.`);
        }
        recs.push('Mantener un registro actualizado y ordenado de todas las capacitaciones realizadas, incluyendo firmas digitales como evidencia.');
      }
      recs.push('Realizar capacitaciones de actualización al menos una vez al año y ante modificaciones relevantes en la normativa.');
      recs.push(dpdName !== 'No designado'
        ? `El DPD, ${dpdName}, es responsable de supervisar y coordinar el programa de capacitación continua.`
        : 'Se recomienda designar un Delegado de Protección de Datos (DPD) para supervisar el programa de capacitación.');

      recs.forEach((r, i) => {
        if (doc.y > PAGE_H - 80) doc.addPage();
        doc.fillColor('#000000').fontSize(8).font('Helvetica').text('>', MARGIN, doc.y, { width: 8 });
        doc.fillColor(C.textBody).fontSize(8.5).font('Helvetica').text(r, MARGIN + 12, doc.y - 1, { width: W - 16 });
        doc.moveDown(1.2);
      });

      // Closing
      if (doc.y > PAGE_H - 40) doc.addPage();
      doc.moveDown(1);
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + W, doc.y).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.moveDown(0.8);
      doc.fillColor(C.textSecondary).fontSize(7).font('Helvetica')
        .text('Documento generado electrónicamente · Ley 21.719 · Protección de Datos Personales · Chile', MARGIN, doc.y, { width: W, align: 'center' });
      doc.fillColor(C.textMuted).fontSize(6.5).font('Helvetica')
        .text(`Fecha de emisión: ${dateStr} · Confidencial`, MARGIN, doc.y + 12, { width: W, align: 'center' });

      // Final electronic stamp
      if (doc.y > PAGE_H - 80) doc.addPage();
      doc.moveDown(3);
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + W, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.moveDown(1);
      doc.fillColor('#999999').fontSize(7).font('Helvetica')
        .text('Sello de Documento Electrónico', MARGIN, doc.y, { width: W, align: 'center' });
      doc.fillColor('#999999').fontSize(6.5).font('Helvetica')
        .text(`Fecha: ${new Date().toLocaleString('es-CL')} · Sin firma criptográfica`, MARGIN, doc.y + 2, { width: W, align: 'center' });

      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const fileName = `capacitaciones-${dateFile}-${Date.now()}.pdf`;
    const filePath = path.join(REPORTS_DIR, fileName);
    fs.writeFileSync(filePath, pdfBuffer);
    const fileSize = fs.statSync(filePath).size;

    const report = await ReportHistory.create({
      userId,
      title: `Reporte de Capacitaciones - ${dateFile}`,
      type: 'training',
      filePath,
      fileSize,
      includeSections: ['training'],
    });

    res.json({ success: true, report: { _id: report._id, title: report.title, createdAt: report.createdAt, fileSize, format: 'pdf' } });
  } catch (err) {
    console.error('[TRAINING REPORT ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/download/:id
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const report = await ReportHistory.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!report) return res.status(404).json({ error: 'reporte no encontrado' });
    if (!fs.existsSync(report.filePath)) return res.status(404).json({ error: 'archivo no encontrado' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${report.title.replace(/[^a-zA-Z0-9\-_ ]/g, '')}.pdf"`);
    res.sendFile(report.filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/download-all
router.get('/download-all', authMiddleware, async (req, res) => {
  try {
    const reports = await ReportHistory.find({ userId: req.user.UserID }).sort({ createdAt: -1 }).lean();
    if (reports.length === 0) return res.status(404).json({ error: 'no hay reportes' });

    const outFile = path.join(REPORTS_DIR, `consolidado-${Date.now()}.pdf`);

    const doc = new PDFDocument({
      size: 'A4',
      bufferPages: true,
      margins: { top: 30, bottom: 50, left: MARGIN, right: MARGIN },
      info: { Title: 'Reportes Consolidados', Author: 'Plataforma de Cumplimiento - Ley 21.719' },
    });

    const writeStream = fs.createWriteStream(outFile);
    doc.pipe(writeStream);

    coverPage(doc, 'Reportes Consolidados', req.user.email || 'Empresa',
      new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }));

    doc.addPage();
    pageHeader(doc, 'Índice de Reportes');
    sectionTitle(doc, 1, `Total: ${reports.length} reporte(s) generados`);

    for (const r of reports) {
      if (doc.y > PAGE_H - 80) doc.addPage();
      if (fs.existsSync(r.filePath)) {
        doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
          .text('- ' + r.title, MARGIN, doc.y, { width: W });
        doc.fillColor(C.textSecondary).fontSize(8).font('Helvetica')
          .text(`   ${new Date(r.createdAt).toLocaleDateString('es')} · ${(r.fileSize / 1024).toFixed(1)} KB`, MARGIN, doc.y + 2, { width: W });
        doc.moveDown(2.5);
      }
    }

    pageFooter(doc);
    doc.end();

    await new Promise(resolve => writeStream.on('finish', resolve));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="reportes-consolidados.pdf"');
    res.sendFile(outFile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

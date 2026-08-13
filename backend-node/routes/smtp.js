import { Router } from 'express';
import nodemailer from 'nodemailer';
import { AdminSettings } from '../models/db.js';
import { CONFIG } from '../config.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const LOGO_URL = `${CONFIG.API_BASE_URL || 'http://196.251.121.98:3838'}/logo-nuevo.png`;

let transporter = null;
const otpStore = new Map();

export function initSMTP(host, port, user, pass, from) {
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465,
    auth: { user, pass },
  });
}

router.post('/configure', authMiddleware, async (req, res) => {
  try {
    const { host, port, username, password, from } = req.body;
    if (!host || !port) return res.json({ error: 'SMTP host and port required' });

    initSMTP(host, port, username, password, from || 'noreply@domain-scanner.com');
    await AdminSettings.updateOne({}, { smtpHost: host, smtpPort: port, smtpUser: username, smtpPassword: password });
    res.json({ success: true, message: 'SMTP configured successfully' });
  } catch (err) {
    console.error('[SMTP] Error configuring SMTP:', err.message);
    res.status(500).json({ error: 'Error al configurar SMTP' });
  }
});

router.post('/sendOTP', (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!transporter) return res.json({ error: 'SMTP not configured' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { code, email, purpose, expiresAt: new Date(Date.now() + CONFIG.OTP_EXPIRY_MINUTES * 60000) });

    transporter.sendMail({
      from: `"SecureLab - Cumplimiento" <${CONFIG.SMTP_FROM || 'noreply@securelab.cl'}>`,
      to: email,
      subject: purpose === 'login' ? '[SecureLab] C\u00f3digo de Inicio de Sesi\u00f3n' : '[SecureLab] C\u00f3digo de Verificaci\u00f3n',
      html: `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6f9;"><tr><td align="center" style="padding:40px 16px;"><table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);"><tr><td style="padding:32px 40px 24px;border-bottom:1px solid #e8ecf1;text-align:center;"><img src="${LOGO_URL}" alt="SecureLab" width="48" height="48" style="display:inline-block;border-radius:8px;margin-bottom:12px;" /><div style="font-size:18px;font-weight:700;color:#1a2332;letter-spacing:1.5px;text-transform:uppercase;">SecureLab</div><div style="font-size:11px;color:#7b8794;margin-top:4px;">Cumplimiento Normativo &amp; Protecci&oacute;n de Datos</div></td></tr><tr><td style="padding:0;"><div style="height:3px;background:#1a73e8;"></div></td></tr><tr><td style="padding:32px 40px;"><div style="margin-bottom:24px;"><h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1a2332;">C\u00f3digo de Verificaci\u00f3n</h1><p style="margin:0;font-size:13px;color:#7b8794;">V\u00e1lido por ${CONFIG.OTP_EXPIRY_MINUTES} minutos</p></div><div style="text-align:center;margin:28px 0;padding:24px;background:#f4f6f9;border-radius:4px;"><div style="font-size:36px;font-weight:800;color:#1a2332;letter-spacing:8px;font-family:'Courier New',monospace;">${code}</div></div><p style="margin:0;font-size:13px;color:#7b8794;text-align:center;">Si no solicitaste este c\u00f3digo, ignora este correo.</p></td></tr><tr><td style="padding:24px 40px;border-top:1px solid #e8ecf1;background:#fafbfc;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="font-size:11px;color:#9aa5b1;line-height:1.5;"><strong style="color:#5a6570;">SecureLab</strong> &middot; Plataforma de Cumplimiento Normativo<br/>Correo generado autom&aacute;ticamente.</td><td style="text-align:right;vertical-align:bottom;"><img src="${LOGO_URL}" alt="" width="28" height="28" style="opacity:0.3;border-radius:4px;" /></td></tr></table></td></tr></table></td></tr></table></body></html>`,
    }, (err) => {
      if (err) return res.json({ error: 'Error al enviar email: ' + err.message });
      res.json({ message: 'OTP sent successfully' });
    });
  } catch (err) {
    console.error('[SMTP] Error sending OTP:', err.message);
    res.status(500).json({ error: 'Error al enviar OTP' });
  }
});

router.post('/testEmail', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ error: 'Email requerido' });

    const settings = await AdminSettings.findOne().lean();
    if (!settings?.smtpHost) return res.json({ error: 'SMTP no está configurado' });

    const testTransporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort) || 587,
      secure: parseInt(settings.smtpPort) === 465,
      auth: settings.smtpUser ? { user: settings.smtpUser, pass: settings.smtpPassword } : undefined,
    });

    await testTransporter.sendMail({
      from: `"SecureLab - Cumplimiento" <${settings.smtpFromEmail || settings.smtpUser || 'noreply@securelab.cl'}>`,
      to: email,
      subject: '[SecureLab] Verificaci\u00f3n de Conexi\u00f3n SMTP',
      html: `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6f9;"><tr><td align="center" style="padding:40px 16px;"><table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);"><tr><td style="padding:32px 40px 24px;border-bottom:1px solid #e8ecf1;text-align:center;"><img src="${LOGO_URL}" alt="SecureLab" width="48" height="48" style="display:inline-block;border-radius:8px;margin-bottom:12px;" /><div style="font-size:18px;font-weight:700;color:#1a2332;letter-spacing:1.5px;text-transform:uppercase;">SecureLab</div><div style="font-size:11px;color:#7b8794;margin-top:4px;">Cumplimiento Normativo &amp; Protecci&oacute;n de Datos</div></td></tr><tr><td style="padding:0;"><div style="height:3px;background:#27ae60;"></div></td></tr><tr><td style="padding:32px 40px;"><div style="margin-bottom:24px;"><h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1a2332;">Conexi\u00f3n SMTP Verificada</h1><p style="margin:0;font-size:13px;color:#7b8794;">Prueba de env\u00edo exitosa</p></div><p style="margin:0 0 20px;font-size:14px;color:#3d4f5f;line-height:1.6;">El servicio de correo electr\u00f3nico ha sido configurado correctamente. Los correos del sistema se enviar\u00e1n a trav\u00e9s de este servidor SMTP.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e8ecf1;border-radius:4px;"><tr style="background:#f4f6f9;"><td style="padding:10px 16px;font-size:12px;font-weight:600;color:#5a6570;">Par\u00e1metro</td><td style="padding:10px 16px;font-size:12px;font-weight:600;color:#5a6570;text-align:right;">Estado</td></tr><tr><td style="padding:10px 16px;font-size:13px;color:#3d4f5f;border-top:1px solid #e8ecf1;">Servidor SMTP</td><td style="padding:10px 16px;font-size:13px;color:#27ae60;font-weight:600;border-top:1px solid #e8ecf1;text-align:right;">Operativo</td></tr><tr><td style="padding:10px 16px;font-size:13px;color:#3d4f5f;border-top:1px solid #e8ecf1;">Fecha</td><td style="padding:10px 16px;font-size:13px;color:#1a2332;font-weight:600;border-top:1px solid #e8ecf1;text-align:right;">${new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</td></tr></table></td></tr><tr><td style="padding:24px 40px;border-top:1px solid #e8ecf1;background:#fafbfc;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="font-size:11px;color:#9aa5b1;line-height:1.5;"><strong style="color:#5a6570;">SecureLab</strong> &middot; Plataforma de Cumplimiento Normativo<br/>Correo de verificaci\u00f3n autom&aacute;tica.</td><td style="text-align:right;vertical-align:bottom;"><img src="${LOGO_URL}" alt="" width="28" height="28" style="opacity:0.3;border-radius:4px;" /></td></tr></table></td></tr></table></td></tr></table></body></html>`,
    });

    console.log(`[SMTP] Test email sent to ${email}`);
    res.json({ success: true, message: 'Email de prueba enviado' });
  } catch (err) {
    console.error('[SMTP] Test email error:', err.message);
    res.status(500).json({ error: 'Error al enviar email de prueba: ' + err.message });
  }
});

router.post('/verifyOTP', (req, res) => {
  try {
    const { email, code, purpose } = req.body;
    const data = otpStore.get(email);
    if (!data) return res.json({ error: 'OTP not found or expired' });
    if (new Date() > data.expiresAt) { otpStore.delete(email); return res.json({ error: 'OTP expired' }); }
    if (data.code !== code) return res.json({ error: 'invalid OTP' });
    otpStore.delete(email);
    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('[SMTP] Error verifying OTP:', err.message);
    res.status(500).json({ error: 'Error al verificar OTP' });
  }
});

router.post('/adminSettings', authMiddleware, async (req, res) => {
  try {
    const settings = await AdminSettings.findOne().lean();
    if (!settings) return res.json({});
    res.json({
      contactPhone: settings.contactPhone || '',
      contactEmail: settings.contactEmail || '',
      smtpHost: settings.smtpHost || '',
      smtpPort: settings.smtpPort || '',
      smtpUser: settings.smtpUser || '',
      smtpPassword: settings.smtpPassword || '',
      smtpFromEmail: settings.smtpFromEmail || '',
      enablePdfEmailNotification: !!settings.enablePdfEmailNotification,
      enableTicketNotification: !!settings.enableTicketNotification,
      pdfEmailSubject: settings.pdfEmailSubject || '',
      pdfEmailBody: settings.pdfEmailBody || '',
    });
  } catch (err) {
    console.error('[SMTP] Error fetching admin settings:', err.message);
    res.status(500).json({ error: 'Error al obtener configuración admin' });
  }
});

router.post('/saveAdminSettings', authMiddleware, async (req, res) => {
  try {
    const { contactPhone, contactEmail, smtpHost, smtpPort, smtpUser, smtpPassword, smtpFromEmail, enablePdfEmailNotification, enableTicketNotification, pdfEmailSubject, pdfEmailBody } = req.body;

    await AdminSettings.updateOne({}, {
      contactPhone: contactPhone || '',
      contactEmail: contactEmail || '',
      smtpHost: smtpHost || '',
      smtpPort: smtpPort || '',
      smtpUser: smtpUser || '',
      smtpPassword: smtpPassword || '',
      smtpFromEmail: smtpFromEmail || '',
      enablePdfEmailNotification: enablePdfEmailNotification ? true : false,
      enableTicketNotification: enableTicketNotification ? true : false,
      pdfEmailSubject: pdfEmailSubject || '',
      pdfEmailBody: pdfEmailBody || '',
    });

    if (smtpHost && smtpPort) {
      initSMTP(smtpHost, smtpPort, smtpUser || '', smtpPassword || '', 'noreply@domain-scanner.com');
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[SMTP] Error saving admin settings:', err.message);
    res.status(500).json({ error: 'Error al guardar configuración admin' });
  }
});

export default router;

const bulkJobs = new Map();

router.post('/bulkSend', authMiddleware, async (req, res) => {
  try {
    const { subject, html, contacts: rawContacts } = req.body;

    let contacts;
    if (typeof rawContacts === 'string') {
      try { contacts = JSON.parse(rawContacts); } catch { contacts = null; }
    } else {
      contacts = rawContacts;
    }

    if (!subject || !html || !Array.isArray(contacts) || !contacts.length) {
      return res.json({ error: 'Faltan campos: subject, html o contacts' });
    }

    const settings = await AdminSettings.findOne().lean();
    if (!settings?.smtpHost) return res.json({ error: 'SMTP no está configurado' });

    const bulkTransporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort) || 587,
      secure: parseInt(settings.smtpPort) === 465,
      auth: settings.smtpUser ? { user: settings.smtpUser, pass: settings.smtpPassword } : undefined,
    });

    const jobId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const job = { total: contacts.length, sent: 0, failed: 0, results: [], complete: false };
    bulkJobs.set(jobId, job);

    res.json({ success: true, jobId, total: contacts.length });

    const fromAddr = `"SecureLab - Cumplimiento" <${settings.smtpFromEmail || settings.smtpUser || 'noreply@securelab.cl'}>`;

    const wrappedHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6f9;"><tr><td align="center" style="padding:40px 16px;"><table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);"><tr><td style="padding:32px 40px 24px;border-bottom:1px solid #e8ecf1;text-align:center;"><img src="${LOGO_URL}" alt="SecureLab" width="48" height="48" style="display:inline-block;border-radius:8px;margin-bottom:12px;" /><div style="font-size:18px;font-weight:700;color:#1a2332;letter-spacing:1.5px;text-transform:uppercase;">SecureLab</div><div style="font-size:11px;color:#7b8794;margin-top:4px;letter-spacing:0.5px;">Cumplimiento Normativo &amp; Protecci&oacute;n de Datos</div></td></tr><tr><td style="padding:0;"><div style="height:3px;background:#1a73e8;"></div></td></tr><tr><td style="padding:32px 40px;">{{CONTENT}}</td></tr><tr><td style="padding:24px 40px;border-top:1px solid #e8ecf1;background:#fafbfc;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="font-size:11px;color:#9aa5b1;line-height:1.5;"><strong style="color:#5a6570;">SecureLab</strong> &middot; Plataforma de Cumplimiento Normativo<br/>Este es un correo generado autom&aacute;ticamente. Por favor no respondas directamente.</td><td style="text-align:right;vertical-align:bottom;"><img src="${LOGO_URL}" alt="" width="28" height="28" style="opacity:0.3;border-radius:4px;" /></td></tr></table></td></tr></table></td></tr></table></body></html>`;

    (async () => {
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const email = typeof contact === 'string' ? contact : contact.email;
        if (!email || !email.includes('@')) {
          job.results.push({ email: email || `fila-${i+1}`, status: 'error', error: 'Email inválido' });
          job.failed++;
          continue;
        }
        try {
          const name = contact.name || email.split('@')[0];
          const personalizedHtml = html.replace(/\{\{email\}\}/g, email).replace(/\{\{nombre\}\}/g, name);
          const finalHtml = wrappedHtml.replace('{{CONTENT}}', personalizedHtml);
          await bulkTransporter.sendMail({
            from: fromAddr,
            to: email,
            subject: subject.replace(/\{\{email\}\}/g, email).replace(/\{\{nombre\}\}/g, name),
            html: finalHtml,
            headers: { 'List-Unsubscribe': `<mailto:${settings.smtpFromEmail || settings.smtpUser}?subject=unsubscribe>` },
          });
          job.results.push({ email, status: 'sent' });
          job.sent++;
          console.log(`[BULK] (${job.sent + job.failed}/${job.total}) Sent to ${email}`);
        } catch (err) {
          job.results.push({ email, status: 'error', error: err.message });
          job.failed++;
          console.error(`[BULK] (${job.sent + job.failed}/${job.total}) Failed to ${email}: ${err.message}`);
        }
      }
      job.complete = true;
      console.log(`[BULK] Job ${jobId} complete: ${job.sent}/${job.total} sent, ${job.failed} failed`);
      setTimeout(() => bulkJobs.delete(jobId), 600000);
    })();
  } catch (err) {
    console.error('[BULK] Error:', err.message);
    if (!res.headersSent) return res.status(500).json({ error: err.message });
  }
});

router.get('/bulkStatus/:jobId', authMiddleware, (req, res) => {
  const job = bulkJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  res.json({ total: job.total, sent: job.sent, failed: job.failed, complete: job.complete, results: job.results });
});

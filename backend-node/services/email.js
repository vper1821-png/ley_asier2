import nodemailer from 'nodemailer';
import { CONFIG } from '../config.js';

let transporter = null;
const LOGO_URL = `${CONFIG.API_BASE_URL || 'http://196.251.121.98:3838'}/logo-nuevo.png`;

function getTransporter(smtpConfig) {
  if (transporter && !smtpConfig) return transporter;
  if (!smtpConfig || !smtpConfig.host) return null;
  transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port) || 587,
    secure: !!smtpConfig.secure,
    auth: smtpConfig.user ? { user: smtpConfig.user, pass: smtpConfig.pass } : undefined,
  });
  return transporter;
}

function emailWrapper(headerLabel, headerColor, content) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6f9;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <!-- Logo Header -->
      <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #e8ecf1;text-align:center;">
        <img src="${LOGO_URL}" alt="SecureLab" width="48" height="48" style="display:inline-block;border-radius:8px;margin-bottom:12px;" />
        <div style="font-size:18px;font-weight:700;color:#1a2332;letter-spacing:1.5px;text-transform:uppercase;">SecureLab</div>
        <div style="font-size:11px;color:#7b8794;margin-top:4px;letter-spacing:0.5px;">Cumplimiento Normativo &amp; Protecci&oacute;n de Datos</div>
      </td></tr>

      <!-- Status Bar -->
      <tr><td style="padding:0;">
        <div style="height:3px;background:${headerColor};"></div>
      </td></tr>

      <!-- Content -->
      <tr><td style="padding:32px 40px;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 40px;border-top:1px solid #e8ecf1;background:#fafbfc;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-size:11px;color:#9aa5b1;line-height:1.5;">
              <strong style="color:#5a6570;">SecureLab</strong> &middot; Plataforma de Cumplimiento Normativo<br/>
              Este es un correo generado autom&aacute;ticamente. Por favor no respondas directamente.
            </td>
            <td style="text-align:right;vertical-align:bottom;">
              <img src="${LOGO_URL}" alt="" width="28" height="28" style="opacity:0.3;border-radius:4px;" />
            </td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function sendReportEmail(config, pdfBuffer) {
  if (!config.smtp?.host || !config.recipients?.length) {
    throw new Error('SMTP not configured or no recipients');
  }

  const transport = getTransporter(config.smtp);
  if (!transport) throw new Error('Failed to create email transporter');

  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const html = emailWrapper('Reporte', '#1a73e8', `
    <div style="margin-bottom:24px;">
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1a2332;">Informe de Cumplimiento</h1>
      <p style="margin:0;font-size:13px;color:#7b8794;">Generado el ${dateStr}</p>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#3d4f5f;line-height:1.6;">
      Se ha generado exitosamente el informe de cumplimiento normativo de su organizaci&oacute;n.
      El documento PDF se encuentra adjunto a este correo para su revisi&oacute;n y descarga.
    </p>
    ${config.body ? `<div style="margin:20px 0;padding:16px;background:#f4f6f9;border-left:3px solid #1a73e8;border-radius:0 4px 4px 0;">
      <p style="margin:0;font-size:13px;color:#3d4f5f;line-height:1.6;">${config.body.replace(/\n/g, '<br>')}</p>
    </div>` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e8ecf1;border-radius:4px;overflow:hidden;">
      <tr style="background:#f4f6f9;">
        <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#5a6570;">Detalle</td>
        <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#5a6570;text-align:right;">Valor</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#3d4f5f;border-top:1px solid #e8ecf1;">Fecha de emisi&oacute;n</td>
        <td style="padding:10px 16px;font-size:13px;color:#1a2332;font-weight:600;border-top:1px solid #e8ecf1;text-align:right;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#3d4f5f;border-top:1px solid #e8ecf1;">Formato</td>
        <td style="padding:10px 16px;font-size:13px;color:#1a2332;font-weight:600;border-top:1px solid #e8ecf1;text-align:right;">PDF</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#3d4f5f;border-top:1px solid #e8ecf1;">Clasificaci&oacute;n</td>
        <td style="padding:10px 16px;font-size:13px;color:#c0392b;font-weight:600;border-top:1px solid #e8ecf1;text-align:right;">CONFIDENCIAL</td>
      </tr>
    </table>
    <div style="text-align:center;margin:28px 0 8px;">
      <div style="display:inline-block;background:#1a73e8;color:#fff;padding:11px 28px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none;">Documento adjunto en este correo</div>
    </div>
  `);

  const mailOptions = {
    from: `"SecureLab - Cumplimiento" <${config.smtp.fromEmail || config.smtp.user}>`,
    to: config.recipients.join(', '),
    subject: (config.subject || 'SecureLab - Informe de Cumplimiento Normativo').replace('{date}', dateStr),
    html,
    attachments: [{
      filename: `securelab-informe-${new Date().toISOString().split('T')[0]}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  };

  return transport.sendMail(mailOptions);
}

export async function sendAlertEmail(smtpConfig, alert, recipientEmails) {
  if (!smtpConfig?.host || !recipientEmails?.length) return;

  const transport = getTransporter(smtpConfig);
  if (!transport) return;

  const severityColors = { critical: '#c0392b', high: '#d35400', medium: '#f39c12', low: '#27ae60' };
  const severityLabels = { critical: 'CR&Iacute;TICA', high: 'ALTA', medium: 'MEDIA', low: 'BAJA' };
  const color = severityColors[alert.severity] || '#d35400';
  const label = severityLabels[alert.severity] || 'INDEFINIDA';

  const html = emailWrapper('Alerta de Seguridad', color, `
    <div style="margin-bottom:24px;">
      <div style="display:inline-block;padding:4px 10px;background:${color};color:#fff;font-size:11px;font-weight:700;border-radius:3px;letter-spacing:0.5px;margin-bottom:12px;">ALERTA ${label}</div>
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1a2332;">${alert.title}</h1>
      <p style="margin:0;font-size:13px;color:#7b8794;">${new Date(alert.createdAt).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</p>
    </div>
    <div style="padding:16px;background:#f4f6f9;border-radius:4px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#3d4f5f;line-height:1.6;">${alert.description || 'Sin descripci&oacute;n adicional.'}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;border:1px solid #e8ecf1;border-radius:4px;">
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:#7b8794;border-right:1px solid #e8ecf1;width:50%;">Fuente</td>
        <td style="padding:10px 16px;font-size:13px;color:#1a2332;font-weight:600;">${alert.source || 'Desconocida'}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:#7b8794;border-right:1px solid #e8ecf1;border-top:1px solid #e8ecf1;">Acci&oacute;n recomendada</td>
        <td style="padding:10px 16px;font-size:13px;color:#1a2332;font-weight:600;border-top:1px solid #e8ecf1;">${alert.action || 'Pendiente de revisi&oacute;n'}</td>
      </tr>
    </table>
  `);

  const mailOptions = {
    from: `"SecureLab - Alertas" <${smtpConfig.fromEmail || smtpConfig.user}>`,
    to: recipientEmails.join(', '),
    subject: `[Alerta ${label}] ${alert.title}`,
    html,
  };

  return transport.sendMail(mailOptions);
}

export async function sendNotificationEmail(smtpConfig, notification, recipientEmails) {
  if (!smtpConfig?.smtpHost || !recipientEmails?.length) {
    console.error('[Email] sendNotificationEmail skipped: no smtpHost or no recipients', { smtpHost: smtpConfig?.smtpHost, recipientCount: recipientEmails?.length });
    return;
  }

  const transport = nodemailer.createTransport({
    host: smtpConfig.smtpHost,
    port: parseInt(smtpConfig.smtpPort) || 587,
    secure: parseInt(smtpConfig.smtpPort) === 465,
    auth: smtpConfig.smtpUser ? { user: smtpConfig.smtpUser, pass: smtpConfig.smtpPassword } : undefined,
  });

  const severityColor = notification.severity === 'high' || notification.severity === 'critical' ? '#c0392b'
    : notification.severity === 'warning' ? '#d35400' : '#1a73e8';

  const html = emailWrapper('Notificaci\u00f3n', severityColor, `
    <div style="margin-bottom:24px;">
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1a2332;">${notification.title}</h1>
      <p style="margin:0;font-size:13px;color:#7b8794;">Notificaci\u00f3n del sistema de monitoreo</p>
    </div>
    <div style="padding:16px;background:#f4f6f9;border-left:3px solid ${severityColor};border-radius:0 4px 4px 0;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#3d4f5f;line-height:1.6;white-space:pre-wrap;">${notification.message}</p>
    </div>
  `);

  const mailOptions = {
    from: `"SecureLab - Notificaciones" <${smtpConfig.smtpFromEmail || smtpConfig.smtpUser || 'noreply@securelab.cl'}>`,
    to: recipientEmails.join(', '),
    subject: `[SecureLab] ${notification.title}`,
    html,
  };

  try {
    console.log(`[Email] Sending notification to ${recipientEmails.join(', ')} via ${smtpConfig.smtpHost}:${smtpConfig.smtpPort}`);
    await transport.sendMail(mailOptions);
    console.log(`[Email] Notification sent successfully to ${recipientEmails.join(', ')}`);
  } catch (err) {
    console.error('[Email] sendNotificationEmail error:', err.message);
  }
}

export async function sendComplianceInviteEmail(smtpConfig, invite, url, qrDataUrl) {
  if (!smtpConfig?.smtpHost) throw new Error('SMTP no está configurado');
  if (!invite?.recipientEmail) throw new Error('Email del destinatario requerido');

  const transport = nodemailer.createTransport({
    host: smtpConfig.smtpHost,
    port: parseInt(smtpConfig.smtpPort) || 587,
    secure: parseInt(smtpConfig.smtpPort) === 465,
    auth: smtpConfig.smtpUser ? { user: smtpConfig.smtpUser, pass: smtpConfig.smtpPassword } : undefined,
  });

  const isConsent = invite.kind === 'consent';
  const title = isConsent ? 'Solicitud de Consentimiento' : 'Firma de Constancia de Capacitación';
  const actionLabel = isConsent ? 'Otorgar Consentimiento' : 'Firmar Constancia';
  const expiresStr = invite.expiresAt ? new Date(invite.expiresAt).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' }) : '';

  const html = emailWrapper(title, '#1a73e8', `
    <div style="margin-bottom:24px;">
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1a2332;">${title}</h1>
      <p style="margin:0;font-size:13px;color:#7b8794;">Ley 21.719 &mdash; Protecci&oacute;n de Datos Personales</p>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#3d4f5f;line-height:1.6;">
      Hola${invite.recipientName ? ' <strong>' + invite.recipientName + '</strong>' : ''},<br/>
      ${isConsent
        ? 'Se solicita tu consentimiento expl&iacute;cito para el tratamiento de datos personales con la siguiente finalidad: <strong>' + (invite.purpose || '') + '</strong>.'
        : 'Se solicita tu firma digital como constancia de haber recibido la capacitaci&oacute;n en protecci&oacute;n de datos personales.'}
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="display:inline-block;background:#1a73e8;color:#fff;padding:12px 32px;border-radius:4px;font-size:14px;font-weight:600;text-decoration:none;">${actionLabel}</a>
    </div>
    ${qrDataUrl ? `<div style="text-align:center;margin:12px 0 24px;">
      <p style="margin:0 0 8px;font-size:12px;color:#7b8794;">O escanea este c&oacute;digo QR desde tu tel&eacute;fono:</p>
      <img src="cid:invite-qr" alt="QR" width="160" height="160" style="border:1px solid #e8ecf1;border-radius:4px;" />
    </div>` : ''}
    <div style="padding:14px 16px;background:#fef8e7;border-left:3px solid #f39c12;border-radius:0 4px 4px 0;margin-bottom:8px;">
      <p style="margin:0;font-size:12px;color:#7a5c12;line-height:1.5;">
        Este enlace es <strong>de un solo uso</strong> y expira el <strong>${expiresStr}</strong>. Si no reconoces esta solicitud, ignora este correo.
      </p>
    </div>
  `);

  const mailOptions = {
    from: `"SecureLab - Cumplimiento" <${smtpConfig.smtpFromEmail || smtpConfig.smtpUser || 'noreply@securelab.cl'}>`,
    to: invite.recipientEmail,
    subject: `[SecureLab] ${title} — Ley 21.719`,
    html,
    attachments: qrDataUrl ? [{
      filename: 'qr.png',
      content: Buffer.from(qrDataUrl.split(',')[1], 'base64'),
      contentType: 'image/png',
      cid: 'invite-qr',
    }] : [],
  };

  return transport.sendMail(mailOptions);
}

export default { sendReportEmail, sendAlertEmail, sendNotificationEmail, sendComplianceInviteEmail };

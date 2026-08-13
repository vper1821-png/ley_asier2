import { Router } from 'express';
import { authMiddleware, validateToken } from '../middleware/auth.js';
import { User, AdminSettings } from '../models/db.js';
import ArcoRequest from '../models/arcoRequest.js';
import { sendNotificationEmail } from '../services/email.js';
import { CONFIG } from '../config.js';
import axios from 'axios';
import PDFDocument from 'pdfkit';

const router = Router();

function addCalendarDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

router.post('/arco/companies/search', async (req, res) => {
  try {
    const { q } = req.body;
    if (!q || q.length < 2) return res.json({ companies: [] });
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      $or: [{ companyName: regex }, { domain: regex }],
      isActive: true,
    }).select('companyName domain').limit(10).lean();
    res.json({ companies: users.map(u => ({
      id: u._id,
      companyName: u.companyName,
      domain: u.domain,
    })) });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.post('/arco/requests', async (req, res) => {
  try {
    const { companyId, solicitante, tipo, descripcion, datosAEliminar, eliminacionTotal, captchaToken } = req.body;
    if (!companyId || !solicitante?.nombre || !solicitante?.rut || !solicitante?.email || !tipo) {
      return res.json({ error: 'Todos los campos obligatorios deben ser completados' });
    }
    if (!captchaToken) {
      return res.json({ error: 'Verificación de seguridad requerida' });
    }
    const isTestKey = captchaToken === 'XXXX.DUMMY.TOKEN.XXXX' || captchaToken.startsWith('TEST.');
    if (!isTestKey) {
      try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=1x00000000000000000000AA&response=${captchaToken}`,
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return res.json({ error: 'Verificación de seguridad fallida' });
        }
      } catch (e) {
        return res.json({ error: 'Error al verificar seguridad' });
      }
    }
    const company = await User.findById(companyId).select('companyName').lean();
    if (!company) return res.json({ error: 'Empresa no encontrada' });
    const dueDate = addCalendarDays(new Date(), 30);
    const request = await ArcoRequest.create({
      companyId,
      companyName: company.companyName,
      solicitante,
      tipo,
      descripcion: descripcion || '',
      datosAEliminar: datosAEliminar || '',
      eliminacionTotal: eliminacionTotal || false,
      dueDate,
    });
    res.json({ success: true, message: 'Solicitud ARCO enviada correctamente. La empresa se pondrá en contacto contigo.', requestId: request._id, dueDate });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.post('/arco/requests/list', authMiddleware, async (req, res) => {
  try {
    const requests = await ArcoRequest.find({ companyId: req.user.UserID }).sort({ createdAt: -1 }).lean();
    res.json({ requests });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.post('/arco/requests/update', authMiddleware, async (req, res) => {
  try {
    const { requestId, estado, respuesta } = req.body;
    const updateData = { estado: estado || 'pendiente', respuesta: respuesta || '' };
    if (estado === 'completado' || estado === 'rechazado') {
      updateData.dueDate = null;
    }
    const request = await ArcoRequest.findOneAndUpdate(
      { _id: requestId, companyId: req.user.UserID },
      { $set: updateData },
      { new: true }
    ).lean();
    if (!request) return res.json({ error: 'Solicitud no encontrada' });

    /* Send email notification to the solicitante */
    try {
      const adminSettings = await AdminSettings.findOne().lean();
      if (adminSettings?.smtpHost && adminSettings?.smtpUser) {
        const estadoLabels = {
          en_proceso: 'En Proceso',
          completado: 'Completado',
          rechazado: 'Rechazado',
        };
        const estadoMsgs = {
          en_proceso: 'Hemos comenzado a revisar tu solicitud ARCO y está siendo procesada.',
          completado: 'Tu solicitud ARCO ha sido completada satisfactoriamente.',
          rechazado: 'Tu solicitud ARCO ha sido revisada y no ha sido posible completarla.',
        };
        const notification = {
          title: `Solicitud ARCO - ${estadoLabels[estado] || estado}`,
          message: `${estadoMsgs[estado] || ''}\n\n${respuesta ? `Respuesta: ${respuesta}\n\n` : ''}Tipo de solicitud: ${request.tipo}\nEmpresa: ${request.companyName}`,
          severity: 'info',
        };
        await sendNotificationEmail(adminSettings, notification, [request.solicitante.email]);
      }
    } catch (emailErr) {
      console.error('[ARCO] Email notification error:', emailErr.message);
    }

    res.json({ success: true, request, emailNotified: true });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.post('/arco/requests/status', async (req, res) => {
  try {
    const { requestId, email } = req.body;
    if (!requestId) return res.json({ error: 'ID de solicitud requerido' });
    const request = await ArcoRequest.findById(requestId).lean();
    if (!request) return res.json({ error: 'Solicitud no encontrada' });
    const isVerified = email && request.solicitante?.email === email;
    res.json({
      success: true,
      tracking: {
        _id: request._id,
        companyName: request.companyName,
        tipo: request.tipo,
        estado: request.estado,
        createdAt: request.createdAt,
        dueDate: request.dueDate,
        updatedAt: request.updatedAt,
        solicitante: isVerified ? request.solicitante : { nombre: request.solicitante?.nombre },
        descripcion: isVerified ? request.descripcion : undefined,
        respuesta: isVerified ? request.respuesta : undefined,
      },
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.post('/arco/requests/generate-response', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.json({ error: 'ID requerido' });
    const request = await ArcoRequest.findOne({ _id: requestId, companyId: req.user.UserID }).lean();
    if (!request) return res.json({ error: 'Solicitud no encontrada' });
    const tipoLabels = { acceso: 'Acceso', rectificacion: 'Rectificación', cancelacion: 'Cancelación', oposicion: 'Oposición', portabilidad: 'Portabilidad', bloqueo: 'Bloqueo' };
    const prompt = `Eres un asesor legal experto en la Ley 21.719 de Chile. Redacta una respuesta formal y profesional para una solicitud de derechos ARCO.

Datos de la solicitud:
- Tipo: ${tipoLabels[request.tipo] || request.tipo}
- Nombre del solicitante: ${request.solicitante?.nombre}
- Email: ${request.solicitante?.email}
- Descripción: ${request.descripcion || 'Sin descripción'}
${request.datosAEliminar ? `- Datos a eliminar: ${request.datosAEliminar}` : ''}
${request.eliminacionTotal ? '- Solicita eliminación total de sus datos' : ''}

La respuesta debe:
1. Ser formal y profesional, en español chileno
2. Incluir el nombre de la empresa (${request.companyName}) como responsable del tratamiento
3. Referenciar la Ley 21.719 y los derechos del titular
4. Indicar qué acción se ha tomado o se tomará respecto a la solicitud
5. Incluir información de contacto del DPO/encargado de protección de datos
6. Ser clara y respetuosa, dirigida al titular de los datos

Genera SOLO el cuerpo de la respuesta, sin encabezados ni firmas adicionales.`;
    const ollamaRes = await axios.post(`${CONFIG.OLLAMA_HOST}/api/generate`, {
      model: CONFIG.AI_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.3, num_ctx: 4096 },
    });
    const generated = ollamaRes.data?.response || '';
    res.json({ success: true, response: generated.trim() });
  } catch (e) {
    console.error('[ARCO] AI response error:', e.message);
    res.json({ error: 'No se pudo generar la respuesta automática. Verifica que Ollama esté disponible.' });
  }
});

router.get('/arco/requests/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const request = await ArcoRequest.findOne({ _id: req.params.id, companyId: req.user.UserID }).lean();
    if (!request) return res.status(404).json({ error: 'No encontrada' });
    const tipoLabels = { acceso: 'Acceso', rectificacion: 'Rectificación', cancelacion: 'Cancelación', oposicion: 'Oposición', portabilidad: 'Portabilidad', bloqueo: 'Bloqueo' };
    const estadoLabels = { pendiente: 'Pendiente', en_proceso: 'En Proceso', completado: 'Completado', rechazado: 'Rechazado' };
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="arco-${request._id}.pdf"`);
    doc.pipe(res);
    doc.fontSize(16).font('Helvetica-Bold').text('Respuesta a Solicitud ARCO', { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#666').text(`Ley 21.719 - Protección de Datos Personales`, { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(11).fillColor('#000').font('Helvetica-Bold').text('Datos de la solicitud');
    doc.moveDown(0.3);
    const lineHeight = 14;
    let y = doc.y;
    const fields = [
      ['Empresa:', request.companyName],
      ['Tipo:', tipoLabels[request.tipo] || request.tipo],
      ['Estado:', estadoLabels[request.estado] || request.estado],
      ['Solicitante:', request.solicitante?.nombre || ''],
      ['RUT:', request.solicitante?.rut || ''],
      ['Email:', request.solicitante?.email || ''],
      ['Fecha:', request.createdAt ? new Date(request.createdAt).toLocaleDateString('es-CL') : ''],
      ['ID:', request._id],
    ];
    doc.font('Helvetica').fontSize(10);
    fields.forEach(([label, value]) => {
      doc.text(`${label}  ${value}`, 50, y, { width: 460 });
      y += lineHeight;
    });
    if (request.descripcion) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Descripción:');
      doc.font('Helvetica').text(request.descripcion, { width: 460 });
      y = doc.y + 10;
    }
    if (request.respuesta) {
      doc.moveDown(1);
      doc.fontSize(11).font('Helvetica-Bold').text('Respuesta de la empresa');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(request.respuesta, { width: 460, align: 'justify' });
    }
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999').text('Documento generado electrónicamente · SecureLab Compliance · Ley 21.719 Chile', { align: 'center' });
    doc.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

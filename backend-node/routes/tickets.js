import { Router } from 'express';
import Ticket from '../models/ticket.js';
import { User, AdminSettings } from '../models/db.js';
import { authMiddleware, isAdmin } from '../middleware/auth.js';
import { sendNotificationEmail } from '../services/email.js';

const router = Router();

router.get('/tickets', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.UserID };
    if (status) filter.status = status;
    const tickets = await Ticket.find(filter).sort({ updated_at: -1 }).limit(100).select('subject status priority created_at updated_at replies');
    const list = tickets.map(t => ({
      id: t._id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      reply_count: t.replies?.length || 0,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/tickets/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    res.json({
      id: ticket._id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      replies: ticket.replies || [],
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/tickets', authMiddleware, async (req, res) => {
  try {
    const { subject, description, priority } = req.body;
    if (!subject || !description) return res.status(400).json({ error: 'Asunto y descripción requeridos' });
    const ticket = await Ticket.create({
      userId: req.user.UserID,
      subject,
      description,
      priority: priority || 'medium',
      replies: [{ role: 'user', content: description }],
    });

    /* Send ticket notification to admins if enabled */
    try {
      const adminSettings = await AdminSettings.findOne().lean();
      if (adminSettings?.enableTicketNotification && adminSettings?.smtpHost) {
        const user = await User.findById(req.user.UserID).select('companyName email').lean();
        const admins = await User.find({ role: { $in: ['admin', 'support', 'superadmin'] } }).select('email').lean();
        const adminEmails = [...new Set(admins.map(a => a.email))];
        if (adminEmails.length > 0) {
          await sendNotificationEmail(adminSettings, {
            title: `Nuevo ticket de soporte: ${subject}`,
            message: `Se ha creado un nuevo ticket de soporte.\n\nEmpresa: ${user?.companyName || 'N/A'}\nEmail: ${user?.email || req.user.UserID}\nAsunto: ${subject}\nPrioridad: ${priority || 'medium'}\n\nDescripción:\n${description}`,
            severity: priority === 'high' || priority === 'critical' ? 'high' : 'info',
          }, adminEmails);
        }
      }
    } catch (notifErr) {
      console.error('[Tickets] Notification error:', notifErr.message);
    }

    res.json({ id: ticket._id, success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/tickets/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenido requerido' });
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { $push: { replies: { role: 'user', content, created_at: new Date() } }, $set: { updated_at: new Date(), status: req.body.status || undefined } },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/tickets/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Estado requerido' });
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { $set: { status, updated_at: new Date() }, $push: { replies: { role: 'system', content: `Estado cambiado a: ${status}`, created_at: new Date() } } },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    res.json({ success: true, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/tickets/all', authMiddleware, async (req, res) => {
  try {
    const filter = isAdmin(req.user) ? {} : { userId: req.user.UserID };
    const tickets = await Ticket.find(filter).sort({ updated_at: -1 }).limit(200).populate('userId', 'companyName email domain');
    const list = tickets.map(t => ({
      id: t._id,
      _id: t._id,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      companyName: t.userId?.companyName || 'N/A',
      email: t.userId?.email || '',
      domain: t.userId?.domain || '',
      replies: t.replies || [],
      reply_count: t.replies?.length || 0,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/tickets/respond', authMiddleware, async (req, res) => {
  try {
    const { ticketId, message, agentName } = req.body;
    if (!ticketId || !message) return res.json({ error: 'ticketId y message requeridos' });
    const query = isAdmin(req.user) ? { _id: ticketId } : { _id: ticketId, userId: req.user.UserID };
    const reply = { role: isAdmin(req.user) ? 'agent' : 'user', content: message, created_at: new Date() };
    if (agentName) reply.agentName = agentName;
    const ticket = await Ticket.findOneAndUpdate(
      query,
      { $push: { replies: reply }, $set: { updated_at: new Date() } },
      { new: true }
    );
    if (!ticket) return res.json({ error: 'Ticket no encontrado' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/tickets/status', authMiddleware, async (req, res) => {
  try {
    const { ticketId, status } = req.body;
    if (!ticketId || !status) return res.json({ error: 'ticketId y status requeridos' });
    const query = isAdmin(req.user) ? { _id: ticketId } : { _id: ticketId, userId: req.user.UserID };
    const ticket = await Ticket.findOneAndUpdate(
      query,
      { $set: { status, updated_at: new Date() }, $push: { replies: { role: 'system', content: `Estado cambiado a: ${status}`, created_at: new Date() } } },
      { new: true }
    );
    if (!ticket) return res.json({ error: 'Ticket no encontrado' });
    res.json({ success: true, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/tickets/create', authMiddleware, async (req, res) => {
  try {
    const { subject, description, priority } = req.body;
    if (!subject || !description) return res.json({ error: 'Asunto y descripción requeridos' });
    const ticket = await Ticket.create({
      userId: req.user.UserID,
      subject,
      description,
      priority: priority || 'medium',
      replies: [{ role: 'user', content: description }],
    });
    res.json({ id: ticket._id, success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/tickets/close', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) return res.json({ error: 'ticketId requerido' });
    const query = isAdmin(req.user) ? { _id: ticketId } : { _id: ticketId, userId: req.user.UserID };
    const ticket = await Ticket.findOneAndUpdate(
      query,
      { $set: { status: 'closed', updated_at: new Date() }, $push: { replies: { role: 'system', content: 'Ticket cerrado', created_at: new Date() } } },
      { new: true }
    );
    if (!ticket) return res.json({ error: 'Ticket no encontrado' });
    res.json({ success: true, status: 'closed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;

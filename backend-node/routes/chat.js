import { Router } from 'express';
import crypto from 'crypto';
import { getDB } from '../services/assistant.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function generateId() {
  return crypto.randomUUID();
}

router.get('/chat/sessions', authMiddleware, (req, res) => {
  try {
    const userId = req.query.user_id || null;
    const db = getDB();
    let sessions;
    if (userId) {
      sessions = db.prepare('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
    } else {
      sessions = db.prepare('SELECT * FROM chat_sessions ORDER BY updated_at DESC').all();
    }
    res.json(sessions);
  } catch (err) {
    console.error('[CHAT] Error fetching sessions:', err.message);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

router.post('/chat/sessions', authMiddleware, (req, res) => {
  try {
    const { title, user_id } = req.body;
    const db = getDB();
    const id = generateId();
    db.prepare('INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)').run(
      id, user_id || null, title || 'Nueva conversación'
    );
    const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(id);
    res.json(session);
  } catch (err) {
    console.error('[CHAT] Error creating session:', err.message);
    res.status(500).json({ error: 'Error al crear sesión' });
  }
});

router.get('/chat/sessions/:id/messages', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    const messages = db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json(messages);
  } catch (err) {
    console.error('[CHAT] Error fetching messages:', err.message);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

router.post('/chat/sessions/:id/messages', authMiddleware, (req, res) => {
  try {
    const { role, content, category, confidence } = req.body;
    if (!role || !content) return res.status(400).json({ error: 'role y content requeridos' });

    const db = getDB();
    const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

    const result = db.prepare(
      'INSERT INTO chat_messages (session_id, role, content, category, confidence) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.id, role, content, category || null, confidence || null);

    db.prepare(
      'UPDATE chat_sessions SET message_count = message_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(req.params.id);

    if (role === 'user' && session.message_count === 0) {
      const title = content.length > 60 ? content.substring(0, 60) + '...' : content;
      db.prepare('UPDATE chat_sessions SET title = ? WHERE id = ?').run(title, req.params.id);
    }

    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);
    res.json(message);
  } catch (err) {
    console.error('[CHAT] Error saving message:', err.message);
    res.status(500).json({ error: 'Error al guardar mensaje' });
  }
});

router.put('/chat/sessions/:id', authMiddleware, (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title requerido' });
    const db = getDB();
    const result = db.prepare('UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Sesión no encontrada' });
    const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(req.params.id);
    res.json(session);
  } catch (err) {
    console.error('[CHAT] Error updating session:', err.message);
    res.status(500).json({ error: 'Error al actualizar sesión' });
  }
});

router.delete('/chat/sessions/:id', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    db.prepare('DELETE FROM chat_messages WHERE session_id = ?').run(req.params.id);
    const result = db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Sesión no encontrada' });
    res.json({ success: true, message: 'Sesión eliminada' });
  } catch (err) {
    console.error('[CHAT] Error deleting session:', err.message);
    res.status(500).json({ error: 'Error al eliminar sesión' });
  }
});

router.delete('/chat/sessions', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const { user_id } = req.body;
    if (user_id) {
      db.prepare('DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = ?)').run(user_id);
      const result = db.prepare('DELETE FROM chat_sessions WHERE user_id = ?').run(user_id);
      res.json({ success: true, deleted: result.changes });
    } else {
      db.prepare('DELETE FROM chat_messages').run();
      const result = db.prepare('DELETE FROM chat_sessions').run();
      res.json({ success: true, deleted: result.changes });
    }
  } catch (err) {
    console.error('[CHAT] Error clearing sessions:', err.message);
    res.status(500).json({ error: 'Error al limpiar sesiones' });
  }
});

// --- Ticket routes ---

router.get('/tickets', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const { user_id, status } = req.query;
    let tickets;
    if (user_id) {
      tickets = status
        ? db.prepare('SELECT * FROM tickets WHERE user_id = ? AND status = ? ORDER BY updated_at DESC').all(user_id, status)
        : db.prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY updated_at DESC').all(user_id);
    } else {
      tickets = status
        ? db.prepare('SELECT * FROM tickets WHERE status = ? ORDER BY updated_at DESC').all(status)
        : db.prepare('SELECT * FROM tickets ORDER BY updated_at DESC').all();
    }
    tickets = tickets.map(t => ({
      ...t,
      reply_count: db.prepare('SELECT COUNT(*) as c FROM ticket_replies WHERE ticket_id = ?').get(t.id).c,
    }));
    res.json(tickets);
  } catch (err) {
    console.error('[TICKETS] Error fetching tickets:', err.message);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

router.post('/tickets', authMiddleware, (req, res) => {
  try {
    const { user_id, subject, description, priority } = req.body;
    if (!subject || !description) return res.status(400).json({ error: 'subject y description requeridos' });
    const db = getDB();
    const id = generateId();
    db.prepare('INSERT INTO tickets (id, user_id, subject, description, priority) VALUES (?, ?, ?, ?, ?)').run(
      id, user_id || null, subject, description, priority || 'medium'
    );
    db.prepare('INSERT INTO ticket_replies (ticket_id, user_id, role, content) VALUES (?, ?, ?, ?)').run(
      id, user_id || null, 'user', description
    );
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json(ticket);
  } catch (err) {
    console.error('[TICKETS] Error creating ticket:', err.message);
    res.status(500).json({ error: 'Error al crear ticket' });
  }
});

router.get('/tickets/:id', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    ticket.replies = db.prepare('SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC').all(req.params.id);
    ticket.reply_count = ticket.replies.length;
    res.json(ticket);
  } catch (err) {
    console.error('[TICKETS] Error fetching ticket:', err.message);
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
});

router.post('/tickets/:id/reply', authMiddleware, (req, res) => {
  try {
    const { user_id, content, role } = req.body;
    if (!content) return res.status(400).json({ error: 'content requerido' });
    const db = getDB();
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const result = db.prepare(
      'INSERT INTO ticket_replies (ticket_id, user_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, user_id || null, role || 'user', content);
    db.prepare(
      "UPDATE tickets SET updated_at = CURRENT_TIMESTAMP, status = CASE WHEN status = 'resolved' THEN 'open' ELSE status END WHERE id = ?"
    ).run(req.params.id);
    const reply = db.prepare('SELECT * FROM ticket_replies WHERE id = ?').get(result.lastInsertRowid);
    res.json(reply);
  } catch (err) {
    console.error('[TICKETS] Error adding reply:', err.message);
    res.status(500).json({ error: 'Error al agregar respuesta' });
  }
});

router.put('/tickets/:id/status', authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status requerido' });
    const db = getDB();
    const result = db.prepare("UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Ticket no encontrado' });
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    res.json(ticket);
  } catch (err) {
    console.error('[TICKETS] Error updating status:', err.message);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

export default router;

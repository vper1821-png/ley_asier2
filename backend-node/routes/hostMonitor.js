import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import Alert from '../models/alert.js';

const router = Router();

function verifyToken(token) {
  try {
    return jwt.verify(token, CONFIG.JWT_SECRET);
  } catch {
    return null;
  }
}

router.post('/events', async (req, res) => {
  try {
    const { token, severity, event_type, limit, offset } = req.body;
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ error: 'token inválido' });

    const filter = {
      userId: decoded.userId,
      $or: [
        { source: 'host_monitor' },
        { category: 'agent_event' },
      ],
    };

    if (severity && severity !== 'all') filter.severity = severity;
    if (event_type && event_type !== 'all') filter.category = event_type;

    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const offsetNum = parseInt(offset) || 0;

    const [events, total] = await Promise.all([
      Alert.find(filter).sort({ createdAt: -1 }).skip(offsetNum).limit(limitNum).lean(),
      Alert.countDocuments(filter),
    ]);

    res.json({ events, total });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/stats', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ error: 'token inválido' });

    const matchFilter = {
      userId: decoded.userId,
      $or: [
        { source: 'host_monitor' },
        { category: 'agent_event' },
      ],
    };

    const total = await Alert.countDocuments(matchFilter);

    const docs = await Alert.find(matchFilter).select('severity category').lean();

    const bySeverity = {};
    const byType = {};
    docs.forEach(d => {
      const sev = d.severity || 'unknown';
      const cat = d.category || 'unknown';
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;
      byType[cat] = (byType[cat] || 0) + 1;
    });

    res.json({ total, bySeverity, byType });
  } catch (err) {
    res.json({ error: err.message });
  }
});

export default router;

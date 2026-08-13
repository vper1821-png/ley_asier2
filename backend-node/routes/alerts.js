import { Router } from 'express';
import Alert from '../models/alert.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/list', authMiddleware, async (req, res) => {
  try {
    const { severity, status, search, sort, limit, offset } = req.body;

    const filter = { userId: req.user.UserID };
    if (severity && severity !== 'all') filter.severity = severity;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { message: { $regex: safe, $options: 'i' } },
        { source: { $regex: safe, $options: 'i' } },
      ];
    }

    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const offsetNum = parseInt(offset) || 0;

    const [alerts, total, activeCount, resolvedCount, criticalCount] = await Promise.all([
      Alert.find(filter).sort(sortOption).skip(offsetNum).limit(limitNum).lean(),
      Alert.countDocuments(filter),
      Alert.countDocuments({ userId: req.user.UserID, status: 'active' }),
      Alert.countDocuments({ userId: req.user.UserID, status: 'resolved' }),
      Alert.countDocuments({ userId: req.user.UserID, severity: 'critical', status: 'active' }),
    ]);

    res.json({ alerts, total, activeCount, resolvedCount, criticalCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resolve', authMiddleware, async (req, res) => {
  try {
    const { alertId, resolvedType, notes } = req.body;

    const update = { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user.email };
    if (resolvedType) update.resolvedType = resolvedType;
    if (notes) update.resolutionNotes = notes;

    const alert = await Alert.findOneAndUpdate(
      { _id: alertId, userId: req.user.UserID },
      update,
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'alert not found' });

    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resolve-bulk', authMiddleware, async (req, res) => {
  try {
    const { alertIds } = req.body;

    const ids = typeof alertIds === 'string' ? JSON.parse(alertIds) : (Array.isArray(alertIds) ? alertIds : [alertIds]);
    const result = await Alert.updateMany(
      { _id: { $in: ids }, userId: req.user.UserID },
      { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user.email }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dismiss', authMiddleware, async (req, res) => {
  try {
    const { alertId } = req.body;

    const alert = await Alert.findOneAndUpdate(
      { _id: alertId, userId: req.user.UserID },
      { status: 'dismissed', resolvedAt: new Date(), resolvedBy: req.user.email },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'alert not found' });

    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/delete-all', authMiddleware, async (req, res) => {
  try {
    const result = await Alert.deleteMany({ userId: req.user.UserID });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stats', authMiddleware, async (req, res) => {
  try {
    const [total, active, resolved, dismissed, critical, high, medium, low] = await Promise.all([
      Alert.countDocuments({ userId: req.user.UserID }),
      Alert.countDocuments({ userId: req.user.UserID, status: 'active' }),
      Alert.countDocuments({ userId: req.user.UserID, status: 'resolved' }),
      Alert.countDocuments({ userId: req.user.UserID, status: 'dismissed' }),
      Alert.countDocuments({ userId: req.user.UserID, severity: 'critical', status: 'active' }),
      Alert.countDocuments({ userId: req.user.UserID, severity: 'high', status: 'active' }),
      Alert.countDocuments({ userId: req.user.UserID, severity: 'medium', status: 'active' }),
      Alert.countDocuments({ userId: req.user.UserID, severity: 'low', status: 'active' }),
    ]);

    res.json({ total, active, resolved, dismissed, critical, high, medium, low });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

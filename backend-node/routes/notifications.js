import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Notification from '../models/notification.js';

const router = Router();

router.use(authMiddleware);

router.post('/list', async (req, res) => {
  try {
    const { limit = 50, unreadOnly } = req.body;
    const filter = { userId: req.user.UserID };
    if (unreadOnly) filter.read = false;
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 }).limit(parseInt(limit)).lean();
    res.json(notifications);
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.UserID, read: false });
    res.json({ count });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/:id/read', async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.UserID, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/:id/delete', async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.UserID });
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/clear-all', async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.UserID });
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { type, title, message } = req.body;
    if (!type || !title) return res.json({ error: 'type y title requeridos' });
    // Deduplicate: skip if same type+title exists from last hour; clean older duplicates
    await Notification.deleteMany({
      userId: req.user.UserID, type, title,
      createdAt: { $lt: new Date(Date.now() - 3600000) },
    });
    const recent = await Notification.findOne({
      userId: req.user.UserID, type, title,
      createdAt: { $gt: new Date(Date.now() - 3600000) },
    });
    if (recent) return res.json({ id: recent._id, success: true, cached: true });
    const notification = await Notification.create({
      userId: req.user.UserID,
      type: type || 'info',
      title,
      message: message || '',
      read: false,
    });
    res.json({ id: notification._id, success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

export default router;

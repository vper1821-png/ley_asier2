import { Router } from 'express';
import { ScheduledScan } from '../models/db.js';
import { validateToken } from '../middleware/auth.js';

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const { token, domain, scanType, scheduleType, nextRun } = req.body;
    const user = await validateToken(token);
    if (!user) return res.json({ error: 'token inválido' });

    const schedule = await ScheduledScan.create({
      userId: user.UserID,
      domain,
      scanType: scanType || 'full',
      scheduleType: scheduleType || 'daily',
      nextRun: nextRun || new Date(),
    });

    res.json({ success: true, schedule });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/list', async (req, res) => {
  const { token } = req.body;
  const user = await validateToken(token);
  if (!user) return res.json({ error: 'token inválido' });

  const schedules = await ScheduledScan.find({ userId: user.UserID, isActive: true }).sort({ nextRun: 1 }).lean();
  res.json(schedules);
});

router.post('/delete', async (req, res) => {
  const { token, scheduleID } = req.body;
  if (!await validateToken(token)) return res.json({ error: 'token inválido' });

  await ScheduledScan.findByIdAndUpdate(scheduleID, { isActive: false });
  res.json({ success: true });
});

export default router;

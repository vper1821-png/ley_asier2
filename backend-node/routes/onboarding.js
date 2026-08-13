import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { User } from '../models/db.js';
import { ComplianceConfig } from '../models/compliance.js';

const router = Router();

function auth(req, res, next) {
  const token = req.body?.token || req.query?.token || req.headers?.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'token requerido' });
  try {
    req.user = jwt.verify(token, CONFIG.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'token inválido' });
  }
}

// GET /api/onboarding/status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('onboardingComplete').lean();
    res.json({ onboardingComplete: user?.onboardingComplete || false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onboarding/status — mark onboarding complete
router.post('/status', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { onboardingComplete: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onboarding/save — save onboarding step data
router.post('/save', auth, async (req, res) => {
  try {
    const { step, data } = req.body;
    const userId = req.user.userId;

    switch (step) {
      case 1: {
        const { companyRut, industry, companySize, dpdName, dpdEmail, dpdPhone } = data;
        await ComplianceConfig.findOneAndUpdate(
          { userId },
          {
            userId,
            companyName: data.companyName || '',
            companyRut: companyRut || '',
            dpdName: dpdName || '',
            dpdEmail: dpdEmail || '',
            dpdPhone: dpdPhone || '',
          },
          { upsert: true, new: true }
        );
        if (data.companyName) {
          await User.findByIdAndUpdate(userId, { companyName: data.companyName });
        }
        break;
      }
      case 2: {
        const { dataRetentionPolicy, complianceLevel, apdpRegistered, internationalTransfer } = data;
        await ComplianceConfig.findOneAndUpdate(
          { userId },
          {
            $set: {
              dataRetentionPolicy: dataRetentionPolicy || '5 years',
              complianceLevel: complianceLevel || 'basic',
              apdpRegistered: !!apdpRegistered,
              internationalTransfer: !!internationalTransfer,
            },
          },
          { upsert: true, new: true }
        );
        break;
      }
      case 3: {
        const { domains, databases } = data;
        const updateFields = {};
        if (domains && Array.isArray(domains)) {
          updateFields.domains = domains;
        }
        if (databases && Array.isArray(databases)) {
          updateFields.monitoredDatabases = databases;
        }
        if (Object.keys(updateFields).length > 0) {
          await ComplianceConfig.findOneAndUpdate(
            { userId },
            { $set: updateFields },
            { upsert: true, new: true }
          );
        }
        await User.findByIdAndUpdate(userId, { onboardingComplete: true });
        break;
      }
      case 4: {
        await User.findByIdAndUpdate(userId, { onboardingComplete: true });
        break;
      }
      case 5: {
        await ComplianceConfig.findOneAndUpdate(
          { userId },
          { $set: { pendingSurvey: data || {} } },
          { upsert: true, new: true }
        );
        break;
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router } from 'express';
import CompliantCompany from '../models/compliantCompany.js';

const router = Router();

router.get('/compliant-companies', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { active: true, fullyCompliant: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rut: { $regex: search, $options: 'i' } },
      ];
    }
    const companies = await CompliantCompany.find(filter)
      .select('name rut website logo description contactUrl arcoUrls complianceLevel lastAudit userId')
      .sort({ name: 1 })
      .limit(100);
    res.json(companies);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/compliant-companies/:rut', async (req, res) => {
  try {
    const company = await CompliantCompany.findOne({ rut: req.params.rut, active: true });
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json(company);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;

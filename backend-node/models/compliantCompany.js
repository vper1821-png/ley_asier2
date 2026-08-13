import mongoose from 'mongoose';

const compliantCompanySchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  rut: { type: String, required: true, unique: true },
  website: String,
  logo: String,
  description: String,
  contactUrl: { type: String, required: true },
  arcoUrls: {
    acceso: String,
    rectificacion: String,
    supresion: String,
    oposicion: String,
    portabilidad: String,
  },
  fullyCompliant: { type: Boolean, default: true },
  complianceLevel: { type: String, enum: ['basic', 'intermediate', 'advanced', 'certified'], default: 'certified' },
  lastAudit: Date,
  active: { type: Boolean, default: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

compliantCompanySchema.index({ name: 'text', rut: 'text' });

const CompliantCompany = mongoose.model('CompliantCompany', compliantCompanySchema);

export default CompliantCompany;

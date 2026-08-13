import mongoose from 'mongoose';

const reportConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  enabled: { type: Boolean, default: false },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
  dayOfWeek: { type: Number, default: 1 }, // 0=Sun, 1=Mon...
  dayOfMonth: { type: Number, default: 1 },
  hour: { type: Number, default: 8 },
  minute: { type: Number, default: 0 },
  recipients: [{ type: String }],
  subject: { type: String, default: 'Invisia V2 - Informe de Seguridad' },
  body: { type: String, default: 'Adjunto encontrará el informe detallado de seguridad de su plataforma Invisia V2.' },
  pdfFormat: {
    margins: { type: Number, default: 20 },
    headerText: { type: String, default: 'Invisia V2 Security Report' },
    footerText: { type: String, default: 'Confidencial - Generado automáticamente' },
    includeLogo: { type: Boolean, default: true },
    pageNumbers: { type: Boolean, default: true },
  },
  smtp: {
    host: { type: String, default: '' },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    user: { type: String, default: '' },
    pass: { type: String, default: '' },
    fromName: { type: String, default: 'Invisia V2' },
    fromEmail: { type: String, default: '' },
  },
  lastSent: Date,
  nextRun: Date,
}, { timestamps: true });

const ReportConfig = mongoose.model('ReportConfig', reportConfigSchema);
export default ReportConfig;

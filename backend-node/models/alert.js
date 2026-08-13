import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' },
  status: { type: String, enum: ['active', 'resolved', 'dismissed'], default: 'active' },
  source: { type: String, default: 'system' },
  category: { type: String, default: 'general' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  resolvedAt: { type: Date },
  resolvedBy: { type: String },
  resolvedType: { type: String, enum: ['confirmed', 'false_positive', 'accepted', 'patched'], default: null },
  resolutionNotes: { type: String, default: '' },
}, { timestamps: true });

alertSchema.index({ userId: 1, status: 1 });
alertSchema.index({ userId: 1, severity: 1 });
alertSchema.index({ userId: 1, createdAt: -1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;

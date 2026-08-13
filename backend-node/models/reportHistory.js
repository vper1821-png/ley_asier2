import mongoose from 'mongoose';

const reportHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['compliance', 'privacy', 'hardening', 'training', 'custom'], default: 'compliance' },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  includeSections: [String],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

reportHistorySchema.index({ userId: 1, createdAt: -1 });

const ReportHistory = mongoose.model('ReportHistory', reportHistorySchema);
export default ReportHistory;

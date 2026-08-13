import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, enum: ['db_disconnected', 'db_reconnected', 'db_error', 'scan_complete', 'alert', 'info', 'payment'] },
  title: { type: String, required: true },
  message: { type: String },
  read: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  relatedId: { type: String },
  relatedModel: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

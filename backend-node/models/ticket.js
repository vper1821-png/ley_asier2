import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'agent', 'system'], default: 'user' },
  content: { type: String, required: true },
  agentName: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
}, { _id: true });

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  replies: [replySchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { timestamps: true });

ticketSchema.virtual('reply_count').get(function () {
  return this.replies?.length || 0;
});

ticketSchema.set('toJSON', { virtuals: true });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;

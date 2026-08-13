import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  agentId: { type: String, unique: true, required: true },
  token: { type: String, required: true },
  hostname: { type: String },
  platform: { type: String },
  arch: { type: String },
  ip: { type: String },
  version: { type: String },
  status: { type: String, enum: ['offline', 'online', 'idle', 'error'], default: 'offline' },
  wsConnected: { type: Boolean, default: false },
  registeredAt: { type: Date },
  lastHeartbeat: { type: Date },
  heartbeatInterval: { type: Number, default: 30 },
  metrics: {
    cpu: { type: Number },
    memory: { type: Number },
    load: { type: Number },
    users: { type: Number },
    uptime: { type: Number },
  },
  firewall: { type: mongoose.Schema.Types.Mixed },
  blockedUsers: [{ type: String }],
  capabilities: {
    firewall: { type: Boolean, default: false },
    blocker: { type: Boolean, default: false },
    telemetry: { type: Boolean, default: false },
    dbScanner: { type: Boolean, default: false },
    ollama: { type: Boolean, default: false },
  },
}, { timestamps: true });

agentSchema.index({ userId: 1, status: 1 });

const Agent = mongoose.model('Agent', agentSchema);
export default Agent;

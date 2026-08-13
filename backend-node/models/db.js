import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { CONFIG } from '../config.js';
import Notification from './notification.js';

// ─── Schemas ───────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  domain: { type: String, default: '', sparse: true },
  onboardingComplete: { type: Boolean, default: false },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  planType: { type: String, default: 'free' },
  role: { type: String, enum: ['user', 'support', 'finance', 'admin', 'superadmin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  aiRetention: { type: String, enum: ['weekly', 'monthly', 'yearly', 'never'], default: 'never' },
  paymentStatus: { type: String, enum: ['pending_approval', 'preapproved', 'active', 'suspended', 'cancelled'], default: 'pending_approval' },
  customPrice: { type: Number, default: 0 },
  bankDetails: {
    bankName: String,
    accountType: String,
    accountNumber: String,
    rut: String,
    email: String,
  },
  twoFactorSecret: { type: String, default: '' },
  twoFactorEnabled: { type: Boolean, default: false },
  suspensionReason: { type: String, default: '' },
}, { timestamps: true });

userSchema.index({ domain: 1 });

const scanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  domain: { type: String, required: true },
  scanType: { type: String, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'running', 'completed', 'failed', 'cancelled', 'paused'] },
  results: { type: mongoose.Schema.Types.Mixed },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  durationSeconds: Number,
  errorMessage: String,
}, { timestamps: true });

scanSchema.index({ userId: 1, startedAt: -1 });
scanSchema.index({ domain: 1 });
scanSchema.index({ status: 1 });

const vulnerabilitySchema = new mongoose.Schema({
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', required: true },
  type: { type: String, required: true },
  severity: { type: String, required: true, enum: ['critical', 'high', 'medium', 'low', 'info'] },
  title: { type: String, required: true },
  description: String,
  url: String,
  parameter: String,
  evidence: String,
  cwe: String,
  cve: String,
  cvss: String,
  remediation: String,
  isFixed: { type: Boolean, default: false },
}, { timestamps: true });

vulnerabilitySchema.index({ scanId: 1 });
vulnerabilitySchema.index({ severity: 1 });
vulnerabilitySchema.index({ cve: 1 });

const subdomainSchema = new mongoose.Schema({
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', required: true },
  subdomain: { type: String, required: true },
  ip: String,
  ipv6: String,
  ports: String,
  techStack: String,
  subdomainRank: Number,
  isAlive: { type: Boolean, default: true },
}, { timestamps: true });

subdomainSchema.index({ scanId: 1 });
subdomainSchema.index({ subdomain: 1 });

const urlSchema = new mongoose.Schema({
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', required: true },
  url: { type: String, required: true },
  status: Number,
  contentLength: Number,
  title: String,
  server: String,
  cms: String,
  hasForms: { type: Boolean, default: false },
}, { timestamps: true });

const portSchema = new mongoose.Schema({
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', required: true },
  port: { type: Number, required: true },
  service: String,
  status: String,
  version: String,
  banner: String,
}, { timestamps: true });

portSchema.index({ scanId: 1 });

const sslSchema = new mongoose.Schema({
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', required: true },
  domain: { type: String, required: true },
  issuer: String,
  subject: String,
  validFrom: Date,
  validTo: Date,
  sha256: String,
  sha1: String,
  serial: String,
  signatureAlgorithm: String,
  keyAlgorithm: String,
  keySize: Number,
  daysRemaining: Number,
  isValid: { type: Boolean, default: true },
}, { timestamps: true });

const dnsSchema = new mongoose.Schema({
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', required: true },
  recordType: { type: String, required: true },
  name: { type: String, required: true },
  value: String,
  ttl: Number,
}, { timestamps: true });

dnsSchema.index({ scanId: 1 });

const reportSchema = new mongoose.Schema({
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: { type: String, default: 'pdf' },
  filePath: String,
  fileSize: Number,
  generatedAt: { type: Date, default: Date.now },
});

const scanProgressSchema = new mongoose.Schema({
  scanId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  domain: { type: String, required: true },
  scanType: { type: String, required: true },
  status: { type: String, default: 'running' },
  progressJson: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const scheduledScanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  domain: { type: String, required: true },
  scanType: { type: String, required: true },
  scheduleType: { type: String, required: true },
  nextRun: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  lastRun: Date,
}, { timestamps: true });

scheduledScanSchema.index({ userId: 1 });
scheduledScanSchema.index({ nextRun: 1 });

const shellSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shellId: { type: String, required: true, unique: true },
  domain: { type: String, required: true },
  shellUrl: { type: String, required: true },
  shellType: { type: String, default: 'webshell' },
  language: { type: String, default: 'PHP' },
  status: { type: String, default: 'active' },
  scanId: String,
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

shellSchema.index({ userId: 1 });
shellSchema.index({ domain: 1 });

const adminSettingsSchema = new mongoose.Schema({
  contactPhone: { type: String, default: '+1 (555) 123-4567' },
  contactEmail: { type: String, default: 'support@domain-scanner.com' },
  smtpHost: String,
  smtpPort: { type: String, default: '587' },
  smtpUser: String,
  smtpPassword: String,
  smtpFromEmail: String,
  enablePdfEmailNotification: { type: Boolean, default: false },
  enableTicketNotification: { type: Boolean, default: false },
  pdfEmailSubject: { type: String, default: 'Domain Scan Report' },
  pdfEmailBody: { type: String, default: 'Your domain scan report is attached.' },
  alerts: [{
    title: { type: String, required: true },
    message: { type: String, default: '' },
    type: { type: String, enum: ['maintenance', 'announcement', 'warning', 'info'], default: 'info' },
    enabled: { type: Boolean, default: true },
    showOnLanding: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: '' },
  maintenanceScheduledAt: Date,
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  keyName: { type: String, required: true },
  keyValue: String,
}, { timestamps: true });

settingsSchema.index({ userId: 1, keyName: 1 });

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'open', enum: ['open', 'in_progress', 'closed'] },
  priority: { type: String, default: 'medium', enum: ['low', 'medium', 'high', 'critical'] },
}, { timestamps: true });

const adminNotificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: String,
  read: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  resourceType: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  ipAddress: String,
  userAgent: String,
  details: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const k8sClusterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  sshHost: { type: String, required: true },
  sshPort: { type: Number, default: 22 },
  sshUser: { type: String, required: true },
  sshKey: { type: String, default: '' },
  sshPassword: { type: String, default: '' },
  kubeconfig: { type: String, default: '' },
  region: { type: String, default: 'us-east' },
  lat: { type: Number, default: 0 },
  lng: { type: Number, default: 0 },
  status: { type: String, default: 'pending', enum: ['pending', 'active', 'inactive', 'error'] },
  rotationInterval: { type: Number, default: 300 }, // seconds
  lastRotated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  version: { type: String, default: '1.30' },
  nodeCount: { type: Number, default: 1 },
  metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

k8sClusterSchema.index({ userId: 1 });

// ─── Models ────────────────────────────────────────────────────────────────

export const User = mongoose.model('User', userSchema);
export const Scan = mongoose.model('Scan', scanSchema);
export const Vulnerability = mongoose.model('Vulnerability', vulnerabilitySchema);
export const Subdomain = mongoose.model('Subdomain', subdomainSchema);
export const Url = mongoose.model('Url', urlSchema);
export const Port = mongoose.model('Port', portSchema);
export const SslCertificate = mongoose.model('SslCertificate', sslSchema);
export const DnsRecord = mongoose.model('DnsRecord', dnsSchema);
export const Report = mongoose.model('Report', reportSchema);
export const ScanProgress = mongoose.model('ScanProgress', scanProgressSchema);
export const ScheduledScan = mongoose.model('ScheduledScan', scheduledScanSchema);
export const Shell = mongoose.model('Shell', shellSchema);
export const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
export const Settings = mongoose.model('Settings', settingsSchema);
export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export const K8sCluster = mongoose.model('K8sCluster', k8sClusterSchema);
export { Notification };

// ─── Connection ────────────────────────────────────────────────────────────

let cachedDb = null;

export async function connectDB() {
  if (cachedDb) return cachedDb;

  try {
    const conn = await mongoose.connect(CONFIG.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    cachedDb = conn;
    console.log('[OK] MongoDB Atlas connected:', conn.connection.host);
    await seedAdmin();
    await seedAdminSettings();
    return conn;
  } catch (err) {
    console.error('[ERROR] MongoDB connection failed:', err.message);
    console.error('Make sure MONGODB_URI in .env is correct');
    process.exit(1);
  }
}

async function seedAdmin() {
  const hash = await bcrypt.hash(CONFIG.ADMIN_PASSWORD, 10);
  const existing = await User.findOne({ email: CONFIG.ADMIN_EMAIL });
  if (existing) {
    await User.findOneAndUpdate({ email: CONFIG.ADMIN_EMAIL }, { $set: { password: hash, isActive: true, role: 'superadmin', paymentStatus: 'active' } });
    console.log('[OK] Admin password synced');
    return;
  }
  await User.create({
    companyName: 'Administrator',
    domain: 'admin.local',
    email: CONFIG.ADMIN_EMAIL,
    password: hash,
    planType: 'admin',
    role: 'superadmin',
    isActive: true,
    paymentStatus: 'active',
  });
  console.log('[OK] Admin user seeded');
}

async function seedAdminSettings() {
  const existing = await AdminSettings.findOne();
  if (existing) return;

  await AdminSettings.create({
    contactPhone: '',
    contactEmail: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFromEmail: '',
    enablePdfEmailNotification: false,
    pdfEmailSubject: 'Domain Scan Report',
    pdfEmailBody: 'Your domain scan report is attached.',
  });
  console.log('[OK] Admin settings seeded');
}

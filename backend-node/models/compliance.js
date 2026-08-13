import mongoose from 'mongoose';
import { AuditLog as AuditLogDB } from './db.js';

// Consentimiento explícito (Art. 12 Ley 21.719)
const consentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  titularEmail: { type: String, required: true },
  titularName: String,
  titularRut: String,
  purpose: { type: String, required: true }, // Finalidad específica
  dataCategories: [{ type: String }], // qué datos se autorizan
  grantedAt: { type: Date, default: Date.now },
  expiresAt: Date,
  revokedAt: Date,
  source: { type: String, enum: ['web_form', 'api', 'signed_document', 'verbal'], default: 'web_form' },
  proofHash: String, // hash del registro de consentimiento
  ipAddress: String,
  userAgent: String,
  version: { type: String, default: '1.0' },
}, { timestamps: true });

// Inventario de datos personales (Art. 15)
const dataInventorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true }, // clientes, empleados, proveedores
  dataType: { type: String, required: true }, // nombre, email, RUT, salud, etc.
  sensitive: { type: Boolean, default: false },
  storage: { type: String, enum: ['local', 'cloud', 'third_party', 'physical'], default: 'local' },
  storageLocation: String,
  retentionDays: Number,
  purpose: String,
  legalBasis: { type: String, enum: ['consent', 'contract', 'legal_obligation', 'legitimate_interest', 'public_interest'], default: 'consent' },
  sharedWith: [{ type: String }], // terceros con quienes se comparte
  securityMeasures: [{ type: String }],
  risk: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

// Reporte de brecha de seguridad (Art. 26)
const breachReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  detectedAt: { type: Date, default: Date.now },
  reportedAt: Date,
  type: { type: String, enum: ['hack', 'leak', 'loss', 'unauthorized_access', 'ransomware', 'phishing', 'internal', 'other'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'high' },
  description: { type: String, required: true },
  affectedData: [{ type: String }],
  affectedUsers: { type: Number, default: 0 },
  sensitiveDataInvolved: { type: Boolean, default: false },
  childrenDataInvolved: { type: Boolean, default: false },
  economicDataInvolved: { type: Boolean, default: false },
  rootCause: String,
  containmentActions: [{ type: String }],
  notifiedAPDP: { type: Boolean, default: false },
  notifiedAt: Date,
  notifiedAffected: { type: Boolean, default: false },
  notifiedAffectedAt: Date,
  resolvedAt: Date,
  status: { type: String, enum: ['detected', 'contained', 'investigating', 'resolved', 'reported'], default: 'detected' },
  reportToCSIRT: { type: Boolean, default: false }, // Ley 21.663
  csirtReportedAt: Date,
}, { timestamps: true });

// Configuración de compliance para el usuario
const complianceConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
  companyRut: String,
  companyName: String,
  dpdName: String,
  dpdEmail: String,
  dpdPhone: String,
  apdpRegistered: { type: Boolean, default: false },
  apdpRegistrationDate: Date,
  complianceLevel: { type: String, enum: ['basic', 'intermediate', 'advanced', 'certified'], default: 'basic' },
  lastAudit: Date,
  nextAudit: Date,
  dataRetentionPolicy: { type: String, default: '5 years' },
  internationalTransfer: { type: Boolean, default: false },
  internationalTransferCountries: [{ type: String }],
  consentVersion: { type: String, default: '1.0' },
  privacyPolicyUrl: String,
  privacyPolicyUpdatedAt: Date,
  cookiesPolicyUrl: String,
  arcoUrls: {
    acceso: String,
    rectificacion: String,
    supresion: String,
    oposicion: String,
    portabilidad: String,
  },
  measureOverrides: [{
    measureId: { type: String, required: true },
    completed: { type: Boolean, default: true },
    notes: String,
    evidence: String,
    fieldData: String,
    completedAt: { type: Date, default: Date.now },
  }],
  pendingSurvey: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Capacitación en protección de datos (Art. 28 letra c) — Ley 21.719
const trainingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  employeeRut: String,
  employeePhone: String,
  employeePosition: String,
  employeeDepartment: String,
  topic: { type: String, required: true }, // protección de datos, ciberseguridad, etc.
  date: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  expiresAt: Date,
  notes: String,
  signatureData: { type: String }, // base64 data URL of digital signature
  signedAt: { type: Date },
  acknowledgedContent: { type: Boolean, default: false },
  acknowledgedAt: Date,
}, { timestamps: true });

// Plantilla de consentimiento precargada
const consentTemplateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true },
  purpose: { type: String, required: true },
  dataCategories: [{ type: String }],
  required: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  language: { type: String, default: 'es' },
  content: { type: String }, // HTML del formulario de consentimiento
}, { timestamps: true });

// Regla de seudonimización (Art. 30)
const pseudonymizationRuleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  databaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'DatabaseConnection' },
  databaseName: String,
  tableName: String,
  columnName: String,
  method: { type: String, enum: ['hash', 'uuid', 'sequential', 'mask', 'formatPreserving'], default: 'hash' },
  status: { type: String, enum: ['draft', 'active', 'executed', 'reverted'], default: 'draft' },
  executedAt: Date,
  revertedAt: Date,
  inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataInventory' },
}, { timestamps: true });

// Evaluación de Impacto de Protección de Datos — DPIA (Art. 14 quater / Art. 16 Ley 21.719)
const dpiaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: String,
  responsibleName: String,
  responsibleDept: String,
  processingPurpose: { type: String, required: true },
  dataCategories: [{ type: String }],
  dataSubjects: { type: String, enum: ['employees', 'customers', 'providers', 'candidates', 'users_web', 'minors', 'vulnerable', 'other'], default: 'customers' },
  sensitiveData: { type: Boolean, default: false },
  childrenData: { type: Boolean, default: false },
  largeScale: { type: Boolean, default: false },
  automatedDecisions: { type: Boolean, default: false },
  profiling: { type: Boolean, default: false },
  biometricData: { type: Boolean, default: false },
  geolocationData: { type: Boolean, default: false },
  videoSurveillance: { type: Boolean, default: false },
  crossBorderTransfer: { type: Boolean, default: false },
  vulnerableSubjects: { type: Boolean, default: false },
  systematicMonitoring: { type: Boolean, default: false },
  newTechnologies: { type: Boolean, default: false },
  legalBasis: { type: String, enum: ['consent', 'contract', 'legal_obligation', 'legitimate_interest', 'public_interest'], default: 'consent' },
  riskScore: { type: Number, min: 0, max: 100, default: 0 },
  riskLevel: { type: String, enum: ['not_assessed', 'low', 'medium', 'high', 'critical'], default: 'not_assessed' },
  riskJustification: String,
  mitigationMeasures: [{ type: String }],
  status: { type: String, enum: ['draft', 'in_review', 'approved', 'rejected', 'needs_revision'], default: 'draft' },
  approvedBy: String,
  approvedAt: Date,
  reviewDate: Date,
  inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataInventory' },
}, { timestamps: true });

const DataProtectionImpactAssessment = mongoose.model('DataProtectionImpactAssessment', dpiaSchema);

// Acuerdo de Tratamiento con Encargados — DPA (Art. 9 Ley 21.719)
const dpaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  processorName: { type: String, required: true },
  processorRut: String,
  processorContactName: String,
  processorEmail: { type: String },
  processorPhone: String,
  processorAddress: String,
  serviceDescription: { type: String, required: true },
  dataCategories: [{ type: String }],
  dataSubjects: { type: String, enum: ['employees', 'customers', 'providers', 'candidates', 'users_web', 'minors', 'vulnerable', 'other'], default: 'customers' },
  processingPurpose: { type: String, required: true },
  contractDate: { type: Date },
  expirationDate: Date,
  contractReference: String,
  securityMeasures: [{ type: String }],
  subProcessors: [{ name: String, purpose: String, authorized: { type: Boolean, default: false } }],
  internationalTransfer: { type: Boolean, default: false },
  transferCountry: String,
  transferGuarantees: String,
  status: { type: String, enum: ['active', 'expired', 'terminated', 'under_review', 'draft'], default: 'draft' },
  reviewDate: Date,
  notes: String,
}, { timestamps: true });

const DataProcessingAgreement = mongoose.model('DataProcessingAgreement', dpaSchema);

// Invitación de un solo uso para consentimiento o firma de capacitación (email / link / QR)
const complianceInviteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  kind: { type: String, enum: ['consent', 'training'], required: true },
  token: { type: String, required: true, unique: true, index: true },
  channel: { type: String, enum: ['email', 'link', 'qr'], default: 'link' },
  recipientEmail: String,
  recipientName: String,
  recipientRut: String,
  // Payload para consentimiento
  purpose: String,
  dataCategories: [{ type: String }],
  // Referencia para capacitación
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingRecord' },
  expiresAt: { type: Date, required: true },
  usedAt: Date,
  resultId: mongoose.Schema.Types.ObjectId, // DataConsent creado o TrainingRecord firmado
  sentAt: Date, // fecha de envío por email
}, { timestamps: true });

const ComplianceInvite = mongoose.model('ComplianceInvite', complianceInviteSchema);

const DataConsent = mongoose.model('DataConsent', consentSchema);
const DataInventory = mongoose.model('DataInventory', dataInventorySchema);
const BreachReport = mongoose.model('BreachReport', breachReportSchema);
const ComplianceConfig = mongoose.model('ComplianceConfig', complianceConfigSchema);
const TrainingRecord = mongoose.model('TrainingRecord', trainingSchema);
const ConsentTemplate = mongoose.model('ConsentTemplate', consentTemplateSchema);
const PseudonymizationRule = mongoose.model('PseudonymizationRule', pseudonymizationRuleSchema);

export { DataConsent, DataInventory, BreachReport, ComplianceConfig, TrainingRecord, ConsentTemplate, PseudonymizationRule, DataProtectionImpactAssessment, DataProcessingAgreement, ComplianceInvite, AuditLogDB as AuditLog };

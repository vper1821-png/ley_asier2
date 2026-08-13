import mongoose from 'mongoose';

const databaseConnectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  engine: {
    type: String,
    required: true,
    enum: [
      'postgresql', 'mysql', 'mariadb', 'mssql', 'oracle',
      'mongodb', 'couchdb',
      'redis', 'elasticsearch', 'sqlite',
      'cassandra', 'neo4j', 'clickhouse', 'influxdb',
      'firebase', 'dynamodb', 'bigquery',
    ],
  },
  host: { type: String, default: '' },
  port: { type: Number, default: null },
  database: { type: String, default: '' },
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  ssl: { type: Boolean, default: false },
  connectionString: { type: String, default: '' },
  status: {
    type: String,
    enum: ['disconnected', 'connecting', 'connected', 'testing', 'scanning', 'error'],
    default: 'disconnected',
  },
  lastConnected: { type: Date },
  isRemote: { type: Boolean, default: false },
  schedule: {
    reportEnabled: { type: Boolean, default: false },
    reportFormat: { type: String, enum: ['pdf', 'doc'], default: 'pdf' },
    lastReportGenerated: { type: Date },
  },
  metrics: {
    tablesCount: { type: Number, default: 0 },
    recordsCount: { type: Number, default: 0 },
    sizeBytes: { type: Number, default: 0 },
    lastScanned: { type: Date },
  },
  tables: [{
    table: { type: String },
    rows: { type: Number, default: 0 },
    encrypted: { type: Boolean, default: false },
    columns: [{
      name: { type: String },
      type: { type: String },
      nullable: { type: Boolean },
      primaryKey: { type: Boolean },
      isPersonal: { type: Boolean },
      category: { type: String },
    }],
    personalDataColumns: [String],
  }],
  agentId: { type: String },
  agentLastSeen: { type: Date },
  notifyEmail: { type: Boolean, default: false },
  notifyEmailRecipients: [{ type: String }],
  lastHealthCheck: { type: Date },
  healthCheckStatus: { type: String, enum: ['ok', 'unreachable', 'error'], default: 'ok' },
}, { timestamps: true });

databaseConnectionSchema.index({ userId: 1, engine: 1 });

const DatabaseConnection = mongoose.model('DatabaseConnection', databaseConnectionSchema);

export default DatabaseConnection;

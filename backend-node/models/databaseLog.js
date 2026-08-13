import mongoose from 'mongoose';

const databaseLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  databaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'DatabaseConnection', index: true },
  databaseName: { type: String },
  engine: { type: String, enum: ['postgresql', 'mysql', 'mariadb', 'mssql', 'oracle', 'mongodb', 'couchdb', 'redis', 'elasticsearch', 'sqlite', 'cassandra', 'neo4j', 'clickhouse', 'influxdb', 'firebase', 'dynamodb', 'bigquery', 'progress', 'other'], default: 'other' },
  operation: { type: String, enum: ['connect', 'disconnect', 'query', 'scan', 'test', 'schema_change', 'insert', 'update', 'delete', 'create_table', 'drop_table', 'alter_table', 'create_index', 'drop_index', 'backup', 'restore', 'error', 'other'], required: true },
  query: { type: String, maxlength: 10000 },
  tables: [String],
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'info' },
  status: { type: String, enum: ['success', 'error', 'warning'], default: 'success' },
  durationMs: { type: Number },
  rowsAffected: { type: Number },
  errorMessage: { type: String, maxlength: 2000 },
  ip: { type: String },
  source: { type: String, enum: ['agent', 'frontend', 'api', 'system'], default: 'frontend' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

databaseLogSchema.index({ userId: 1, createdAt: -1 });
databaseLogSchema.index({ databaseId: 1, createdAt: -1 });
databaseLogSchema.index({ severity: 1, createdAt: -1 });

const DatabaseLog = mongoose.model('DatabaseLog', databaseLogSchema);
export default DatabaseLog;

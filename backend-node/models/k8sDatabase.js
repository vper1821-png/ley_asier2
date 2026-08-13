import mongoose from 'mongoose';

const k8sDatabaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clusterId: { type: mongoose.Schema.Types.ObjectId, ref: 'K8sCluster', required: true },
  name: { type: String, required: true },
  engine: { type: String, required: true, enum: [
    'postgresql', 'mysql', 'mariadb', 'mssql', 'oracle',
    'mongodb', 'couchdb',
    'redis', 'memcached', 'etcd',
    'cassandra', 'scylla', 'hbase',
    'elasticsearch', 'opensearch', 'meilisearch', 'typesense',
    'influxdb', 'timescaledb', 'prometheus',
    'neo4j', 'dgraph', 'arangodb',
    'rabbitmq', 'kafka', 'nats',
    'cockroachdb', 'clickhouse', 'sqlite',
  ]},
  version: { type: String, default: 'latest' },
  namespace: { type: String, default: 'databases' },
  status: { type: String, default: 'provisioning', enum: ['provisioning', 'running', 'stopped', 'error', 'deleting'] },
  size: { type: String, default: 'small', enum: ['small', 'medium', 'large', 'custom'] },
  resources: {
    cpu: { type: String, default: '500m' },
    memory: { type: String, default: '1Gi' },
    storage: { type: String, default: '10Gi' },
    replicas: { type: Number, default: 1 },
  },
  connection: {
    host: String,
    port: Number,
    internalHost: String,
    internalPort: Number,
    database: String,
    username: String,
    password: { type: String },
    ssl: { type: Boolean, default: false },
    connectionString: String,
  },
  config: {
    helmChart: String,
    helmRepo: String,
    helmValues: mongoose.Schema.Types.Mixed,
    extraFlags: String,
  },
  backups: [{
    name: String,
    createdAt: Date,
    size: String,
    status: { type: String, default: 'completed' },
    s3Path: String,
  }],
  metrics: {
    cpu: Number,
    memory: Number,
    storageUsed: String,
    connections: Number,
    queriesPerSec: Number,
    uptime: Number,
  },
  error: String,
  lastProvisionedAt: Date,
}, { timestamps: true });

k8sDatabaseSchema.index({ userId: 1, clusterId: 1 });

export default mongoose.model('K8sDatabase', k8sDatabaseSchema);

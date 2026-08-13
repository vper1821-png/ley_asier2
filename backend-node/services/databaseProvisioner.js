import { execSSH, kubectl } from '../routes/k8s.js';
import K8sDatabase from '../models/k8sDatabase.js';

const DB_CATALOG = {
  // ═══ Relational (SQL) ═══
  postgresql: {
    name: 'PostgreSQL', category: 'sql', icon: 'elephant', defaultPort: 5432,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/postgresql',
    helmValues: (n, r) => `auth.database=${n},auth.username=${r.user},auth.password=${r.pass},primary.persistence.size=${r.storage},primary.resources.requests.cpu=${r.cpu},primary.resources.requests.memory=${r.memory}`,
    description: 'Base de datos relacional avanzada de código abierto',
    docsUrl: 'https://www.postgresql.org/docs/',
  },
  mysql: {
    name: 'MySQL', category: 'sql', icon: 'dolphin', defaultPort: 3306,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/mysql',
    helmValues: (n, r) => `auth.database=${n},auth.rootPassword=${r.pass},primary.persistence.size=${r.storage},primary.resources.requests.cpu=${r.cpu},primary.resources.requests.memory=${r.memory}`,
    description: 'Base de datos relacional más popular del mundo',
    docsUrl: 'https://dev.mysql.com/doc/',
  },
  mariadb: {
    name: 'MariaDB', category: 'sql', icon: 'seahorse', defaultPort: 3306,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/mariadb',
    helmValues: (n, r) => `auth.database=${n},auth.rootPassword=${r.pass},primary.persistence.size=${r.storage},primary.resources.requests.cpu=${r.cpu},primary.resources.requests.memory=${r.memory}`,
    description: 'Base de datos relacional, fork de MySQL',
    docsUrl: 'https://mariadb.com/docs/',
  },
  mssql: {
    name: 'SQL Server', category: 'sql', icon: 'windows', defaultPort: 1433,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/mssql',
    helmValues: (n, r) => `auth.saPassword=${r.pass},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory}`,
    description: 'Microsoft SQL Server (Express Edition)',
    docsUrl: 'https://learn.microsoft.com/sql/',
  },
  oracle: {
    name: 'Oracle XE', category: 'sql', icon: 'database', defaultPort: 1521,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/oracle',
    helmValues: (n, r) => `auth.database=${n},auth.password=${r.pass},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory}`,
    description: 'Oracle Database Express Edition',
    docsUrl: 'https://docs.oracle.com/en/database/',
  },
  cockroachdb: {
    name: 'CockroachDB', category: 'sql', icon: 'cockroach', defaultPort: 26257,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/cockroachdb',
    helmValues: (n, r) => `statefulset.replicas=${r.replicas},statefulset.resources.requests.cpu=${r.cpu},statefulset.resources.requests.memory=${r.memory},persistence.size=${r.storage}`,
    description: 'Base de datos SQL distribuida y escalable',
    docsUrl: 'https://www.cockroachlabs.com/docs/',
  },
  timescaledb: {
    name: 'TimescaleDB', category: 'sql', icon: 'clock', defaultPort: 5432,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/postgresql',
    helmValues: (n, r) => `auth.database=${n},auth.username=${r.user},auth.password=${r.pass},primary.persistence.size=${r.storage},primary.resources.requests.cpu=${r.cpu},primary.resources.requests.memory=${r.memory},image.debug=true,extensions.name=timescaledb`,
    description: 'PostgreSQL optimizado para series temporales',
    docsUrl: 'https://docs.timescale.com/',
  },
  clickhouse: {
    name: 'ClickHouse', category: 'sql', icon: 'click', defaultPort: 8123,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/clickhouse',
    helmValues: (n, r) => `shards=1,replicas=${r.replicas},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory}`,
    description: 'Base de datos analítica columnar de alto rendimiento',
    docsUrl: 'https://clickhouse.com/docs/',
  },
  sqlite: {
    name: 'SQLite', category: 'sql', icon: 'file', defaultPort: 0,
    helmChart: null,
    helmValues: null,
    manifest: (n, r) => ({
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: `sqlite-${n}`, labels: { app: `sqlite-${n}`, database: n, engine: 'sqlite' } },
      spec: {
        containers: [{
          name: 'sqlite', image: 'keinos/sqlite3:latest',
          command: ['sh', '-c', 'sleep infinity'],
          volumeMounts: [{ name: 'data', mountPath: '/data' }],
          resources: { requests: { cpu: r.cpu, memory: r.memory } },
        }],
        volumes: [{ name: 'data', persistentVolumeClaim: { claimName: `sqlite-${n}-pvc` } }],
      },
    }),
    pvc: (n, r) => ({
      apiVersion: 'v1', kind: 'PersistentVolumeClaim',
      metadata: { name: `sqlite-${n}-pvc` },
      spec: { accessModes: ['ReadWriteOnce'], resources: { requests: { storage: r.storage } } },
    }),
    service: (n) => ({
      apiVersion: 'v1', kind: 'Service',
      metadata: { name: `sqlite-${n}`, labels: { app: `sqlite-${n}` } },
      spec: { selector: { app: `sqlite-${n}` }, ports: [{ port: 3306, targetPort: 3306 }] },
    }),
    description: 'Base de datos SQL embebida ligera',
    docsUrl: 'https://sqlite.org/docs.html',
  },

  // ═══ Document (NoSQL) ═══
  mongodb: {
    name: 'MongoDB', category: 'nosql', icon: 'leaf', defaultPort: 27017,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/mongodb',
    helmValues: (n, r) => `auth.database=${n},auth.rootPassword=${r.pass},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},architecture=standalone`,
    description: 'Base de datos NoSQL orientada a documentos',
    docsUrl: 'https://www.mongodb.com/docs/',
  },
  couchdb: {
    name: 'CouchDB', category: 'nosql', icon: 'couch', defaultPort: 5984,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/couchdb',
    helmValues: (n, r) => `couchdbPassword=${r.pass},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory}`,
    description: 'Base de datos JSON con sync multi-dispositivo',
    docsUrl: 'https://docs.couchdb.org/',
  },

  // ═══ Key-Value ═══
  redis: {
    name: 'Redis', category: 'kv', icon: 'bolt', defaultPort: 6379,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/redis',
    helmValues: (n, r) => `auth.password=${r.pass},master.persistence.size=${r.storage},master.resources.requests.cpu=${r.cpu},master.resources.requests.memory=${r.memory},architecture=standalone`,
    description: 'Base de datos en memoria, caché y message broker',
    docsUrl: 'https://redis.io/docs/',
  },
  memcached: {
    name: 'Memcached', category: 'kv', icon: 'cube', defaultPort: 11211,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/memcached',
    helmValues: (n, r) => `resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},maxMemory=256`,
    description: 'Sistema de caché distribuido en memoria',
    docsUrl: 'https://memcached.org/documentation',
  },
  etcd: {
    name: 'etcd', category: 'kv', icon: 'hexagon', defaultPort: 2379,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/etcd',
    helmValues: (n, r) => `auth.rbac.rootPassword=${r.pass},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},replicaCount=${r.replicas}`,
    description: 'Almacén clave-valor distribuido y consistente',
    docsUrl: 'https://etcd.io/docs/',
  },

  // ═══ Wide-Column ═══
  cassandra: {
    name: 'Cassandra', category: 'wide-column', icon: 'cassandra', defaultPort: 9042,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/cassandra',
    helmValues: (n, r) => `dbUser.password=${r.pass},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},replicaCount=${r.replicas}`,
    description: 'Base de datos NoSQL distribuida de alto rendimiento',
    docsUrl: 'https://cassandra.apache.org/doc/',
  },
  scylla: {
    name: 'ScyllaDB', category: 'wide-column', icon: 'scylla', defaultPort: 9042,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/scylladb',
    helmValues: (n, r) => `persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},replicaCount=${r.replicas}`,
    description: 'Base de datos wide-column compatible con Cassandra, ultra rápida',
    docsUrl: 'https://docs.scylladb.com/',
  },

  // ═══ Search ═══
  elasticsearch: {
    name: 'Elasticsearch', category: 'search', icon: 'elastic', defaultPort: 9200,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/elasticsearch',
    helmValues: (n, r) => `persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},replicaCount=${r.replicas},esJavaOpts=-Xmx512m`,
    description: 'Motor de búsqueda y analítica distribuida',
    docsUrl: 'https://www.elastic.co/guide/',
  },
  opensearch: {
    name: 'OpenSearch', category: 'search', icon: 'search', defaultPort: 9200,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/opensearch',
    helmValues: (n, r) => `persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},replicaCount=${r.replicas}`,
    description: 'Motor de búsqueda open-source (fork de Elasticsearch)',
    docsUrl: 'https://opensearch.org/docs/',
  },
  meilisearch: {
    name: 'Meilisearch', category: 'search', icon: 'meili', defaultPort: 7700,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/meilisearch',
    helmValues: (n, r) => `persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},masterKey=${r.pass}`,
    description: 'Motor de búsqueda rápido y relevante',
    docsUrl: 'https://www.meilisearch.com/docs/',
  },
  typesense: {
    name: 'Typesense', category: 'search', icon: 'typesense', defaultPort: 8108,
    helmChart: null,
    manifest: (n, r) => ({
      apiVersion: 'apps/v1', kind: 'StatefulSet',
      metadata: { name: `typesense-${n}`, labels: { app: `typesense-${n}`, database: n, engine: 'typesense' } },
      spec: {
        replicas: r.replicas || 1,
        serviceName: `typesense-${n}`,
        selector: { matchLabels: { app: `typesense-${n}` } },
        template: {
          metadata: { labels: { app: `typesense-${n}` } },
          spec: {
            containers: [{
              name: 'typesense', image: 'typesense/typesense:26.0',
              args: ['--data-dir', '/data', '--api-key', r.pass, '--listen-port', '8108', '--enable-cors'],
              ports: [{ containerPort: 8108 }],
              volumeMounts: [{ name: 'data', mountPath: '/data' }],
              resources: { requests: { cpu: r.cpu, memory: r.memory } },
            }],
          },
        },
        volumeClaimTemplates: [{
          metadata: { name: 'data' },
          spec: { accessModes: ['ReadWriteOnce'], resources: { requests: { storage: r.storage } } },
        }],
      },
    }),
    service: (n) => ({
      apiVersion: 'v1', kind: 'Service',
      metadata: { name: `typesense-${n}`, labels: { app: `typesense-${n}` } },
      spec: { selector: { app: `typesense-${n}` }, ports: [{ port: 8108, targetPort: 8108, name: 'http' }] },
    }),
    description: 'Motor de búsqueda tipográfico rápido',
    docsUrl: 'https://typesense.org/docs/',
  },

  // ═══ Time-Series ═══
  influxdb: {
    name: 'InfluxDB', category: 'timeseries', icon: 'influx', defaultPort: 8086,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/influxdb',
    helmValues: (n, r) => `auth.admin.password=${r.pass},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory}`,
    description: 'Base de datos de series temporales optimizada',
    docsUrl: 'https://docs.influxdata.com/',
  },
  prometheus: {
    name: 'Prometheus', category: 'timeseries', icon: 'prometheus', defaultPort: 9090,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/prometheus',
    helmValues: (n, r) => `server.persistentVolume.size=${r.storage},server.resources.requests.cpu=${r.cpu},server.resources.requests.memory=${r.memory}`,
    description: 'Sistema de monitorización y alerta, base de datos TSDB',
    docsUrl: 'https://prometheus.io/docs/',
  },

  // ═══ Graph ═══
  neo4j: {
    name: 'Neo4j', category: 'graph', icon: 'neo4j', defaultPort: 7687,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/neo4j',
    helmValues: (n, r) => `auth.neo4j.password=${r.pass},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory}`,
    description: 'Base de datos orientada a grafos líder',
    docsUrl: 'https://neo4j.com/docs/',
  },
  dgraph: {
    name: 'Dgraph', category: 'graph', icon: 'dgraph', defaultPort: 8080,
    helmChart: null,
    manifest: (n, r) => ({
      apiVersion: 'apps/v1', kind: 'StatefulSet',
      metadata: { name: `dgraph-${n}`, labels: { app: `dgraph-${n}`, database: n, engine: 'dgraph' } },
      spec: {
        replicas: 1,
        serviceName: `dgraph-${n}`,
        selector: { matchLabels: { app: `dgraph-${n}` } },
        template: {
          metadata: { labels: { app: `dgraph-${n}` } },
          spec: {
            containers: [{
              name: 'zero', image: 'dgraph/dgraph:latest',
              args: ['dgraph', 'zero', '--my=dgraph-${n}-0:5080'],
              ports: [{ containerPort: 5080 }, { containerPort: 6080 }],
            }, {
              name: 'alpha', image: 'dgraph/dgraph:latest',
              args: ['dgraph', 'alpha', '--zero=dgraph-${n}-0:5080', '--security=whitelist=0.0.0.0/0'],
              ports: [{ containerPort: 8080 }, { containerPort: 9080 }],
              volumeMounts: [{ name: 'data', mountPath: '/dgraph' }],
              resources: { requests: { cpu: r.cpu, memory: r.memory } },
            }],
          },
        },
        volumeClaimTemplates: [{
          metadata: { name: 'data' },
          spec: { accessModes: ['ReadWriteOnce'], resources: { requests: { storage: r.storage } } },
        }],
      },
    }),
    service: (n) => ({
      apiVersion: 'v1', kind: 'Service',
      metadata: { name: `dgraph-${n}`, labels: { app: `dgraph-${n}` } },
      spec: {
        selector: { app: `dgraph-${n}` },
        ports: [
          { port: 8080, targetPort: 8080, name: 'http' },
          { port: 9080, targetPort: 9080, name: 'grpc' },
        ],
      },
    }),
    description: 'Base de datos de grafos distribuida',
    docsUrl: 'https://dgraph.io/docs/',
  },
  arangodb: {
    name: 'ArangoDB', category: 'graph', icon: 'arangodb', defaultPort: 8529,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/arangodb',
    helmValues: (n, r) => `auth.rootPassword=${r.pass},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory}`,
    description: 'Base de datos multi-modelo (documento, grafo, KV)',
    docsUrl: 'https://www.arangodb.com/docs/',
  },

  // ═══ Message Queue ═══
  rabbitmq: {
    name: 'RabbitMQ', category: 'message-queue', icon: 'rabbit', defaultPort: 5672,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/rabbitmq',
    helmValues: (n, r) => `auth.erlangCookie=${r.pass.slice(0,20)},auth.password=${r.pass},persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},replicaCount=${r.replicas}`,
    description: 'Message broker robusto (AMQP)',
    docsUrl: 'https://www.rabbitmq.com/documentation/',
  },
  kafka: {
    name: 'Kafka', category: 'message-queue', icon: 'kafka', defaultPort: 9092,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/kafka',
    helmValues: (n, r) => `persistence.size=${r.storage},resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},replicaCount=${r.replicas},provisioning.topics[0].name=${n},provisioning.topics[0].partitions=3`,
    description: 'Plataforma de streaming distribuido',
    docsUrl: 'https://kafka.apache.org/documentation/',
  },
  nats: {
    name: 'NATS', category: 'message-queue', icon: 'nats', defaultPort: 4222,
    helmChart: 'oci://registry-1.docker.io/bitnamicharts/nats',
    helmValues: (n, r) => `resources.requests.cpu=${r.cpu},resources.requests.memory=${r.memory},replicaCount=${r.replicas},cluster.enabled=true`,
    description: 'Message broker de alto rendimiento',
    docsUrl: 'https://docs.nats.io/',
  },
};

function sanitizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40);
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#_';
  let pass = '';
  for (let i = 0; i < 20; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

function getSizeResources(size) {
  const sizes = {
    small: { cpu: '500m', memory: '1Gi', storage: '10Gi', replicas: 1 },
    medium: { cpu: '1', memory: '4Gi', storage: '50Gi', replicas: 2 },
    large: { cpu: '4', memory: '16Gi', storage: '200Gi', replicas: 3 },
  };
  return sizes[size] || sizes.small;
}

async function ensureNamespace(sshClient, namespace) {
  const nsCheck = await sshClient.execCommand(`kubectl get namespace ${namespace} --ignore-not-found -o name`);
  if (!nsCheck.stdout.trim()) {
    await sshClient.execCommand(`kubectl create namespace ${namespace}`);
  }
}

async function deployWithHelm(cluster, catalogEntry, dbName, dbPass, size, namespace) {
  const resources = getSizeResources(size);
  const values = catalogEntry.helmValues(dbName, { ...resources, user: 'admin', pass: dbPass });
  const chart = catalogEntry.helmChart;

  await execSSH(cluster, `helm repo add bitnami https://charts.bitnami.com/bitnami 2>/dev/null; helm repo update 2>/dev/null`, 30000);

  const cmd = `helm upgrade --install ${dbName} ${chart} --namespace ${namespace} --create-namespace --wait --timeout 10m ` +
    values.split(',').map(v => `--set ${v}`).join(' ') +
    ` --set fullnameOverride=${dbName}`;

  const result = await execSSH(cluster, cmd, 600000);
  if (result.stderr && result.stderr.toLowerCase().includes('error')) {
    throw new Error(result.stderr.slice(0, 500));
  }
  return result.stdout;
}

async function deployWithManifest(cluster, catalogEntry, dbName, dbPass, size, namespace) {
  const resources = getSizeResources(size);

  await ensureNamespace(await import('../routes/k8s.js').then(m => m.connectSSH(cluster)), namespace);

  // Apply PVC if defined
  if (catalogEntry.pvc) {
    const pvcYaml = catalogEntry.pvc(dbName, resources);
    const tmpFile = `/tmp/${dbName}-pvc.yaml`;
    await execSSH(cluster, `cat > ${tmpFile} << 'EOF'\n${JSON.stringify(pvcYaml)}\nEOF\nkubectl apply -f ${tmpFile} -n ${namespace}`, 15000);
  }

  // Apply main manifest
  const manifest = catalogEntry.manifest(dbName, { ...resources, pass: dbPass });
  const tmpFile2 = `/tmp/${dbName}-manifest.yaml`;
  await execSSH(cluster, `cat > ${tmpFile2} << 'EOF'\n${JSON.stringify(manifest)}\nEOF\nkubectl apply -f ${tmpFile2} -n ${namespace}`, 15000);

  // Apply service if defined
  if (catalogEntry.service) {
    const svc = catalogEntry.service(dbName);
    const tmpFile3 = `/tmp/${dbName}-svc.yaml`;
    await execSSH(cluster, `cat > ${tmpFile3} << 'EOF'\n${JSON.stringify(svc)}\nEOF\nkubectl apply -f ${tmpFile3} -n ${namespace}`, 15000);
  }

  // Wait for readiness
  await execSSH(cluster, `kubectl wait --for=condition=ready pod -l app=${dbName} -n ${namespace} --timeout=180s`, 180000).catch(() => {});
  return `Database ${dbName} deployed via manifests`;
}

export function getCatalog() {
  return Object.entries(DB_CATALOG).map(([key, val]) => ({
    id: key, name: val.name, category: val.category, icon: val.icon,
    defaultPort: val.defaultPort, description: val.description, docsUrl: val.docsUrl,
    hasHelm: !!val.helmChart,
  }));
}

export function getEngine(engineId) {
  return DB_CATALOG[engineId] || null;
}

export async function provisionDatabase(cluster, engineId, dbName, opts = {}) {
  const engine = DB_CATALOG[engineId];
  if (!engine) throw new Error(`Engine not supported: ${engineId}`);

  const safeName = sanitizeName(dbName);
  const dbPass = opts.password || generatePassword();
  const size = opts.size || 'small';
  const namespace = opts.namespace || 'databases';

  const dbRecord = await K8sDatabase.create({
    userId: cluster.userId,
    clusterId: cluster._id,
    name: safeName,
    engine: engineId,
    size,
    namespace,
    resources: getSizeResources(size),
    status: 'provisioning',
    connection: {
      port: engine.defaultPort,
      database: safeName,
      username: 'admin',
      password: dbPass,
    },
    config: {
      helmChart: engine.helmChart,
      helmValues: typeof engine.helmValues === 'function' ? engine.helmValues(safeName, { ...getSizeResources(size), pass: dbPass }) : '',
    },
  });

  try {
    let result;
    if (engine.helmChart) {
      result = await deployWithHelm(cluster, engine, safeName, dbPass, size, namespace);
    } else if (engine.manifest) {
      result = await deployWithManifest(cluster, engine, safeName, dbPass, size, namespace);
    } else {
      throw new Error(`No deployment method for ${engineId}`);
    }

    // Get the service details to find actual host/port
    let svcInfo = '';
    try {
      const svcResult = await execSSH(cluster, `kubectl get svc ${safeName} -n ${namespace} -o json`, 10000);
      if (svcResult.stdout) {
        const svc = JSON.parse(svcResult.stdout);
        svcInfo = svc.spec.clusterIP || '';
        dbRecord.connection.internalHost = svc.spec.clusterIP || `${safeName}.${namespace}.svc.cluster.local`;
        dbRecord.connection.internalPort = svc.spec.ports?.[0]?.port || engine.defaultPort;
        dbRecord.connection.host = cluster.sshHost;
      }
    } catch {}

    if (!dbRecord.connection.internalHost) {
      dbRecord.connection.internalHost = `${safeName}.${namespace}.svc.cluster.local`;
      dbRecord.connection.internalPort = engine.defaultPort;
      dbRecord.connection.host = cluster.sshHost;
    }

    dbRecord.connection.connectionString = buildConnectionString(engineId, dbRecord.connection, safeName);
    dbRecord.status = 'running';
    dbRecord.lastProvisionedAt = new Date();
    await dbRecord.save();

    return dbRecord;
  } catch (e) {
    dbRecord.status = 'error';
    dbRecord.error = e.message;
    await dbRecord.save();
    throw e;
  }
}

function buildConnectionString(engine, conn, dbName) {
  const p = conn.password ? encodeURIComponent(conn.password) : '';
  const h = conn.host || 'localhost';
  const port = conn.port || 5432;
  const user = conn.username || 'admin';

  const map = {
    postgresql:    `postgresql://${user}:${p}@${h}:${port}/${dbName}`,
    mysql:         `mysql://${user}:${p}@${h}:${port}/${dbName}`,
    mariadb:       `mariadb://${user}:${p}@${h}:${port}/${dbName}`,
    mssql:         `sqlserver://${user}:${p}@${h}:${port};database=${dbName}`,
    oracle:        `oracle://${user}:${p}@${h}:${port}/${dbName}`,
    mongodb:       `mongodb://${user}:${p}@${h}:${port}/${dbName}`,
    couchdb:       `http://${user}:${p}@${h}:${port}`,
    redis:         `redis://:${p}@${h}:${port}/0`,
    memcached:     `${h}:${port}`,
    etcd:          `http://${h}:${port}`,
    cassandra:     `cassandra://${user}:${p}@${h}:${port}/${dbName}`,
    scylla:        `cassandra://${user}:${p}@${h}:${port}/${dbName}`,
    elasticsearch: `http://${h}:${port}`,
    opensearch:    `http://${h}:${port}`,
    meilisearch:   `http://${h}:${port}`,
    typesense:     `http://${h}:${port}`,
    influxdb:      `http://${h}:${port}`,
    prometheus:    `http://${h}:${port}`,
    neo4j:         `bolt://${user}:${p}@${h}:${port}`,
    dgraph:        `http://${h}:8080`,
    arangodb:      `http://${user}:${p}@${h}:${port}`,
    rabbitmq:      `amqp://${user}:${p}@${h}:${port}`,
    kafka:         `${h}:${port}`,
    nats:          `nats://${h}:${port}`,
    cockroachdb:   `postgresql://${user}:${p}@${h}:${port}/${dbName}?sslmode=disable`,
    timescaledb:   `postgresql://${user}:${p}@${h}:${port}/${dbName}`,
    clickhouse:    `http://${h}:${port}`,
    sqlite:        `/data/${dbName}.db`,
  };
  return map[engine] || `${engine}://${h}:${port}`;
}

export async function deleteDatabase(cluster, dbRecord) {
  const namespace = dbRecord.namespace || 'databases';
  const name = dbRecord.name;
  const engine = getEngine(dbRecord.engine);

  try {
    if (engine?.helmChart) {
      await execSSH(cluster, `helm uninstall ${name} -n ${namespace}`, 60000);
    } else {
      await execSSH(cluster, `kubectl delete all -l app=${name} -n ${namespace} --ignore-not-found`, 30000);
      await execSSH(cluster, `kubectl delete pvc -l app=${name} -n ${namespace} --ignore-not-found`, 15000);
    }
    await execSSH(cluster, `kubectl delete namespace ${namespace} --ignore-not-found`, 15000);
  } catch {}

  dbRecord.status = 'deleting';
  await dbRecord.save();
  await K8sDatabase.deleteOne({ _id: dbRecord._id });
  return true;
}

export async function getDatabaseStatus(cluster, dbRecord) {
  try {
    const namespace = dbRecord.namespace || 'databases';
    const name = dbRecord.name;
    const podResult = await execSSH(cluster, `kubectl get pod -l app=${name} -n ${namespace} -o json 2>/dev/null || kubectl get pod -l app.kubernetes.io/instance=${name} -n ${namespace} -o json`, 15000);
    if (podResult.stdout) {
      const pods = JSON.parse(podResult.stdout);
      const ready = pods.items?.filter(p => p.status?.phase === 'Running' || p.status?.phase === 'Succeeded').length || 0;
      const total = pods.items?.length || 0;
      return { ready, total, pods: pods.items?.map(p => ({ name: p.metadata.name, status: p.status?.phase, node: p.spec?.nodeName })) || [] };
    }
    return { ready: 0, total: 0, pods: [] };
  } catch {
    return { ready: 0, total: 0, pods: [], error: 'Cannot reach cluster' };
  }
}

export default { getCatalog, getEngine, provisionDatabase, deleteDatabase, getDatabaseStatus };

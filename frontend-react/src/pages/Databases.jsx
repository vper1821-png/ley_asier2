import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import * as api from '../api/api';
import InfoTooltip from '../components/InfoTooltip';

const I = {
  database: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>,
  plus: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  trash: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  check: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  xmark: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  search: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  play: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  download: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  clock: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  alert: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
  arrowLeft: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>,
};

const DB_ENGINES = [
  { value: 'postgresql', label: 'PostgreSQL', category: 'SQL', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { value: 'mysql', label: 'MySQL', category: 'SQL', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { value: 'mariadb', label: 'MariaDB', category: 'SQL', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { value: 'mssql', label: 'SQL Server', category: 'SQL', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { value: 'oracle', label: 'Oracle', category: 'SQL', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { value: 'mongodb', label: 'MongoDB', category: 'NoSQL', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { value: 'couchdb', label: 'CouchDB', category: 'NoSQL', color: 'text-red-300', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  { value: 'redis', label: 'Redis', category: 'KV', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { value: 'elasticsearch', label: 'Elasticsearch', category: 'Search', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { value: 'sqlite', label: 'SQLite', category: 'SQL', color: 'text-text-muted', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  { value: 'cassandra', label: 'Cassandra', category: 'NoSQL', color: 'text-blue-300', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { value: 'neo4j', label: 'Neo4j', category: 'Graph', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { value: 'clickhouse', label: 'ClickHouse', category: 'SQL', color: 'text-yellow-300', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  { value: 'influxdb', label: 'InfluxDB', category: 'Time Series', color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { value: 'firebase', label: 'Firebase', category: 'NoSQL', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { value: 'dynamodb', label: 'DynamoDB', category: 'NoSQL', color: 'text-orange-300', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  { value: 'bigquery', label: 'BigQuery', category: 'SQL', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
];

const ENGINE_META = DB_ENGINES.reduce((acc, e) => { acc[e.value] = e; return acc; }, {});

const ENGINE_CDN = {
  postgresql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
  mysql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
  mariadb: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mariadb/mariadb-original.svg',
  mongodb: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
  redis: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
  sqlite: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg',
  elasticsearch: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elasticsearch/elasticsearch-original.svg',
  couchdb: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchdb/couchdb-original.svg',
  mssql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-original.svg',
  oracle: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/oracle/oracle-original.svg',
  cassandra: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cassandra/cassandra-original.svg',
  neo4j: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/neo4j/neo4j-original.svg',
};

function EngineLogo({ engine, size = 'md' }) {
  const meta = ENGINE_META[engine];
  const s = size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const src = ENGINE_CDN[engine];
  if (src) {
    const p = size === 'lg' ? 'p-2' : 'p-1.5';
    return (
      <span className={`inline-flex items-center justify-center ${s} ${p} rounded-lg ${meta?.bg || 'bg-bg-elevated'} flex-shrink-0`}>
        <img src={src} alt={engine} className="w-full h-full object-contain" />
      </span>
    );
  }
  if (!meta) return <span className={`${s} rounded-lg bg-bg-elevated flex items-center justify-center`}><svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg></span>;
  return (
    <span className={`inline-flex items-center justify-center ${s} rounded-lg ${meta.bg} ${meta.color} font-bold text-[10px]`}>
      {engine.slice(0, 2).toUpperCase()}
    </span>
  );
}

function EngineBadge({ engine }) {
  const meta = ENGINE_META[engine];
  if (!meta) return <span className="text-[11px] text-text-muted">{engine}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium ${meta.bg} ${meta.color} ${meta.border}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-50" />
      {meta.label}
    </span>
  );
}

const STATUS_STYLES = {
  connected: 'text-emerald-400 bg-emerald-500/10',
  disconnected: 'text-red-400 bg-red-500/10',
  error: 'text-orange-400 bg-orange-500/10',
  maintenance: 'text-yellow-400 bg-yellow-500/10',
};

function StatCard({ icon, label, value, color = '#e4e4e7', sub }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-text-muted">{icon}</span>
        <span className="text-[10px] text-text-subtle font-medium uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-[26px] font-bold leading-none tracking-tight" style={{ color }}>{value ?? '-'}</p>
      {sub && <p className="text-[10px] text-text-subtle mt-2">{sub}</p>}
    </div>
  );
}

function NewDatabaseForm({ onBack, onCreated }) {
  const { token } = useAuth();
  const { addToast: showToast } = useToast();
  const [form, setForm] = useState({ name: '', engine: 'postgresql', host: '', port: '', database: '', username: '', password: '', ssl: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.connectDatabase(token, form);
      if (res?.success) {
        showToast('success', 'Base de datos conectada');
        onCreated();
      } else {
        showToast('error', res?.error || 'Error al conectar');
      }
    } catch {
      showToast('error', 'Error al conectar');
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="sticky top-0 z-30 bg-bg-base border-b border-white/[0.04] flex-shrink-0 px-3 md:px-6 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">{I.arrowLeft}</button>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <span className="w-8 h-8 rounded-lg w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-accent">{I.plus}</span>
          <div>
            <h2 className="text-[12px] md:text-[13px] font-semibold text-white tracking-tight">Nueva Base de Datos</h2>
            <p className="text-[9px] md:text-[10px] text-text-muted">Conecta una nueva base de datos</p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 md:p-6 max-w-lg space-y-3">
        <div>
          <label className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-1.5 block">Nombre</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-white/[0.04] bg-white/[0.015] text-[12px] text-text-body rounded-lg px-3 py-2.5 placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle" />
        </div>
        <div>
          <label className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-1.5 block">Motor</label>
          <select value={form.engine} onChange={e => setForm(f => ({ ...f, engine: e.target.value }))}
            className="w-full rounded-xl border border-white/[0.04] bg-white/[0.015] text-[12px] text-text-body rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle appearance-none cursor-pointer">
            {DB_ENGINES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-1.5 block">Host</label>
            <input value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} placeholder="localhost"
              className="w-full rounded-xl border border-white/[0.04] bg-white/[0.015] text-[12px] text-text-body rounded-lg px-3 py-2.5 placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle" />
          </div>
          <div>
            <label className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-1.5 block">Puerto</label>
            <input value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} placeholder="5432"
              className="w-full rounded-xl border border-white/[0.04] bg-white/[0.015] text-[12px] text-text-body rounded-lg px-3 py-2.5 placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-1.5 block">Base de datos</label>
          <input value={form.database} onChange={e => setForm(f => ({ ...f, database: e.target.value }))}
            className="w-full rounded-xl border border-white/[0.04] bg-white/[0.015] text-[12px] text-text-body rounded-lg px-3 py-2.5 placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-1.5 block">Usuario</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.04] bg-white/[0.015] text-[12px] text-text-body rounded-lg px-3 py-2.5 placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle" />
          </div>
          <div>
            <label className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-1.5 block">Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.04] bg-white/[0.015] text-[12px] text-text-body rounded-lg px-3 py-2.5 placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.ssl} onChange={e => setForm(f => ({ ...f, ssl: e.target.checked }))}
            className="w-3.5 h-3.5 rounded bg-bg-panel border-border-theme text-primary-500 focus:ring-primary-500/30" />
          <span className="text-[11px] text-text-muted">Usar SSL <InfoTooltip text="Cifra la conexión con la base de datos mediante SSL/TLS." placement="right" /></span>
        </label>
        <button type="submit" className="w-full py-2.5 rounded-lg bg-primary-500/10 text-accent hover:bg-accent-subtle transition-colors text-[12px] font-medium border border-accent-border">
          Conectar Base de Datos <InfoTooltip text="Guarda y establece la conexión con la base de datos." placement="left" />
        </button>
      </form>
    </div>
  );
}

function DatabaseDetail({ db, onBack }) {
  const { token } = useAuth();
  const { addToast: showToast } = useToast();

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="sticky top-0 z-30 bg-bg-base border-b border-white/[0.04] flex-shrink-0 px-3 md:px-6 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">{I.arrowLeft}</button>
        <EngineLogo engine={db.engine} size="lg" />
        <div>
          <h2 className="text-[12px] md:text-[13px] font-semibold text-white tracking-tight">{db.name}</h2>
          <p className="text-[9px] md:text-[10px] text-text-muted">{db.host || db.url || '—'}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 md:p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 space-y-3">
            <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest">Información</p>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between py-2 border-b border-border-theme/20"><span className="text-text-muted">Motor</span><EngineBadge engine={db.engine} /></div>
              <div className="flex justify-between py-2 border-b border-border-theme/20"><span className="text-text-muted">Estado</span><span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${STATUS_STYLES[db.status] || 'text-text-muted bg-gray-500/10'}`}>{db.status || 'unknown'} <InfoTooltip text="Indica si la base de datos está conectada o no." placement="left" /></span></div>
              <div className="flex justify-between py-2 border-b border-border-theme/20"><span className="text-text-muted">Host</span><span className="text-text-body">{db.host || '—'}</span></div>
              <div className="flex justify-between py-2 border-b border-border-theme/20"><span className="text-text-muted">Puerto</span><span className="text-text-body">{db.port || '—'}</span></div>
              <div className="flex justify-between py-2 border-b border-border-theme/20"><span className="text-text-muted">Usuario</span><span className="text-text-body">{db.user || '—'}</span></div>
              <div className="flex justify-between py-2 border-b border-border-theme/20"><span className="text-text-muted">SSL</span><span className={db.ssl ? 'text-emerald-400' : 'text-text-muted'}>{db.ssl ? 'Sí' : 'No'}</span></div>
              <div className="flex justify-between py-2"><span className="text-text-muted">Creada</span><span className="text-text-body">{db.createdAt ? new Date(db.createdAt).toLocaleDateString() : '—'}</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 space-y-3">
            <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest">Acciones</p>
            <div className="space-y-2">
              <button onClick={async () => {
                try {
                  const res = await api.testDatabaseConnection(token, db._id);
                  if (res?.error) showToast('error', res.error);
                  else showToast('success', res?.message || 'Conexión exitosa');
                } catch {
                  showToast('error', 'Error al probar conexión');
                }
              }} className="w-full py-2 rounded-lg bg-bg-elevated text-text-body hover:bg-bg-elevated border border-border-theme/25 transition-colors text-[11px] font-medium">
                Probar Conexión <InfoTooltip text="Verifica que la conexión a la base de datos funciona correctamente." placement="left" />
              </button>
              <button onClick={async () => {
                try {
                  const res = await api.scanDatabase(token, db._id);
                  showToast(res?.success ? 'success' : 'error', res?.message || 'Escaneo iniciado');
                } catch {
                  showToast('error', 'Error al escanear base de datos');
                }
              }} className="w-full py-2 rounded-lg bg-bg-elevated text-text-body hover:bg-bg-elevated border border-border-theme/25 transition-colors text-[11px] font-medium">
                Escanear Base de Datos <InfoTooltip text="Inicia un escaneo automático para detectar datos personales." placement="left" />
              </button>
              <button onClick={async () => {
                try {
                  const newStatus = db.status === 'connected' ? 'disconnected' : 'connected';
                  const res = await api.updateDatabase(token, db._id, { status: newStatus });
                  if (res?.success) showToast('success', newStatus === 'connected' ? 'Conectado' : 'Desconectado');
                  else showToast('error', res?.error || 'Error');
                } catch {
                  showToast('error', 'Error al cambiar estado de conexión');
                }
              }} className="w-full py-2 rounded-lg bg-bg-elevated text-text-body hover:bg-bg-elevated border border-border-theme/25 transition-colors text-[11px] font-medium">
                {db.status === 'connected' ? 'Desconectar' : 'Conectar'} <InfoTooltip text={db.status === 'connected' ? 'Cierra la conexión activa con la base.' : 'Abre una conexión a la base de datos.'} placement="left" />
              </button>
              <button onClick={async () => {
                try {
                  const res = await api.deleteDatabase(token, db._id);
                  if (res?.success) { showToast('success', 'Eliminada'); onBack(); }
                  else showToast('error', res?.error || 'Error');
                } catch {
                  showToast('error', 'Error al eliminar base de datos');
                }
              }} className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors text-[11px] font-medium">
                Eliminar Base de Datos <InfoTooltip text="Elimina permanentemente esta conexión de la base de datos." placement="left" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Databases() {
  const { user, token } = useAuth();
  const { addToast: showToast } = useToast();
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDb, setSelectedDb] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const loadDatabases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listDatabases(token);
      if (res?.connections) setDatabases(res.connections);
      else if (res?.databases) setDatabases(res.databases);
    } catch {
      showToast('error', 'Error al cargar bases de datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDatabases(); }, [loadDatabases]);

  const handleDelete = async (dbId) => {
    try {
      const res = await api.deleteDatabase(token, dbId);
      if (res?.success) {
        showToast('success', 'Base de datos eliminada');
        loadDatabases();
      } else {
        showToast('error', res?.error || 'Error al eliminar');
      }
    } catch {
      showToast('error', 'Error al eliminar');
    }
  };

  const handleToggleConnection = async (db) => {
    try {
      const newStatus = db.status === 'connected' ? 'disconnected' : 'connected';
      const res = await api.updateDatabase(token, db._id, { status: newStatus });
      if (res?.success) {
        showToast('success', newStatus === 'connected' ? 'Conectado' : 'Desconectado');
        loadDatabases();
      } else {
        showToast('error', res?.error || 'Error');
      }
    } catch {
      showToast('error', 'Error al cambiar estado de conexión');
    }
  };

  if (showNewForm) {
    return <NewDatabaseForm onBack={() => setShowNewForm(false)} onCreated={() => { setShowNewForm(false); loadDatabases(); }} />;
  }

  if (selectedDb) {
    return <DatabaseDetail db={selectedDb} onBack={() => setSelectedDb(null)} />;
  }

  const filtered = databases.filter(db =>
    !search || db.name?.toLowerCase().includes(search.toLowerCase()) || db.engine?.toLowerCase().includes(search.toLowerCase())
  );

  const addFormats = { database: 'Base de datos', url: 'URL de conexión', string: 'Cadena de conexión' };
  const connected = databases.filter(d => d.status === 'connected').length;
  const errored = databases.filter(d => d.status === 'error').length;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="flex-shrink-0 border-b border-white/[0.04] bg-bg-base sticky top-0 z-40">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
              </div>
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Gestión de datos</p>
                <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">Bases de Datos</h1>
              </div>
            </div>
            <p className="text-[11px] text-text-muted md:ml-auto md:mr-4">{databases.length} registradas · {connected} conectadas · {errored} con error</p>
            <button onClick={() => setShowNewForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.25)] transition-all tour-detail-1">
              {I.plus} Nueva Base de Datos
            </button>
          </div>
        </div>
      </header>

      <div className="flex-shrink-0 w-full px-4 md:px-8 py-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: I.database, label: 'Total Bases', value: databases.length, color: '#94a3b8', tip: 'Número total de bases de datos registradas.' },
            { icon: I.check, label: 'Conectadas', value: connected, color: '#34d399', tip: 'Bases de datos con conexión activa y operativa.' },
            { icon: I.alert, label: 'Errores', value: errored, color: errored > 0 ? '#f87171' : '#34d399', tip: 'Bases de datos con errores de conexión detectados.' },
            { icon: I.clock, label: 'Desconectadas', value: databases.filter(d => d.status === 'disconnected').length, color: '#9ca3af', tip: 'Bases de datos desconectadas o inactivas.' },
          ].map((card, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 hover:border-white/[0.08] hover:bg-white/[0.025] transition-all duration-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: card.color, backgroundColor: `${card.color}15` }}>{card.icon}</div>
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest">{card.label}</p>
                </div>
                <InfoTooltip text={card.tip} placement="bottom" />
              </div>
              <p className="text-[26px] font-bold leading-none" style={{ color: card.color }}>{card.value ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 w-full px-4 md:px-8 pb-5">
        <div className="relative max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle">{I.search}</span>
          <input type="text" placeholder="Buscar base de datos..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-base border border-white/[0.04] text-text-heading rounded-xl pl-9 pr-4 py-2 text-[12px] placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full px-4 md:px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <span className="w-12 h-12 rounded-2xl border border-white/[0.04] bg-white/[0.01]/25 flex items-center justify-center mb-3">{I.database}</span>
            <p className="text-[13px]">No hay bases de datos</p>
            <p className="text-[11px] text-text-subtle mt-1">Agrega una nueva base de datos para empezar</p>
          </div>
        ) : (
          <div className="space-y-2 tour-detail-2">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 pb-2 text-[10px] font-medium text-text-muted uppercase tracking-wider">
              <div className="col-span-4">Base de datos</div>
              <div className="col-span-2">Motor</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-3">Detalles</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>
            {filtered.map(db => (
              <div key={db._id}
                className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-4 py-3 hover:bg-white/[0.03] hover:border-white/[0.08] transition-all group cursor-pointer"
                onClick={() => setSelectedDb(db)}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <EngineLogo engine={db.engine} />
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-medium text-text-heading truncate group-hover:text-accent transition-colors">{db.name}</h3>
                      <p className="text-[10px] text-text-subtle font-mono mt-0.5 truncate">{db.host || db.url || '—'}{db.port ? `:${db.port}` : ''}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <EngineBadge engine={db.engine} />
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[db.status] || 'text-text-muted bg-gray-500/10'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full bg-current ${db.status === 'connected' ? 'animate-pulse' : ''}`} />
                      {db.status || 'unknown'}
                    </span>
                  </div>
                  <div className="col-span-3 flex flex-wrap items-center gap-2 text-[10px] text-text-subtle">
                    {db.user && <span>Usuario: {db.user}</span>}
                    {addFormats[db.addFormat] && <span>{addFormats[db.addFormat]}</span>}
                    {db.createdAt && <span>Creada: {new Date(db.createdAt).toLocaleDateString()}</span>}
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleToggleConnection(db)}
                      title={db.status === 'connected' ? 'Desconectar' : 'Conectar'}
                      className={`p-2 rounded-lg transition-colors ${
                        db.status === 'connected' ? 'text-text-muted hover:text-red-400 hover:bg-red-500/10' : 'text-text-muted hover:text-emerald-400 hover:bg-emerald-500/10'
                      }`}>
                      {db.status === 'connected' ? I.xmark : I.play}
                    </button>
                    <button onClick={() => handleDelete(db._id)} title="Eliminar"
                      className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      {I.trash}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

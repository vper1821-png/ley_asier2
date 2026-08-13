import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import { useI18n } from '../i18n/context';

const I = {
  search: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  xmark: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  arrowLeft: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>,
  arrowRight: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>,
  alert: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
  database: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>,
  play: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  trash: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  check: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  bolt: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  link: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
  code: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>,
  fileText: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  clock: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};

const SEVERITY_STYLES = {
  critical: 'text-red-400 bg-red-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  low: 'text-blue-400 bg-blue-500/10',
  info: 'text-text-muted bg-gray-500/10',
};

const OP_META = {
  connect: { icon: I.link, label: 'Conexión' },
  disconnect: { icon: I.bolt, label: 'Desconexión' },
  query: { icon: I.code, label: 'Consulta' },
  scan: { icon: I.search, label: 'Escaneo' },
  test: { icon: I.play, label: 'Prueba' },
  insert: { icon: I.fileText, label: 'Inserción' },
  update: { icon: I.fileText, label: 'Actualización' },
  delete: { icon: I.trash, label: 'Eliminación' },
  create_table: { icon: I.database, label: 'Crear Tabla' },
  drop_table: { icon: I.trash, label: 'Eliminar Tabla' },
  alter_table: { icon: I.database, label: 'Modificar Tabla' },
  error: { icon: I.alert, label: 'Error' },
};

const ENGINE_BG = {
  postgresql: 'bg-blue-500/10 text-blue-400',
  mysql: 'bg-orange-500/10 text-orange-400',
  mariadb: 'bg-cyan-500/10 text-cyan-400',
  mssql: 'bg-red-500/10 text-red-400',
  mongodb: 'bg-emerald-500/10 text-emerald-400',
  redis: 'bg-red-500/10 text-red-500',
  sqlite: 'bg-gray-500/10 text-text-muted',
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

export default function DatabaseLogs() {
  const { token } = useAuth();
  const { t, lang } = useI18n();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: '', engine: '', operation: '', status: '', search: '' });
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [showSkippedPopup, setShowSkippedPopup] = useState(false);
  const [skippedQueries, setSkippedQueries] = useState([]);
  const [loadingSkipped, setLoadingSkipped] = useState(false);

  async function handleSkipQuery(query, e) {
    e.stopPropagation();
    try {
      await api.skipDbLogQuery(token, query);
      setActionMsg('Consulta omitida de futuros registros');
    } catch {
      setActionMsg('Error al omitir consulta');
    }
    setTimeout(() => setActionMsg(null), 2000);
  }

  async function handleDeleteByQuery(query, e) {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar todos los registros con esta consulta?')) return;
    try {
      const res = await api.deleteDbLogsByQuery(token, query);
      if (res?.deleted > 0) {
        setActionMsg(`${res.deleted} registro(s) eliminado(s)`);
        loadLogs(offset);
        loadStats();
      }
    } catch {
      setActionMsg('Error al eliminar registros');
    }
    setTimeout(() => setActionMsg(null), 2000);
  }

  const loadLogs = useCallback(async (o = 0) => {
    setLoading(true);
    try {
      const res = await api.getDbLogs(token, { ...filters, limit, offset: o });
      if (res?.logs) { setLogs(res.logs); setTotal(res.total); setOffset(o); }
    } catch {
      setLogs([]);
      setTotal(0);
    }
    setLoading(false);
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.getDbLogStats(token);
      if (res?.bySeverity) setStats(res);
    } catch {}
  }, []);

  useEffect(() => { loadLogs(); loadStats(); }, [loadLogs, loadStats]);

  const filterOptions = [
    { key: 'severity', label: t('dbLogs.severity'), options: ['', 'critical', 'high', 'medium', 'low', 'info'] },
    { key: 'operation', label: t('dbLogs.operation'), options: ['', 'connect', 'disconnect', 'query', 'scan', 'test', 'insert', 'update', 'delete', 'create_table', 'drop_table', 'alter_table', 'error'] },
    { key: 'status', label: t('dbLogs.status'), options: ['', 'success', 'error', 'warning'] },
  ];

  const severityCounts = stats?.bySeverity?.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}) || {};
  const errorsCount = (severityCounts.critical || 0) + (severityCounts.high || 0);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="flex-shrink-0 border-b border-white/[0.04] bg-bg-base sticky top-0 z-40">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Auditoría de bases de datos</p>
                <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">Registro de Actividad</h1>
              </div>
            </div>
            <p className="text-[11px] text-text-muted md:ml-auto md:mr-4">{total} registros de operaciones en bases de datos</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {actionMsg && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg animate-pulse">
                  {I.check} {actionMsg}
                </span>
              )}
              {stats?.recentErrors?.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg">
                  {I.alert} {stats.recentErrors.length} errores
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {stats && (
        <div className="flex-shrink-0 w-full px-4 md:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: I.database, label: 'Total Registros', value: total > 100000 ? '100000+' : total, color: '#94a3b8', sub: 'Todas las operaciones' },
              { icon: I.alert, label: 'Errores', value: errorsCount > 100000 ? '100000+' : errorsCount, color: errorsCount > 0 ? '#f87171' : '#34d399', sub: 'Critical + High' },
              { icon: I.check, label: 'Éxitos', value: severityCounts.low > 100000 ? '100000+' : (severityCounts.low || 0), color: '#34d399', sub: 'Operaciones exitosas' },
              { icon: I.clock, label: 'Info', value: severityCounts.info > 100000 ? '100000+' : (severityCounts.info || 0), color: '#60a5fa', sub: 'Registros informativos' },
            ].map((card, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 hover:border-white/[0.08] hover:bg-white/[0.025] transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: card.color, backgroundColor: `${card.color}15` }}>{card.icon}</div>
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest">{card.label}</p>
                </div>
                <p className="text-[26px] font-bold leading-none" style={{ color: card.color }}>{card.value ?? 0}</p>
                <p className="text-[10px] text-text-subtle mt-1.5">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-shrink-0 w-full px-4 md:px-8 pb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[160px] md:min-w-[260px] max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle">{I.search}</span>
          <input type="text" placeholder="Buscar en logs..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full bg-bg-base border border-white/[0.04] text-text-heading rounded-xl pl-9 pr-4 py-2 text-[12px] placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map(fo => (
            <select key={fo.key} value={filters[fo.key]} onChange={e => setFilters(f => ({ ...f, [fo.key]: e.target.value }))}
              className="bg-bg-base border border-white/[0.04] text-text-body rounded-xl px-3.5 py-2 text-[12px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all cursor-pointer">
              {fo.options.map(o => <option key={o} value={o}>{o || `Todos ${fo.label}`}</option>)}
            </select>
          ))}
        </div>
        <button onClick={() => { loadLogs(0); loadStats(); }} className="px-3 py-2 rounded-xl text-text-muted hover:text-text-heading bg-bg-base border border-white/[0.04] hover:border-white/[0.08] transition-colors">{I.search}</button>
        <button onClick={async () => {
          setLoadingSkipped(true); setShowSkippedPopup(true);
          try {
            const res = await api.getSkippedDbLogQueries(token);
            setSkippedQueries(res?.queries || []);
          } catch {
            setSkippedQueries([]);
          }
          setLoadingSkipped(false);
        }} className="px-3 py-2 text-[11px] font-medium rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors">
          Gestionar omitidas
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full px-4 md:px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <span className="w-12 h-12 rounded-2xl border border-white/[0.04] bg-white/[0.01]/25 flex items-center justify-center mb-3">{I.database}</span>
            <p className="text-[13px]">No hay registros de actividad</p>
            <p className="text-[11px] text-text-subtle mt-1">Las operaciones en bases de datos aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => {
              const op = OP_META[log.operation] || { icon: I.database, label: log.operation };
              return (
                <div key={log._id} onClick={() => setSelectedLog(log)}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-4 py-3 hover:bg-white/[0.03] hover:border-white/[0.08] transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      log.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                      log.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                      log.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                      log.status === 'error' ? 'bg-red-500/10 text-red-400' :
                      'bg-bg-elevated text-text-muted'
                    }`}>
                      {op.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[13px] font-medium text-text-heading group-hover:text-accent transition-colors">{op.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${SEVERITY_STYLES[log.severity] || ''}`}>
                          {log.severity}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          log.status === 'success' ? 'text-emerald-400 bg-emerald-500/10' :
                          log.status === 'error' ? 'text-red-400 bg-red-500/10' :
                          log.status === 'warning' ? 'text-yellow-400 bg-yellow-500/10' :
                          'text-text-muted bg-gray-500/10'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        {log.databaseName && (
                          <span className="text-[11px] text-text-body">{log.databaseName}</span>
                        )}
                        {log.engine && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${ENGINE_BG[log.engine] || 'text-text-muted bg-gray-500/10'}`}>
                            {log.engine}
                          </span>
                        )}
                      </div>
                      {log.query && (
                        <div className="mt-1">
                          <code className="text-[11px] text-blue-300 bg-bg-base border border-border-theme/20 px-3 py-1.5 rounded-lg block overflow-x-auto whitespace-pre-wrap max-h-16 font-mono">
                            {log.query}
                          </code>
                        </div>
                      )}
                      {log.tables?.length > 0 && (
                        <div className="mt-1.5 flex gap-1.5 flex-wrap">
                          {log.tables.map(t => (
                            <span key={t} className="text-[9px] text-text-muted bg-bg-elevated px-2 py-0.5 rounded-lg">{t}</span>
                          ))}
                        </div>
                      )}
                      {log.operation === 'scan' && log.metadata && (
                        <div className="mt-1.5 flex gap-2 flex-wrap text-[10px]">
                          {log.metadata.totalTables != null && (
                            <span className="text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded-lg">
                              {log.metadata.totalTables} tablas
                            </span>
                          )}
                          {log.metadata.personalDataColumns > 0 && (
                            <span className="text-red-400 bg-red-500/5 px-2 py-0.5 rounded-lg">
                              {log.metadata.personalDataColumns} datos personales
                            </span>
                          )}
                          {log.metadata.encryptedTables != null && (
                            <span className="text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-lg">
                              {log.metadata.encryptedTables} cifradas
                            </span>
                          )}
                          {log.metadata.unencryptedTables > 0 && (
                            <span className="text-yellow-400 bg-yellow-500/5 px-2 py-0.5 rounded-lg">
                              {log.metadata.unencryptedTables} sin cifrar
                            </span>
                          )}
                        </div>
                      )}
                      {log.errorMessage && (
                        <div className="mt-1 text-[11px] text-red-400 bg-red-500/5 px-3 py-1.5 rounded-lg">{log.errorMessage}</div>
                      )}
                      {log.query && (
                        <div className="mt-2 flex gap-1.5">
                          <button onClick={(e) => handleSkipQuery(log.query, e)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-gray-500/10 text-text-muted hover:bg-blue-500/20 hover:text-blue-400 transition-colors">
                            Omitir esta consulta
                          </button>
                          <button onClick={(e) => handleDeleteByQuery(log.query, e)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-gray-500/10 text-text-muted hover:bg-red-500/20 hover:text-red-400 transition-colors">
                            Eliminar todas iguales
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-text-subtle mt-2">
                        <span>{new Date(log.createdAt).toLocaleString(lang === 'en' ? 'en' : 'es')}</span>
                        {log.durationMs != null && <span className="font-mono">{log.durationMs}ms</span>}
                        {log.rowsAffected != null && <span>{log.rowsAffected} filas</span>}
                        {log.ip && <span className="font-mono">{log.ip}</span>}
                        {log.source && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-lg font-medium ${
                            log.source === 'frontend' ? 'text-cyan-400 bg-cyan-500/10' : 'text-text-muted bg-gray-500/10'
                          }`}>{log.source}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showSkippedPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowSkippedPopup(false)}>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] rounded-xl w-full max-w-[540px] mx-4 max-h-[70vh] overflow-y-auto shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-bg-panel z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <h3 className="text-[14px] font-semibold text-text-heading">Consultas omitidas</h3>
              <button onClick={() => setShowSkippedPopup(false)} className="p-1 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-4 space-y-2">
              {loadingSkipped ? (
                <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
              ) : skippedQueries.length === 0 ? (
                <p className="text-[13px] text-text-muted text-center py-8">No hay consultas omitidas</p>
              ) : skippedQueries.map((q, i) => (
                <div key={i} className="flex items-start gap-2 bg-bg-base/60 border border-border-theme/40 rounded-lg p-3">
                  <pre className="flex-1 text-[11px] text-blue-300 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed min-w-0">{q}</pre>
                  <button onClick={async () => {
                    try {
                      await api.revokeSkippedDbLogQuery(token, q);
                      setSkippedQueries(prev => prev.filter(x => x !== q));
                      setActionMsg('Consulta restaurada — ya no se omitirá');
                      setTimeout(() => setActionMsg(null), 2000);
                    } catch {}
                  }} className="flex-shrink-0 text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors">
                    Revocar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {total > limit && (
        <div className="flex-shrink-0 px-3 md:px-6 py-3 flex items-center justify-between text-[11px] border-t border-white/[0.04]">
          <span className="text-text-muted">{offset + 1}-{Math.min(offset + limit, total)} de {total}</span>
          <div className="flex gap-2">
            <button disabled={offset <= 0} onClick={() => loadLogs(Math.max(0, offset - limit))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg rounded-xl border border-white/[0.04] bg-white/[0.015] text-text-body disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-elevated transition-colors text-[11px]">
              {I.arrowLeft} Anterior
            </button>
            <button disabled={offset + limit >= total} onClick={() => loadLogs(offset + limit)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg rounded-xl border border-white/[0.04] bg-white/[0.015] text-text-body disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-elevated transition-colors text-[11px]">
              Siguiente {I.arrowRight}
            </button>
          </div>
        </div>
      )}

      {selectedLog && (() => {
        const op = OP_META[selectedLog.operation] || { icon: I.database, label: selectedLog.operation };
        const fields = [
          { label: 'ID de Evento', value: selectedLog._id, mono: true },
          { label: 'Operación', value: op.label },
          { label: 'Severidad', value: selectedLog.severity },
          { label: 'Estado', value: selectedLog.status },
          { label: 'Base de Datos', value: selectedLog.databaseName || '—' },
          { label: 'Motor', value: selectedLog.engine || '—' },
          { label: 'Usuario', value: selectedLog.user || '—' },
          { label: 'IP Origen', value: selectedLog.ip || '—' },
          { label: 'Fuente', value: selectedLog.source || '—' },
          { label: 'Duración', value: selectedLog.durationMs != null ? `${selectedLog.durationMs}ms` : '—' },
          { label: 'Filas Afectadas', value: selectedLog.rowsAffected != null ? String(selectedLog.rowsAffected) : '—' },
          { label: 'Fecha', value: new Date(selectedLog.createdAt).toLocaleString(lang === 'en' ? 'en' : 'es') },
        ];
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] rounded-xl w-full max-w-[640px] mx-4 max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-bg-panel z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.04] rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedLog.severity === 'critical' ? 'bg-red-500/15 text-red-400' :
                    selectedLog.severity === 'high' ? 'bg-orange-500/15 text-orange-400' :
                    selectedLog.severity === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                    selectedLog.status === 'error' ? 'bg-red-500/15 text-red-400' :
                    'bg-bg-elevated text-text-muted'
                  }`}>{op.icon}</div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-text-heading">{op.label}</h3>
                    <p className="text-[11px] text-text-muted">
                      {new Date(selectedLog.createdAt).toLocaleString(lang === 'en' ? 'en' : 'es')}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-bg-base/60 border border-border-theme/50 rounded-lg overflow-hidden">
                  <div className="divide-y divide-surface-700/40">
                    {fields.map((f, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[11px] text-text-muted font-medium">{f.label}</span>
                        <span className={`text-[12px] ${f.mono ? 'text-cyan-400 font-mono' : 'text-gray-200'} text-right max-w-[60%] truncate`}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedLog.query && (
                  <div>
                    <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider mb-2">Consulta SQL</p>
                    <pre className="text-[12px] text-blue-300 font-mono bg-bg-base/80 border border-border-theme/50 rounded-lg p-4 whitespace-pre-wrap overflow-x-auto leading-relaxed">{selectedLog.query}</pre>
                    <div className="mt-3 flex gap-2">
                      <button onClick={(e) => { handleSkipQuery(selectedLog.query, e); setSelectedLog(null); }}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors">
                        Omitir esta consulta
                      </button>
                      <button onClick={(e) => { handleDeleteByQuery(selectedLog.query, e); setSelectedLog(null); }}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors">
                        Eliminar todas iguales
                      </button>
                    </div>
                  </div>
                )}

                {selectedLog.tables?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider mb-2">Tablas Afectadas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLog.tables.map(t => (
                        <span key={t} className="text-[11px] text-text-body border border-white/[0.04] bg-white/[0.01]/50 px-3 py-1 rounded-lg font-mono">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLog.errorMessage && (
                  <div>
                    <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-2">Mensaje de Error</p>
                    <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/15 rounded-lg p-4">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0 mt-0.5">{I.alert}</div>
                      <div>
                        <p className="text-[12px] text-red-300 font-medium mb-1">Error en la operación</p>
                        <p className="text-[12px] text-red-400/80 font-mono whitespace-pre-wrap">{typeof selectedLog.errorMessage === 'object' ? JSON.stringify(selectedLog.errorMessage, null, 2) : selectedLog.errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider mb-2">Metadatos Adicionales</p>
                    <pre className="text-[11px] text-text-muted font-mono bg-bg-base/80 border border-border-theme/50 rounded-lg p-4 whitespace-pre-wrap overflow-x-auto leading-relaxed">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button onClick={() => setSelectedLog(null)}
                    className="px-5 py-2 rounded-lg text-[12px] font-medium bg-bg-elevated text-text-body hover:bg-bg-elevated hover:text-text-heading border border-border-theme/25 transition-colors">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

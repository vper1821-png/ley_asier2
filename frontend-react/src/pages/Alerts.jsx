import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import * as api from '../api/api';
import InfoTooltip from '../components/InfoTooltip';

const SEVERITY_CONFIG = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', dot: 'bg-red-500', border: 'border-red-500/20', pulse: true },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', border: 'border-orange-500/20', pulse: false },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', dot: 'bg-amber-500', border: 'border-amber-500/20', pulse: false },
  low: { color: 'text-blue-500', bg: 'bg-blue-500/10', dot: 'bg-blue-500', border: 'border-blue-500/20', pulse: false },
  info: { color: 'text-text-muted', bg: 'bg-text-muted/10', dot: 'bg-text-muted', border: 'border-text-muted/20', pulse: false },
};

const I = {
  bell: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  shield: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  check: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  search: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  refresh: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  alert: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
};

function stripEmoji(str) {
  if (!str) return '';
  return str.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();
}

function timeAgo(dateStr, t) {
  if (!dateStr) return '\u2014';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return t('alerts.justNow');
  if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('alerts.minutes')} ${t('alerts.ago')}`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('alerts.hours')} ${t('alerts.ago')}`;
  return `${Math.floor(diff / 86400000)}${t('alerts.days')} ${t('alerts.ago')}`;
}

function StatCard({ icon, label, value, color = 'var(--text-heading)', sub }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-panel p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-text-muted">{icon}</span>
        <span className="text-[10px] text-text-subtle font-medium uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-[24px] font-bold leading-none tracking-tight" style={{ color }}>{value ?? '-'}</p>
      {sub && <p className="text-[10px] text-text-subtle mt-2 font-medium">{sub}</p>}
    </div>
  );
}

export default function Alerts() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [resolving, setResolving] = useState(false);
  const pollRef = useRef(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveType, setResolveType] = useState('');

  const activeAlerts = alerts.filter(a => a.status === 'active');

  const [filters, setFilters] = useState({
    severity: 'all',
    status: 'all',
    search: '',
    sort: 'newest',
    limit: 50,
  });

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    const [alertsRes, statsRes] = await Promise.all([
      api.getAlerts(token, filters),
      api.getAlertStats(token),
    ]);
    if (!alertsRes.error) {
      const raw = Array.isArray(alertsRes) ? alertsRes : alertsRes.alerts || [];
      const seen = new Set();
      setAlerts(raw.filter(a => { const k = a._id || a.id; if (seen.has(k)) return false; seen.add(k); return true; }));
    }
    if (!statsRes.error) setStats(statsRes);
    setLoading(false);
  }, [token, filters]);

  useEffect(() => {
    setLoading(true);
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    pollRef.current = setInterval(fetchAlerts, 15000);
    return () => clearInterval(pollRef.current);
  }, [fetchAlerts]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setSelected(new Set());
  };

  const clearFilters = () => {
    setFilters({ severity: 'all', status: 'all', search: '', sort: 'newest', limit: 50 });
    setSelected(new Set());
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === alerts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(alerts.map(a => a._id || a.id)));
    }
  };

  const openResolveModal = (id) => {
    setResolveModal(id);
    setResolveNotes('');
    setResolveType('');
  };

  const confirmResolve = async () => {
    if (!resolveModal || !resolveType) return;
    setResolving(true);
    const res = await api.resolveAlert(token, resolveModal, { resolvedType: resolveType, notes: resolveNotes });
    if (!res.error) {
      setResolveModal(null);
      fetchAlerts();
    }
    setResolving(false);
  };

  const dismissSingle = async (id) => {
    const res = await api.dismissAlert(token, id);
    if (!res.error) fetchAlerts();
  };

  const resolveBulk = async () => {
    if (selected.size === 0) return;
    setResolving(true);
    const res = await api.resolveBulkAlerts(token, Array.from(selected));
    if (!res.error) {
      setSelected(new Set());
      fetchAlerts();
    }
    setResolving(false);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="flex-shrink-0 border-b border-white/[0.04] bg-bg-base sticky top-0 z-40">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              </div>
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Centro de seguridad</p>
                <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">{t('alerts.title')}</h1>
              </div>
            </div>
            <p className="text-[11px] text-text-muted md:ml-auto md:mr-4">
              {activeAlerts.length > 0
                ? <><span className="text-red-400 font-semibold">{activeAlerts.length}</span> alertas activas · Actualiza cada 15s</>
                : t('alerts.noAlerts')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {selected.size > 0 && (
                <button onClick={resolveBulk} disabled={resolving}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5">
                  <svg className={`w-3.5 h-3.5 ${resolving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('alerts.bulkResolve')} ({selected.size})
                </button>
              )}
              <button onClick={fetchAlerts} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme hover:border-white/[0.08] transition-all">
                {I.refresh} Refrescar
              </button>
            </div>
          </div>
        </div>
      </header>

      {stats && (
        <div className="flex-shrink-0 w-full px-4 md:px-8 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: I.bell, label: t('alerts.total'), value: stats.total, color: '#94a3b8', tip: 'Total de alertas generadas en el sistema.' },
              { icon: I.alert, label: t('alerts.activeAlerts'), value: stats.active, color: '#f87171', tip: 'Alertas que requieren atención inmediata.' },
              { icon: I.check, label: t('alerts.resolvedAlerts'), value: stats.resolved, color: '#34d399', tip: 'Alertas que ya fueron atendidas.' },
              { icon: I.alert, label: t('alerts.criticalAlerts'), value: stats.critical, color: '#ef4444', tip: 'Alertas de severidad crítica activas.' },
              { icon: I.shield, label: t('alerts.high'), value: stats.high, color: '#fb923c', tip: 'Alertas de alta severidad activas.' },
            ].map((card, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 hover:border-white/[0.08] hover:bg-white/[0.025] transition-all duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-wrap items-center gap-2">
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
      )}

      <div className="flex-shrink-0 w-full px-4 md:px-8 pb-5 flex items-center gap-3 flex-wrap tour-detail-2">
        <div className="relative flex-1 min-w-[160px] md:min-w-[260px] max-w-md w-full">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={filters.search} onChange={e => handleFilterChange('search', e.target.value)}
            placeholder={t('alerts.search')}
            className="w-full bg-bg-base border border-white/[0.04] text-text-heading rounded-xl pl-9 pr-4 py-2 text-[12px] placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filters.severity} onChange={e => handleFilterChange('severity', e.target.value)}
            className="flex-1 sm:flex-none min-w-0 bg-bg-base border border-white/[0.04] text-text-body rounded-xl px-3.5 py-2 text-[12px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all cursor-pointer">
            <option value="all">{t('alerts.severity')}: {t('alerts.all')}</option>
            {['critical', 'high', 'medium', 'low', 'info'].map(s => (
              <option key={s} value={s}>{t(`alerts.${s}`)}</option>
            ))}
          </select>
          <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
            className="flex-1 sm:flex-none min-w-0 bg-bg-base border border-white/[0.04] text-text-body rounded-xl px-3.5 py-2 text-[12px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all cursor-pointer">
            <option value="all">{t('alerts.status')}: {t('alerts.all')}</option>
            <option value="active">{t('alerts.active')}</option>
            <option value="resolved">{t('alerts.resolved')}</option>
            <option value="dismissed">{t('alerts.dismissed')}</option>
          </select>
          <select value={filters.sort} onChange={e => handleFilterChange('sort', e.target.value)}
            className="flex-1 sm:flex-none min-w-0 bg-bg-base border border-white/[0.04] text-text-body rounded-xl px-3.5 py-2 text-[12px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all cursor-pointer">
            <option value="newest">{t('alerts.newest')}</option>
            <option value="oldest">{t('alerts.oldest')}</option>
          </select>
          {(filters.severity !== 'all' || filters.status !== 'all' || filters.search || filters.sort !== 'newest') && (
            <button onClick={clearFilters} className="text-[11px] text-text-muted hover:text-text-heading transition-colors px-3 py-2 rounded-xl bg-bg-base border border-white/[0.04] hover:border-white/[0.08] font-medium">
              {t('alerts.clearFilters')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full px-4 md:px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-border-subtle bg-bg-panel p-8">
            <div className="w-14 h-14 rounded-2xl border border-border-subtle bg-bg-elevated flex items-center justify-center mb-4 shadow-inner">
              <svg className="w-6 h-6 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-text-muted">{t('alerts.noAlerts')}</p>
          </div>
        ) : (
          <div className="space-y-2 tour-detail-1">
            <div className="flex items-center gap-3 px-2 py-1">
              <button onClick={toggleSelectAll}
                className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                  selected.size === alerts.length ? 'bg-accent' :
                  selected.size > 0 ? 'bg-accent/30' :
                  'bg-bg-elevated hover:bg-bg-panel border border-border-theme'
                }`}>
                {(selected.size === alerts.length || selected.size > 0) && (
                  <svg className="w-2.5 h-2.5 text-text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-[11px] text-text-subtle font-semibold uppercase tracking-wider">
                {selected.size > 0 ? `${selected.size} seleccionadas` : t('alerts.selectAll')}
              </span>
            </div>

            {alerts.map(alert => {
              const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
              const isSelected = selected.has(alert._id || alert.id);
              const title = stripEmoji(alert.title);
              const message = stripEmoji(alert.message);

              return (
                <div key={alert._id || alert.id}
                  className={`rounded-lg border px-4 py-3 transition-all cursor-pointer group ${
                    alert.status === 'active'
                      ? isSelected
                        ? 'bg-white/[0.03] border-accent/30'
                        : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]'
                      : 'bg-white/[0.01] border-white/[0.03] opacity-50 hover:opacity-80'
                  }`}
                  onClick={() => alert.status === 'active' && toggleSelect(alert._id || alert.id)}>
                  <div className="flex items-start gap-4">
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(alert._id || alert.id); }}
                      className={`w-4 h-4 rounded mt-2.5 flex-shrink-0 flex items-center justify-center transition-all ${
                        isSelected ? 'bg-accent' : 'bg-bg-elevated hover:bg-bg-panel border border-border-theme'
                      }`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center border ${sev.border} ${sev.bg} ${sev.color}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5">
                        <p className={`text-[13px] font-medium truncate ${alert.status === 'active' ? 'text-text-heading group-hover:text-accent transition-colors' : 'text-text-muted'}`}>
                          {title}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${sev.color} ${sev.bg} ${sev.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot} ${sev.pulse && alert.status === 'active' ? 'animate-pulse' : ''}`} />
                            {t(`alerts.${alert.severity}`) || alert.severity}
                          </span>
                          {alert.status !== 'active' && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                              alert.status === 'resolved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-text-muted bg-text-muted/10 border-text-muted/20'
                            }`}>
                              {t(`alerts.${alert.status}`)}
                            </span>
                          )}
                        </div>
                      </div>
                      {message && (
                        <p className="text-[11px] text-text-muted mt-1 leading-relaxed line-clamp-1">{message}</p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-text-subtle">
                          <span>{timeAgo(alert.createdAt, t)}</span>
                          {alert.source && <span className="text-text-muted">Fuente: {alert.source}</span>}
                          {alert.category && <span className="text-text-muted">{alert.category}</span>}
                          {alert.resolvedAt && (
                            <span className="text-emerald-400/80">{t('alerts.resolved')} {timeAgo(alert.resolvedAt, t)}</span>
                          )}
                        </div>
                        {alert.status === 'active' && (
                          <div className="flex items-center gap-1.5">
                            <button onClick={(e) => { e.stopPropagation(); openResolveModal(alert._id || alert.id); }}
                              className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                              {I.check} {t('alerts.resolve')}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); dismissSingle(alert._id || alert.id); }}
                              title={t('alerts.dismissed')}
                              className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
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

      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-theme rounded-2xl w-full max-w-[420px] mx-4 shadow-theme overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
                  {I.check}
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-text-heading">Resolver Alerta</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">Describe cómo se resolvió este incidente de seguridad.</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[11px] text-text-muted font-semibold uppercase tracking-wider mb-2 block">Tipo de resolución</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'confirmed', label: 'Confirmado', desc: 'Amenaza real mitigada' },
                    { value: 'false_positive', label: 'Falso positivo', desc: 'No era una amenaza real' },
                    { value: 'accepted', label: 'Riesgo aceptado', desc: 'Se acepta el riesgo' },
                    { value: 'patched', label: 'Parcheado', desc: 'Se aplicó corrección' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setResolveType(opt.value)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        resolveType === opt.value
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-text-heading'
                          : 'bg-bg-panel border-border-subtle text-text-muted hover:border-border-theme'
                      }`}>
                      <p className="text-[11px] font-semibold">{opt.label}</p>
                      <p className="text-[9px] text-text-subtle mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-text-muted font-semibold uppercase tracking-wider mb-2 block">Notas (opcional)</label>
                <textarea value={resolveNotes} onChange={e => setResolveNotes(e.target.value)}
                  placeholder="Describe los pasos tomados para resolver..."
                  rows={3}
                  className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-2.5 text-[12px] text-text-heading placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle transition-all resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border-subtle bg-bg-panel/40">
              <button onClick={() => setResolveModal(null)}
                className="px-4 py-2 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-subtle hover:border-border-theme transition-all">
                Cancelar
              </button>
              <button onClick={confirmResolve} disabled={!resolveType || resolving}
                className="px-4 py-2 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {resolving ? <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : I.check}
                {resolving ? 'Resolviendo...' : 'Resolver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

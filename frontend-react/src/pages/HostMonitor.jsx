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

const EVENT_TYPE_CONFIG = {
  web_access: {
    color: 'text-text-body', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  },
  process_connection: {
    color: 'text-text-body', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
  },
  config_change: {
    color: 'text-text-body', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
  },
  windows_event: {
    color: 'text-text-body', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
  },
};

const I = {
  shield: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  globe: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>,
  process: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>,
  cog: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756 3.35 0a1.724 1.724 0 002.573-1.066c1.543.94 3.31-.826 2.37-2.37a1.724 1.724 0 001.065-2.572c1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 00-1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  refresh: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  search: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
};

function stripEmoji(str) {
  if (!str) return '';
  return str.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();
}

function timeAgo(dateStr, t) {
  if (!dateStr) return '\u2014';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return t('hostMonitor.justNow');
  if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('hostMonitor.minutes')} ${t('hostMonitor.ago')}`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('hostMonitor.hours')} ${t('hostMonitor.ago')}`;
  return `${Math.floor(diff / 86400000)}${t('hostMonitor.days')} ${t('hostMonitor.ago')}`;
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

export default function HostMonitor() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const pollRef = useRef(null);

  const [filters, setFilters] = useState({
    severity: 'all',
    eventType: 'all',
    search: '',
    limit: 50,
    offset: 0,
  });

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    const [eventsRes, statsRes] = await Promise.all([
      api.getHostEvents(token, filters),
      api.getHostMonitorStats(token),
    ]);
    if (!eventsRes.error) {
      const raw = Array.isArray(eventsRes) ? eventsRes : eventsRes.events || [];
      setEvents(raw);
    }
    if (!statsRes.error) {
      const byType = statsRes.byType || {};
      setStats({
        total: statsRes.total ?? 0,
        webAccess: byType.web_access ?? 0,
        processConnections: byType.process_connection ?? 0,
        configChanges: byType.config_change ?? 0,
      });
    }
    setLoading(false);
  }, [token, filters]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    pollRef.current = setInterval(fetchEvents, 15000);
    return () => clearInterval(pollRef.current);
  }, [fetchEvents]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
    setExpanded(new Set());
  };

  const clearFilters = () => {
    setFilters({ severity: 'all', eventType: 'all', search: '', limit: 50, offset: 0 });
    setExpanded(new Set());
  };

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="flex-shrink-0 border-b border-white/[0.04] bg-bg-base sticky top-0 z-40">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Monitoreo de infraestructura</p>
                <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">Eventos del Host</h1>
              </div>
            </div>
            <p className="text-[11px] text-text-muted md:ml-auto md:mr-4">{stats?.total ?? 0} eventos capturados · Actualiza cada 15s</p>
            <button onClick={fetchEvents} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme hover:border-white/[0.08] transition-all">
              {I.refresh} Refrescar
            </button>
          </div>
        </div>
      </header>

      {stats && (
        <div className="flex-shrink-0 w-full px-4 md:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 tour-detail-2">
            {[
              { icon: I.shield, label: t('hostMonitor.totalEvents'), value: stats.total ?? stats.totalEvents ?? 0, color: '#94a3b8', tip: 'Total de eventos capturados en el período seleccionado.' },
              { icon: I.globe, label: t('hostMonitor.webAccess'), value: stats.webAccess ?? 0, color: '#a855f7', tip: 'Conexiones HTTP/HTTPS detectadas en el servidor.' },
              { icon: I.process, label: t('hostMonitor.processConnections'), value: stats.processConnections ?? 0, color: '#06b6d4', tip: 'Conexiones de procesos entre servicios detectadas.' },
              { icon: I.cog, label: t('hostMonitor.configChanges'), value: stats.configChanges ?? 0, color: '#f59e0b', tip: 'Modificaciones de configuración del sistema.' },
            ].map((card, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 hover:border-white/[0.08] hover:bg-white/[0.025] transition-all duration-200 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: card.color, backgroundColor: `${card.color}15` }}>{card.icon}</div>
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest">{card.label}</p>
                  </div>
                  <InfoTooltip text={card.tip} placement="bottom" />
                </div>
                <p className="text-[26px] font-bold leading-none" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-shrink-0 w-full px-4 md:px-8 pb-5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px] md:min-w-[260px] max-w-md w-full">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={filters.search} onChange={e => handleFilterChange('search', e.target.value)}
            placeholder={t('hostMonitor.search')}
            className="w-full bg-bg-base border border-white/[0.04] text-text-heading rounded-xl pl-9 pr-4 py-2 text-[12px] placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filters.severity} onChange={e => handleFilterChange('severity', e.target.value)}
            className="flex-1 sm:flex-none min-w-0 bg-bg-base border border-white/[0.04] text-text-body rounded-xl px-3.5 py-2 text-[12px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all cursor-pointer">
            <option value="all">{t('hostMonitor.allSeverities')}</option>
            {['critical', 'high', 'medium', 'low', 'info'].map(s => (
              <option key={s} value={s}>{t(`hostMonitor.${s}`)}</option>
            ))}
          </select>
          <select value={filters.eventType} onChange={e => handleFilterChange('eventType', e.target.value)}
            className="flex-1 sm:flex-none min-w-0 bg-bg-base border border-white/[0.04] text-text-body rounded-xl px-3.5 py-2 text-[12px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all cursor-pointer">
            <option value="all">{t('hostMonitor.allTypes')}</option>
            <option value="web_access">{t('hostMonitor.webAccessLabel')}</option>
            <option value="process_connection">{t('hostMonitor.processConnection')}</option>
            <option value="config_change">{t('hostMonitor.configChange')}</option>
            <option value="windows_event">{t('hostMonitor.windowsEvent')}</option>
          </select>
          {(filters.severity !== 'all' || filters.eventType !== 'all' || filters.search) && (
            <button onClick={clearFilters} className="text-[11px] text-text-muted hover:text-text-heading transition-colors px-3 py-2 rounded-xl bg-bg-base border border-white/[0.04] hover:border-white/[0.08] font-medium">
              {t('hostMonitor.clearFilters')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full px-4 md:px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-border-subtle bg-bg-panel p-8">
            <div className="w-14 h-14 rounded-2xl border border-border-subtle bg-bg-elevated flex items-center justify-center mb-4 shadow-inner">
              <svg className="w-6 h-6 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-text-muted">{t('hostMonitor.noEvents')}</p>
            <p className="text-[11px] text-text-subtle mt-1">{t('hostMonitor.noEventsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2 tour-detail-1">
            {events.map(event => {
              const sev = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
              const evtType = EVENT_TYPE_CONFIG[event.eventType || event.type] || { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, color: 'text-text-muted', bg: 'bg-text-muted/10', border: 'border-text-muted/20' };
              const eventId = event._id || event.id;
              const isExpanded = expanded.has(eventId);
              const title = stripEmoji(event.title);
              const detail = stripEmoji(event.detail || event.message || '');
              const isLong = detail.length > 120;

              return (
                <button key={eventId} onClick={() => toggleExpand(eventId)}
                  className="w-full text-left rounded-lg border border-white/[0.04] bg-white/[0.015] px-4 py-3 transition-all hover:bg-white/[0.03] hover:border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-accent/30 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center border ${sev.border} ${sev.bg} ${sev.color} transition-colors`}>
                      {evtType.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5">
                        <p className="text-[13px] font-medium text-text-heading truncate group-hover:text-accent transition-colors">{title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${sev.color} ${sev.bg} ${sev.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot} ${sev.pulse ? 'animate-pulse' : ''}`} />
                            {t(`hostMonitor.${event.severity}`) || event.severity}
                          </span>
                          {(event.eventType || event.type) && (
                            <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${evtType.color} ${evtType.bg} ${evtType.border}`}>
                              {(event.eventType || event.type).replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      {detail && (
                        <p className={`text-[11px] text-text-muted mt-1.5 leading-relaxed ${!isExpanded && isLong ? 'line-clamp-1' : ''}`}>
                          {isExpanded || !isLong ? detail : detail.slice(0, 120) + '...'}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-text-subtle">
                          <span>{timeAgo(event.timestamp || event.createdAt, t)}</span>
                          {event.source && <span className="text-text-muted">{t('hostMonitor.source')}: {event.source}</span>}
                        </div>
                        {isLong && (
                          <span className="text-[10px] text-accent font-medium">
                            {isExpanded ? t('hostMonitor.collapse') : t('hostMonitor.expand')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

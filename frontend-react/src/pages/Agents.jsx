import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import * as api from '../api/api';
import InfoTooltip from '../components/InfoTooltip';

const I = {
  computer: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  refresh: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  trash: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  info: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  block: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>,
  eye: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  xmark: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  check: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  cpu: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>,
  download: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  warning: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
};

function cleanIP(ip) {
  if (!ip) return '-';
  return ip.replace(/^::ffff:/, '');
}

const fmtUptime = (seconds) => {
  if (seconds == null || seconds === 0) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

function MiniChart({ data, color = '#60a5fa', height = 28 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 100;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');
  const area = `${points} ${width},${height} 0,${height}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <polygon points={area} fill={color} fillOpacity="0.1" />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function DonutChart({ value, color = '#34d399', size = 96, stroke = 10, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-white/[0.04]" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      {(label || sub) && (
        <div>
          {label && <p className="text-[13px] font-bold text-white/80">{label}</p>}
          {sub && <p className="text-[10px] text-text-subtle">{sub}</p>}
        </div>
      )}
    </div>
  );
}

function HorizontalBarChart({ data, max = 100 }) {
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-text-muted font-medium truncate pr-3 flex-1">{d.label}</span>
            <span className="text-white/70 font-semibold tabular-nums">{d.value}{d.suffix || ''}</span>
          </div>
          <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (d.value / max) * 100)}%`, backgroundColor: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricBar({ label, value, max = 100, color, suffix = '%' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-text-muted uppercase tracking-wider font-medium">{label}</span>
        <span className="text-white/80 font-semibold tabular-nums">{value}{suffix}</span>
      </div>
      <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Agents({ onNavigate }) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showUninstall, setShowUninstall] = useState(false);
  const [uninstallTarget, setUninstallTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.listAgents(token);
      if (!res.error) setAgents(Array.isArray(res) ? res : []);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await load();
    setMsg(t('agents.refreshSuccess'));
    setTimeout(() => setMsg(''), 2000);
  };

  const openDetail = async (agent) => {
    setSelectedAgent(agent);
    setShowDetail(true);
  };

  const confirmUninstall = (agent) => {
    setUninstallTarget(agent);
    setShowUninstall(true);
  };

  const handleUninstall = async () => {
    if (!uninstallTarget) return;
    setDeleting(true);
    try {
      const res = await api.deleteAgent(token, uninstallTarget.agentId);
      if (res.error) {
        setMsg(res.error);
      } else {
        setMsg(t('agents.uninstallSuccess'));
        setShowUninstall(false);
        setUninstallTarget(null);
        load();
      }
    } catch {
      setMsg('Error al desinstalar agente');
    }
    setDeleting(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDownloadAgent = async (platform) => {
    setDownloading(true);
    setShowDownloadModal(false);
    setMsg('');
    try {
      const body = new URLSearchParams({ token });
      const r = await fetch('/api/agents/download-token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      const res = await r.json();
      if (res.error) { setMsg(res.error); setDownloading(false); setTimeout(() => setMsg(''), 3000); return; }
      const dlRes = await fetch(`/api/agents/download/${platform}?token=${encodeURIComponent(res.token)}`);
      if (!dlRes.ok) { const e = await dlRes.json().catch(() => ({})); setMsg(e?.error || 'Error al compilar el agente'); setDownloading(false); setTimeout(() => setMsg(''), 3000); return; }
      const blob = await dlRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SecureLab-Agent-${platform}.${platform === 'win-x64' ? 'msi' : 'tar.gz'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg('Agente compilado y descargado');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg('Error al descargar: ' + e.message);
    }
    setDownloading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const statusColor = (s) => {
    switch (s) {
      case 'online': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'idle': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-text-muted bg-bg-elevated border-border-theme';
    }
  };

  const statusDot = (s) => {
    switch (s) {
      case 'online': return 'bg-green-400';
      case 'idle': return 'bg-yellow-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-600';
    }
  };

  const onlineCount = agents.filter(a => a.status === 'online').length;
  const offlineCount = agents.filter(a => a.status === 'offline' || a.status === 'idle').length;
  const errorCount = agents.filter(a => a.status === 'error').length;

  return (
    <div className="h-full flex flex-col bg-bg-base">
      <header className="flex-shrink-0 border-b border-white/[0.04] bg-gradient-to-r from-bg-base via-bg-surface to-bg-base sticky top-0 z-40">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/25 flex items-center justify-center flex-shrink-0 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                {I.cpu}
              </div>
              <div>
                <div className="flex items-center gap-2 text-[10px] text-text-subtle uppercase tracking-wider font-medium">
                  <span>Monitoreo</span>
                  <span className="text-border-theme">/</span>
                  <span className="text-text-heading">{t('agents.title')}</span>
                </div>
                <h1 className="text-[16px] md:text-[18px] font-bold text-text-heading tracking-tight">Agentes de Seguridad</h1>
              </div>
            </div>
            <p className="text-[11px] text-text-muted md:ml-auto md:mr-4">{agents.length} agente{agents.length !== 1 ? 's' : ''} registrados · {onlineCount} en línea · {errorCount} con error</p>
            <div className="flex items-center gap-2 md:ml-0">
              <button onClick={refresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme hover:border-white/[0.08] transition-all">
                {I.refresh} {t('agents.refresh')}
              </button>
              <button onClick={() => setShowDownloadModal(true)} disabled={downloading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed tour-detail-2">
                {downloading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : I.download}
                {downloading ? 'Compilando...' : 'Descargar Agente'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {msg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-medium shadow-lg">
          {I.check} {msg}
        </div>
      )}

      <div className="flex-shrink-0 w-full px-4 md:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Agentes', value: agents.length, color: '#818cf8', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>, tip: 'Número total de agentes registrados en el sistema.', trend: [agents.length * 0.3 || 0, agents.length * 0.5 || 0, agents.length * 0.7 || 0, agents.length] },
            { label: 'Conectados', value: onlineCount, color: '#34d399', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"/></svg>, tip: 'Agentes activos con conexión establecida al servidor.', trend: [onlineCount * 0.3 || 0, onlineCount * 0.5 || 0, onlineCount * 0.8 || 0, onlineCount] },
            { label: 'Desconectados', value: offlineCount, color: '#9ca3af', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/></svg>, tip: 'Agentes sin conexión activa o en estado inactivo.', trend: [offlineCount * 0.3 || 0, offlineCount * 0.5 || 0, offlineCount * 0.8 || 0, offlineCount] },
            { label: 'Con Error', value: errorCount, color: '#f87171', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>, tip: 'Agentes que reportaron un error en su última comunicación.', trend: [errorCount * 0.3 || 0, errorCount * 0.5 || 0, errorCount * 0.8 || 0, errorCount] },
          ].map((card, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 hover:border-white/[0.08] hover:bg-white/[0.025] transition-all duration-200 group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: card.color, backgroundColor: `${card.color}15` }}>{card.icon}</div>
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest">{card.label}</p>
                </div>
                <InfoTooltip text={card.tip} placement="bottom" />
              </div>
              <p className="text-[26px] font-bold leading-none" style={{ color: card.color }}>{card.value}</p>
              <div className="mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                <MiniChart data={card.trend} color={card.color} height={24} />
              </div>
            </div>
          ))}
        </div>

        {agents.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 flex flex-col justify-center">
              <p className="text-[10px] font-medium text-text-subtle uppercase tracking-widest mb-3">Distribución de Estados</p>
              {(() => {
                const total = agents.length || 1;
                const onlinePct = (onlineCount / total) * 100;
                const offlinePct = (offlineCount / total) * 100;
                const errorPct = (errorCount / total) * 100;
                return (
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <DonutChart value={onlinePct} color="#34d399" size={100} stroke={12} label={`${onlineCount} online`} sub={`de ${agents.length}`} />
                    <div className="flex-1 w-full">
                      <HorizontalBarChart data={[
                        { label: 'Online', value: onlinePct, color: '#34d399', suffix: '%' },
                        { label: 'Desconectado', value: offlinePct, color: '#9ca3af', suffix: '%' },
                        { label: 'Error', value: errorPct, color: '#f87171', suffix: '%' },
                      ]} />
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
              <p className="text-[10px] font-medium text-text-subtle uppercase tracking-widest mb-3">Plataformas Instaladas</p>
              {(() => {
                const platforms = agents.reduce((acc, a) => {
                  const p = a.platform || 'unknown';
                  acc[p] = (acc[p] || 0) + 1;
                  return acc;
                }, {});
                const data = Object.entries(platforms).map(([label, value]) => ({
                  label: label === 'windows' ? 'Windows' : label === 'darwin' ? 'macOS' : label === 'linux' ? 'Linux' : label,
                  value,
                  color: label === 'windows' ? '#38bdf8' : label === 'darwin' ? '#c084fc' : label === 'linux' ? '#fbbf24' : '#9ca3af',
                  suffix: '',
                })).sort((a, b) => b.value - a.value);
                return <HorizontalBarChart data={data} max={Math.max(...data.map(d => d.value), 1)} />;
              })()}
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
              <p className="text-[10px] font-medium text-text-subtle uppercase tracking-widest mb-3">Actividad Reciente</p>
              <div className="space-y-2">
                {agents.slice(0, 5).map((agent, i) => (
                  <div key={agent._id || agent.agentId} className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted truncate flex-1 pr-2">{agent.hostname || agent.agentId}</span>
                    <span className="text-text-subtle tabular-nums">{agent.lastHeartbeat ? new Date(agent.lastHeartbeat).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden w-full px-4 md:px-8 pb-8">
        <div className="h-full border border-white/[0.04] bg-white/[0.01]/80 rounded-xl overflow-hidden shadow-inner">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 rounded-xl border border-white/[0.04] bg-white/[0.015]">
              <div className="w-16 h-16 rounded-2xl border border-white/[0.04] bg-white/[0.01] flex items-center justify-center mb-5 text-text-muted shadow-inner">
                {I.computer}
              </div>
              <p className="text-[13px] font-semibold text-white mb-1">No hay Agentes Conectados</p>
              <p className="text-[11px] text-text-muted mb-6 max-w-[280px] text-center">Instala el agente de SecureLab para comenzar a monitorear y auditar la seguridad de tu entorno local.</p>
              <button onClick={() => setShowDownloadModal(true)} disabled={downloading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[12px] font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all  hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
                {downloading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : I.download}
                {downloading ? 'Compilando agente...' : 'Descargar SecureLab Agent'} <InfoTooltip text="Compila y descarga el agente para tu plataforma." placement="right" />
              </button>
              <div className="mt-4">
                <button onClick={() => onNavigate && onNavigate('databases')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-medium bg-bg-elevated hover:bg-surface-750 text-text-body hover:text-text-heading border border-border-theme transition-all">
                  Ir a Bases de Datos
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4 md:p-6 space-y-2 tour-detail-1">
              <div className="hidden lg:grid grid-cols-12 gap-4 px-4 pb-2 text-[10px] font-medium text-text-muted uppercase tracking-wider">
                <div className="col-span-3">Agente</div>
                <div className="col-span-2">Sistema</div>
                <div className="col-span-2">Dirección IP</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-2">Último heartbeat</div>
                <div className="col-span-1 text-right">Acciones</div>
              </div>
              {agents.map(agent => (
                <div key={agent._id || agent.agentId}
                  className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 hover:border-white/[0.08] hover:bg-white/[0.025] transition-all duration-200">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center">
                    <div className="col-span-3 flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        agent.status === 'online' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        agent.status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-bg-elevated text-text-muted border border-border-theme'
                      }`}>{I.computer}</div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{agent.hostname || agent.agentId || '-'}</p>
                        <p className="text-[10px] text-text-subtle font-mono mt-0.5 truncate">{agent.agentId}</p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-[11px] text-text-muted">
                      {agent.platform === 'windows' ? (
                        <span className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg></span>
                      ) : agent.platform === 'darwin' ? (
                        <span className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></span>
                      ) : (
                        <span className="w-6 h-6 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></span>
                      )}
                      <span className="capitalize font-medium">{agent.platform || '-'} <span className="text-text-subtle font-normal">{agent.arch || ''}</span></span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="font-mono text-[11px] bg-bg-base/40 px-2.5 py-1 rounded-lg border border-border-theme text-text-body">{cleanIP(agent.ip)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusColor(agent.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(agent.status)} ${agent.status === 'online' ? 'animate-pulse' : ''}`} />
                        {agent.status === 'online' ? t('agents.online') : agent.status === 'offline' ? t('agents.offline') : agent.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-[11px] text-text-subtle font-medium">
                      {agent.lastHeartbeat ? new Date(agent.lastHeartbeat).toLocaleString() : '-'}
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button onClick={() => openDetail(agent)} title={t('agents.detail')}
                        className="p-2 rounded-lg text-text-muted hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all">{I.eye}</button>
                      <button onClick={() => confirmUninstall(agent)} title={t('agents.uninstall')}
                        className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">{I.trash}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-bg-panel border border-border-theme/50 rounded-2xl w-full max-w-[440px] mx-4 shadow-2xl shadow-black/40 overflow-hidden">
            <div className="relative px-6 pt-6 pb-4 border-b border-white/[0.04]/60">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-indigo-600/10 to-purple-600/5 rounded-full blur-2xl" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-semibold text-text-heading">Descargar SecureLab Agent <InfoTooltip text="Selecciona tu plataforma y se generará un enlace de descarga temporal." placement="right" /></h3>
                  <p className="text-[11px] text-text-muted mt-0.5">Selecciona la plataforma para tu agente</p>
                </div>
                <button type="button" onClick={() => setShowDownloadModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">
                  <svg className="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                {
                  id: 'win-x64', label: 'Windows x64',
                  icon: <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="3" className="text-[#00adef]" stroke="currentColor" strokeWidth="1.2"/><path d="M6 6h5v5H6V6zm7 0h5v5h-5V6zm-7 7h5v5H6v-5zm7 0h5v5h-5v-5z" fill="currentColor" opacity="0.7"/></svg>,
                  badge: '.msi', desc: 'Windows 10/11, Server 2016+'
                },
                {
                  id: 'linux-x64', label: 'Linux x64',
                  icon: <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="3" className="text-[#fcc624]" stroke="currentColor" strokeWidth="1.2"/><path d="M12 5c-1.1 0-2 .9-2 2v2H8c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2v2c0 1.1.9 2 2 2s2-.9 2-2v-2h2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2h-2V7c0-1.1-.9-2-2-2z" fill="currentColor" opacity="0.7"/></svg>,
                  badge: 'ELF x64', desc: 'Ubuntu, Debian, CentOS, Fedora'
                },
                {
                  id: 'mac-x64', label: 'macOS Intel',
                  icon: <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="3" className="text-[#a6b1b9]" stroke="currentColor" strokeWidth="1.2"/><path d="M12 4c-1.8 0-3.2 1.5-3.2 3.5 0 2 1.4 3.5 3.2 3.5s3.2-1.5 3.2-3.5C15.2 5.5 13.8 4 12 4zm-1 8c-2.2 0-4 1.8-4 4v2h10v-2c0-2.2-1.8-4-4-4h-2z" fill="currentColor" opacity="0.7"/></svg>,
                  badge: 'x86_64', desc: 'MacBook Pro/Air 2019 y anteriores'
                },
                {
                  id: 'mac-arm64', label: 'macOS Apple Silicon',
                  icon: <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="3" className="text-[#a6b1b9]" stroke="currentColor" strokeWidth="1.2"/><path d="M12 4c-1.8 0-3.2 1.5-3.2 3.5 0 2 1.4 3.5 3.2 3.5s3.2-1.5 3.2-3.5C15.2 5.5 13.8 4 12 4zm-1 8c-2.2 0-4 1.8-4 4v2h10v-2c0-2.2-1.8-4-4-4h-2z" fill="currentColor" opacity="0.7"/></svg>,
                  badge: 'ARM64', desc: 'MacBook Pro/Air M1, M2, M3, M4'
                },
              ].map((p, idx) => (
                <button key={p.id} onClick={() => handleDownloadAgent(p.id)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-bg-elevated/60 hover:bg-surface-750 border border-border-theme/40 hover:border-indigo-500/30 text-left transition-all duration-200 group hover:"
                  style={{ animationDelay: `${idx * 60}ms` }}>
                  <div className="w-11 h-11 rounded-xl border border-white/[0.04] bg-white/[0.01]/50 flex items-center justify-center flex-shrink-0 group-hover:border-indigo-500/20 group-hover:bg-bg-elevated/80 transition-all">
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-white group-hover:text-indigo-300 transition-colors">{p.label}</p>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-bg-panel text-text-muted border border-border-theme/50">{p.badge}</span>
                    </div>
                    <p className="text-[10px] text-text-subtle mt-0.5">{p.desc}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg rounded-xl border border-white/[0.04] bg-white/[0.015]/30 flex items-center justify-center text-text-muted group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 bg-bg-base/40 border-t border-white/[0.04]/60">
              <p className="text-[10px] text-text-subtle flex items-center gap-1">Los binarios se compilan al iniciar el servidor <InfoTooltip text="Los agentes se precompilan para descarga inmediata." placement="top" /></p>
              <button onClick={() => setShowDownloadModal(false)}
                className="px-4 py-1.5 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme/50 hover:border-surface-600 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-bg-panel border border-border-theme rounded-xl w-full max-w-[560px] mx-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <h3 className="text-[13px] font-semibold text-text-heading">{t('agents.agentDetail')}</h3>
              <button onClick={() => { setShowDetail(false); setSelectedAgent(null); }} className="p-1 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">{I.xmark}</button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <h4 className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-2">{t('agents.basicInfo')} <InfoTooltip text="Información general de identificación y conexión del agente." placement="right" /></h4>
                <div className="bg-bg-base/40 border border-border-theme rounded-lg divide-y divide-surface-700/40">
                  {[
                    ['Agent ID', selectedAgent.agentId],
                    ['Hostname', selectedAgent.hostname],
                    ['Plataforma', `${selectedAgent.platform || '-'} ${selectedAgent.arch || ''}`],
                    ['IP', cleanIP(selectedAgent.ip)],
                    ['Versión', selectedAgent.version || '-'],
                    [t('agents.status'), selectedAgent.status],
                    [t('agents.lastSeen'), selectedAgent.lastHeartbeat ? new Date(selectedAgent.lastHeartbeat).toLocaleString() : '-'],
                    ['Registrado', selectedAgent.registeredAt ? new Date(selectedAgent.registeredAt).toLocaleString() : '-'],
                  ].map(([label, val], i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2">
                      <span className="text-[11px] text-text-muted">{label}</span>
                      <span className="text-[11px] text-text-body font-mono">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedAgent.metrics && (
                <div className="bg-bg-base/40 border border-border-theme rounded-xl p-4">
                  <h4 className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-3">{t('agents.metrics')} <InfoTooltip text="Métricas de rendimiento en tiempo real del equipo." placement="right" /></h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAgent.metrics.cpu != null && (
                      <MetricBar label={t('agents.cpu')} value={selectedAgent.metrics.cpu} color={selectedAgent.metrics.cpu > 80 ? '#f87171' : selectedAgent.metrics.cpu > 50 ? '#fbbf24' : '#818cf8'} />
                    )}
                    {selectedAgent.metrics.memory != null && (
                      <MetricBar label={t('agents.memory')} value={selectedAgent.metrics.memory} color={selectedAgent.metrics.memory > 80 ? '#f87171' : selectedAgent.metrics.memory > 50 ? '#fbbf24' : '#22d3ee'} />
                    )}
                    {selectedAgent.metrics.load != null && (
                      <MetricBar label={t('agents.load')} value={selectedAgent.metrics.load} max={Math.max(4, selectedAgent.metrics.load)} suffix="" color={selectedAgent.metrics.load > 3 ? '#f87171' : selectedAgent.metrics.load > 1.5 ? '#fbbf24' : '#34d399'} />
                    )}
                    {selectedAgent.metrics.uptime != null && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('agents.uptime')}</p>
                          <p className="text-[14px] font-bold text-emerald-400 mt-0.5">{fmtUptime(selectedAgent.metrics.uptime)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedAgent.metrics.users != null && (
                    <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('agents.users')} <InfoTooltip text="Número de usuarios activos en el equipo del agente." placement="bottom" /></p>
                        <p className="text-[14px] font-bold text-white mt-0.5">{selectedAgent.metrics.users} usuarios activos</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-text-muted">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedAgent.capabilities && (
                <div>
                  <h4 className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-2">{t('agents.capabilities')} <InfoTooltip text="Funcionalidades habilitadas en el agente." placement="right" /></h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedAgent.capabilities).map(([key, val]) => (
                      <span key={key} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border ${
                        val ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-bg-elevated text-text-subtle border-border-theme'
                      }`}>
                        {val ? I.check : I.xmark} {key}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-[10px] text-text-subtle font-semibold uppercase tracking-widest mb-2">{t('agents.firewallStatus')} <InfoTooltip text="Estado actual de la configuración del firewall del agente." placement="right" /></h4>
                <div className="bg-bg-base/40 border border-border-theme rounded-lg p-3">
                  {selectedAgent.firewall ? (
                    <pre className="text-[10px] text-text-muted font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">{typeof selectedAgent.firewall === 'string' ? selectedAgent.firewall : JSON.stringify(selectedAgent.firewall, null, 2)}</pre>
                  ) : (
                    <p className="text-[11px] text-text-subtle">-</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => { setShowDetail(false); setSelectedAgent(null); }}
                  className="px-4 py-2 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme transition-colors">
                  {t('agents.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uninstall Confirmation */}
      {showUninstall && uninstallTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-bg-panel border border-border-theme rounded-xl w-full max-w-[400px] mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <h3 className="text-[13px] font-semibold text-text-heading">{t('agents.confirmDelete')} <InfoTooltip text="Esta acción eliminará el agente y todos sus datos del servidor." placement="right" /></h3>
              <button onClick={() => { setShowUninstall(false); setUninstallTarget(null); }} className="p-1 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">{I.xmark}</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/15 rounded-lg px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0">{I.warning}</div>
                <div>
                  <p className="text-[12px] text-red-400 font-medium mb-0.5">{t('agents.confirmUninstall')} <InfoTooltip text="Esta acción eliminará el agente del equipo de forma permanente." placement="right" /></p>
                  <p className="text-[11px] text-text-muted font-mono mt-1">{uninstallTarget.hostname || uninstallTarget.agentId}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowUninstall(false); setUninstallTarget(null); }}
                  className="px-4 py-2 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme transition-colors">
                  {t('agents.close')}
                </button>
                <button onClick={handleUninstall} disabled={deleting}
                  className="px-4 py-2 rounded-lg text-[11px] font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors">
                  {deleting ? t('agents.uninstalling') : t('agents.uninstall')}
                </button> <InfoTooltip text="Envía el comando de desinstalación al agente remoto." placement="top" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

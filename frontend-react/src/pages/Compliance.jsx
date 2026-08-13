import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataCache';
import { useI18n } from '../i18n/context';
import * as api from '../api/api';
import InfoTooltip from '../components/InfoTooltip';

const I = {
  shield: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  pen: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>,
  users: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  database: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>,
  alert: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
  fileText: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  check: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  xmark: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  plus: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  download: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  search: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  settings: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  globe: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>,
  info: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  trash: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
};

function Card({ className = '', children }) {
  return (
    <div className={`rounded-xl border border-border-theme bg-bg-panel/60 backdrop-blur-sm hover:border-border-theme/60 transition-colors duration-200 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, color = 'gray', icon }) {
  const c = {
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    gray: 'bg-bg-elevated text-text-muted border-border-theme',
    indigo: 'bg-primary-500/10 text-accent border-accent-border',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${c[color] || c.gray}`}>
      {icon && <span className="w-3 h-3">{icon}</span>}{children}
    </span>
  );
}

function StatCard({ icon, label, value, color = 'text-text-heading', sub, info }) {
  return (
    <div className="rounded-xl border border-border-theme bg-bg-panel/60 backdrop-blur-sm p-4 md:p-5 hover:border-border-theme/60 transition-colors duration-200">
      <div className="flex items-center gap-2 md:gap-2.5 mb-2 md:mb-3">
        <span className="text-text-muted">{icon}</span>
        <span className="text-[9px] md:text-[10px] text-text-subtle font-medium uppercase tracking-widest truncate">{label}</span>
        {info && <InfoTooltip text={info} placement="top" />}
      </div>
      <p className={`text-[22px] md:text-[26px] font-bold leading-none tracking-tight ${color}`}>{value ?? '-'}</p>
      {sub && <p className="text-[9px] md:text-[10px] text-text-subtle mt-1.5 md:mt-2 truncate">{sub}</p>}
    </div>
  );
}

function Modal({ show, onClose, title, children, wide = false }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-bg-overlay flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
      <div className={`w-full mx-auto max-h-[92vh] overflow-y-auto bg-bg-panel border border-border-theme rounded-xl shadow-xl ${wide ? 'max-w-2xl' : 'max-w-md md:max-w-lg'}`}>
        <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 border-b border-white/[0.04]">
          <h3 className="text-[12px] md:text-[13px] font-semibold text-text-heading pr-2">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-text-muted hover:text-text-heading transition-colors p-1 hover:bg-bg-elevated rounded-lg flex-shrink-0">{I.xmark}</button>
        </div>
        <div className="p-4 md:p-5">{children}</div>
      </div>
    </div>
  );
}

function Inp({ value, onChange, label, placeholder, type = 'text', className = '', monospace = false, error = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">{label}</label>}
      <input value={value} onChange={onChange} type={type} placeholder={placeholder} {...props}
        className={`w-full bg-bg-base border text-[12px] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 transition-all placeholder-text-subtle ${monospace ? 'font-mono' : ''} ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 text-red-100' : 'border-border-theme focus:border-accent focus:ring-accent-subtle text-white'}`} />
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function Sel({ value, onChange, label, options, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">{label}</label>}
      <select value={value} onChange={onChange}
        className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all appearance-none cursor-pointer">
        {options.map((o, i) => <option key={i} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = 'primary', className = '', size = 'sm', type = 'button' }) {
  const v = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-text-heading shadow-sm shadow-primary-500/10',
    secondary: 'bg-bg-elevated/80 hover:bg-bg-elevated text-text-body border border-border-theme',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
    success: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
    ghost: 'bg-transparent hover:bg-bg-elevated text-text-muted hover:text-text-heading',
  };
  const s = { sm: 'px-2.5 py-1.5 text-[11px]', md: 'px-3 py-2 text-[12px]', lg: 'px-4 py-2.5 text-[13px]' };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${s[size]} font-medium rounded-lg transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] ${v[variant]} ${className}`}>
      {children}
    </button>
  );
}

function EmptyState({ icon, title, description, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-12 md:py-16'}`}>
      <div className={`rounded-xl bg-bg-elevated/50 text-text-muted flex items-center justify-center mb-4 ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
        {icon}
      </div>
      <p className={`text-text-heading font-medium ${compact ? 'text-[12px]' : 'text-[14px]'}`}>{title}</p>
      {description && <p className={`text-text-subtle mt-1 max-w-xs ${compact ? 'text-[10px]' : 'text-[11px] md:text-[12px]'}`}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-bg-elevated/60 rounded ${className}`} />;
}

function MiniChart({ data, color = '#38bdf8', height = 40, label = '', suffix = '', periods = null }) {
  const [hovered, setHovered] = useState(null);
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 120;
  const pad = 6;
  const step = (width - pad * 2) / (data.length - 1);
  const coords = data.map((v, i) => ({
    x: pad + i * step,
    y: pad + (height - pad * 2) - ((v - min) / range) * (height - pad * 2),
    value: v,
  }));
  const points = coords.map(p => `${p.x},${p.y}`).join(' ');
  const area = `${pad},${height} ${points} ${width - pad},${height}`;
  const defaultPeriods = ['Inicio', 'Etapa 1', 'Etapa 2', 'Hoy'];
  const labels = periods || defaultPeriods.slice(0, data.length);
  return (
    <div className="relative">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <polygon points={area} fill={color} fillOpacity="0.08" />
        <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
        {coords.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={hovered === i ? 4 : 2.5} fill={color}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
            <circle cx={p.x} cy={p.y} r="8" fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
          </g>
        ))}
      </svg>
      {hovered != null && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-bg-elevated border border-border-theme text-[10px] text-text-heading whitespace-nowrap shadow-lg z-10 pointer-events-none">
          {labels[hovered] ? `${labels[hovered]}: ` : ''}<span className="font-bold" style={{ color }}>{Math.round(data[hovered])}{suffix}</span>
        </div>
      )}
    </div>
  );
}

const CATEGORIES = ['clientes', 'empleados', 'proveedores', 'candidatos', 'usuarios_web', 'socios'];
const DATA_TYPES = ['nombre', 'email', 'rut', 'telefono', 'direccion', 'fecha_nacimiento', 'salud', 'biometrico', 'ubicacion', 'ip', 'historial_compras', 'datos_bancarios', 'credenciales', 'foto', 'opiniones_politicas', 'religion', 'orientacion_sexual', 'otros'];
const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
const STORAGE_TYPES = ['local', 'cloud', 'third_party', 'physical'];
const BREACH_TYPES = ['hack', 'leak', 'loss', 'unauthorized_access', 'ransomware', 'phishing', 'internal', 'other'];

const LAW_DEADLINE = new Date('2026-12-13T00:00:00');

function msToCountdown(ms) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds, expired: false };
}

function formatCountdown(ms, prefix = '') {
  const c = msToCountdown(ms);
  if (c.expired) return `${prefix}Vencido`;
  const parts = [];
  if (c.days) parts.push(`${c.days}d`);
  if (c.hours || c.days) parts.push(`${c.hours}h`);
  parts.push(`${c.minutes}m`);
  return prefix + parts.join(' ');
}

function getBreachRemainingMs(breach) {
  if (!breach || breach.status === 'resolved' || !breach.detectedAt) return null;
  const detected = new Date(breach.detectedAt);
  const deadline = detected.getTime() + 72 * 3600000;
  return deadline - Date.now();
}

function getArcoRemainingBusinessDays(req) {
  if (!req || !req.createdAt || req.estado === 'completado' || req.estado === 'rechazado') return null;
  const created = new Date(req.createdAt);
  let days = 0;
  let date = new Date(created);
  const today = new Date();
  while (date < today) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) days++;
  }
  const remaining = 10 - days;
  return remaining;
}

function estimateLegalRisk(checklistDone, CHECKLIST, breaches, arcoRequests) {
  let score = 0;
  const pending = CHECKLIST.length - checklistDone;
  score += pending * 8;
  const activeBreaches = breaches.filter(b => b.status !== 'resolved');
  score += activeBreaches.length * 25;
  activeBreaches.forEach(b => { if (b.sensitiveDataInvolved) score += 30; if (b.childrenDataInvolved) score += 40; });
  const overdueArco = arcoRequests.filter(r => { const d = getArcoRemainingBusinessDays(r); return d !== null && d < 0; }).length;
  score += overdueArco * 20;
  const max = 350;
  const pct = Math.min(100, Math.round((score / max) * 100));
  return { score, pct, level: pct >= 70 ? 'Alto' : pct >= 40 ? 'Medio' : 'Bajo' };
}

function OnboardingWizard({ checklistStatus, setActiveTab, openConfigEdit, setShowInventoryModal, setShowConsentModal, setShowTrainingModal }) {
  const steps = [
    { id: 'dpd', label: 'Designar DPD', action: openConfigEdit, done: checklistStatus('dpd') },
    { id: 'inventory', label: 'Crear inventario', action: () => setShowInventoryModal(true), done: checklistStatus('inventory') },
    { id: 'privacy', label: 'Política de privacidad', action: openConfigEdit, done: checklistStatus('privacy') },
    { id: 'consents', label: 'Registrar consentimientos', action: () => setShowConsentModal(true), done: checklistStatus('consents') },
    { id: 'training', label: 'Capacitar equipo', action: () => setShowTrainingModal(true), done: checklistStatus('training') },
  ];
  const current = steps.findIndex(s => !s.done);
  const progress = Math.round((steps.filter(s => s.done).length / steps.length) * 100);
  if (current === -1) return null;
  return (
    <div className="rounded-xl border border-accent-border bg-accent-subtle p-4 md:p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-text-heading">Asistente de cumplimiento Ley 21.719</p>
          <p className="text-[11px] text-text-muted">Completa los pasos obligatorios antes del 13 de diciembre de 2026.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-bg-elevated/50 rounded-full h-2">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[11px] text-text-muted font-medium">{progress}%</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {steps.map((s, i) => (
          <button key={s.id} onClick={s.action} disabled={i > current} className={`text-left p-3 rounded-lg border transition-all ${s.done ? 'bg-emerald-500/5 border-emerald-500/20' : i === current ? 'bg-bg-panel border-accent hover:border-accent/60' : 'bg-bg-base/40 border-border-theme opacity-60 cursor-not-allowed'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${s.done ? 'bg-emerald-500/20 text-emerald-400' : i === current ? 'bg-accent/20 text-accent' : 'bg-bg-elevated text-text-subtle'}`}>
                {s.done ? '✓' : i + 1}
              </div>
              <span className={`text-[11px] font-medium ${s.done ? 'text-emerald-300' : i === current ? 'text-text-heading' : 'text-text-subtle'}`}>{s.label}</span>
            </div>
            {i === current && <span className="text-[9px] text-accent font-medium">Pendiente →</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function RiskScoreCard({ risk }) {
  const color = risk.level === 'Alto' ? 'text-red-400' : risk.level === 'Medio' ? 'text-amber-400' : 'text-emerald-400';
  const bg = risk.level === 'Alto' ? 'bg-red-500/10' : risk.level === 'Medio' ? 'bg-amber-500/10' : 'bg-emerald-500/10';
  const border = risk.level === 'Alto' ? 'border-red-500/20' : risk.level === 'Medio' ? 'border-amber-500/20' : 'border-emerald-500/20';
  const progress = risk.level === 'Alto' ? 'bg-red-500' : risk.level === 'Medio' ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className={`rounded-xl border ${border} bg-bg-panel/60 backdrop-blur-sm p-4 md:p-5 hover:border-border-theme/60 transition-colors duration-200`}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-text-muted">{I.alert}</span>
        <span className="text-[9px] md:text-[10px] text-text-subtle font-medium uppercase tracking-widest">Riesgo Legal Estimado</span>
        <InfoTooltip text="Puntaje basado en requisitos pendientes, brechas activas y ARCO vencidos." placement="top" />
      </div>
      <div className="flex items-end gap-3">
        <p className={`text-[28px] md:text-[32px] font-bold leading-none tracking-tight ${color}`}>{risk.pct}%</p>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${bg} ${color} mb-1`}>{risk.level}</span>
      </div>
      <p className="text-[10px] text-text-subtle mt-2">{risk.level === 'Alto' ? 'Acción inmediata recomendada' : risk.level === 'Medio' ? 'Revisar pendientes' : 'Cumplimiento estable'}</p>
      <div className="w-full bg-bg-elevated/50 rounded-full h-1.5 mt-3">
        <div className={`h-full rounded-full ${progress}`} style={{ width: `${risk.pct}%` }} />
      </div>
    </div>
  );
}

function RiskBanner({ now }) {
  const remaining = LAW_DEADLINE.getTime() - now;
  const c = msToCountdown(remaining);
  const expired = remaining <= 0;
  return (
    <div className={`rounded-xl border p-3 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 ${expired ? 'bg-red-500/5 border-red-500/20' : remaining < 30 * 86400000 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-accent-subtle border-accent-border'}`}>
      <div className="flex items-center gap-2.5 md:gap-3">
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${expired ? 'bg-red-500/10 text-red-400' : remaining < 30 * 86400000 ? 'bg-amber-500/10 text-amber-400' : 'bg-accent/10 text-accent'}`}>
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] md:text-[11px] text-text-muted uppercase tracking-wider font-semibold">Vigencia plena Ley 21.719</p>
          <p className="text-[12px] md:text-[13px] text-text-heading font-medium truncate">{expired ? 'La ley está en vigencia plena' : 'Tiempo restante para cumplir en forma obligatoria'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 lg:gap-5 w-full md:w-auto">
        {expired ? (
          <span className="text-[16px] md:text-[18px] font-bold text-red-400">En vigencia</span>
        ) : (
          <div className="flex gap-2 md:gap-3 text-center">
            {c.days > 0 && <div className="min-w-[40px] md:min-w-[48px]"><p className="text-[18px] md:text-[22px] font-bold leading-none text-text-heading">{c.days}</p><p className="text-[8px] md:text-[9px] text-text-muted uppercase mt-1">días</p></div>}
            <div className="min-w-[40px] md:min-w-[48px]"><p className="text-[18px] md:text-[22px] font-bold leading-none text-text-heading">{c.hours}</p><p className="text-[8px] md:text-[9px] text-text-muted uppercase mt-1">horas</p></div>
            <div className="min-w-[40px] md:min-w-[48px]"><p className="text-[18px] md:text-[22px] font-bold leading-none text-text-heading">{c.minutes}</p><p className="text-[8px] md:text-[9px] text-text-muted uppercase mt-1">min</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Compliance() {
  const { token } = useAuth();
  const cache = useDataCache();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [globalSearch, setGlobalSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [consents, setConsents] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const dedup = (arr) => { const s = new Set(); return arr.filter(a => { const k = a._id || (a.category + '|' + a.dataType); if (s.has(k)) return false; s.add(k); return true; }); };
  const [consentSearch, setConsentSearch] = useState('');
  const [consentFilter, setConsentFilter] = useState('all');

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentForm, setConsentForm] = useState({ titularEmail: '', titularName: '', titularRut: '', purpose: '', dataCategories: '', source: 'web_form' });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ kind: 'consent', recipientEmail: '', recipientName: '', recipientRut: '', purpose: '', dataCategories: '', trainingId: '', expiresHours: '168' });
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ kind: 'consent', purpose: '', dataCategories: '', topic: 'ley_21719', date: new Date().toISOString().split('T')[0], expiresHours: '168' });
  const [bulkRecipients, setBulkRecipients] = useState([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [invForm, setInvForm] = useState({ category: 'clientes', dataType: 'email', sensitive: 'false', storage: 'local', storageLocation: '', retentionDays: '365', purpose: '', legalBasis: 'consent', sharedWith: '', securityMeasures: '', risk: 'medium' });
  const [showBreachModal, setShowBreachModal] = useState(false);
  const [breachForm, setBreachForm] = useState({ type: 'hack', severity: 'high', description: '', affectedData: '', affectedUsers: '0', sensitiveDataInvolved: 'false', childrenDataInvolved: 'false', economicDataInvolved: 'false', rootCause: '', containmentActions: '' });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({ companyRut: '', companyName: '', dpdName: '', dpdEmail: '', dpdPhone: '', apdpRegistered: 'false', privacyPolicyUrl: '', cookiesPolicyUrl: '', dataRetentionPolicy: '5 years', complianceLevel: 'basic', internationalTransfer: 'false' });
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingForm, setTrainingForm] = useState({ employeeName: '', employeeEmail: '', employeeRut: '', employeePhone: '', employeePosition: '', employeeDepartment: '', topic: 'ley_21719', date: new Date().toISOString().split('T')[0], notes: '' });
  const [showTrainingViewModal, setShowTrainingViewModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signTrainingId, setSignTrainingId] = useState(null);
  const [showArcoModal, setShowArcoModal] = useState(false);
  const [arcoRequests, setArcoRequests] = useState([]);
  const [arcoResponse, setArcoResponse] = useState({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  const [showBreachDetailModal, setShowBreachDetailModal] = useState(false);
  const [selectedBreach, setSelectedBreach] = useState(null);
  const [breachResolveModal, setBreachResolveModal] = useState(null);
  const [breachResolveType, setBreachResolveType] = useState('');
  const [breachResolveNotes, setBreachResolveNotes] = useState('');
  const [breachResolving, setBreachResolving] = useState(false);
  const [pseudoRules, setPseudoRules] = useState([]);
  const [dpiaItems, setDpiaItems] = useState([]);
  const [dpaItems, setDpaItems] = useState([]);
  const [showDpiaModal, setShowDpiaModal] = useState(false);
  const [editingDpia, setEditingDpia] = useState(null);
  const [showDpaModal, setShowDpaModal] = useState(false);
  const [editingDpa, setEditingDpa] = useState(null);
  const [dpaForm, setDpaForm] = useState({
    processorName: '', processorRut: '', processorContactName: '', processorEmail: '', processorPhone: '',
    processorAddress: '', serviceDescription: '', dataCategories: '', dataSubjects: 'customers',
    processingPurpose: '', contractDate: '', expirationDate: '', contractReference: '',
    securityMeasures: '', internationalTransfer: 'false', transferCountry: '', transferGuarantees: '',
    status: 'draft', subProcessors: '', notes: '',
  });
  const [dpiaForm, setDpiaForm] = useState({
    title: '', description: '', responsibleName: '', responsibleDept: '',
    processingPurpose: '', dataCategories: '', dataSubjects: 'customers',
    legalBasis: 'consent', riskJustification: '', mitigationMeasures: '',
    sensitiveData: 'false', childrenData: 'false', largeScale: 'false',
    automatedDecisions: 'false', profiling: 'false', biometricData: 'false',
    geolocationData: 'false', videoSurveillance: 'false',
    crossBorderTransfer: 'false', vulnerableSubjects: 'false',
    systematicMonitoring: 'false', newTechnologies: 'false',
  });
  const [showPseudoModal, setShowPseudoModal] = useState(false);
  const [pseudoForm, setPseudoForm] = useState({ name: '', description: '', method: 'hash', tableName: '', columnName: '' });
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
  const [editInvItem, setEditInvItem] = useState(null);
  const [editConsentItem, setEditConsentItem] = useState(null);
  const [invPage, setInvPage] = useState(0);
  const [consentPage, setConsentPage] = useState(0);
  const [arcoRights] = useState([
    { id: 'acceso', title: 'Acceso', art: 'Art. 8', desc: 'El titular puede solicitar conocer qué datos personales suyos están siendo tratados.' },
    { id: 'rectificacion', title: 'Rectificación', art: 'Art. 9', desc: 'El titular puede solicitar la corrección de datos inexactos o incompletos.' },
    { id: 'supresion', title: 'Supresión', art: 'Art. 10', desc: 'El titular puede solicitar la eliminación de sus datos cuando ya no sean necesarios.' },
    { id: 'oposicion', title: 'Oposición', art: 'Art. 11', desc: 'El titular puede oponerse al tratamiento de sus datos para fines específicos.' },
    { id: 'portabilidad', title: 'Portabilidad', art: 'Art. 13', desc: 'El titular puede solicitar recibir sus datos en un formato estructurado.' },
  ]);
  const [violations] = useState([
    { id: 'incumplir_arco', title: 'Incumplir solicitudes ARCO', severity: 'leve', art: 'Arts. 8-13', fine: 'Hasta 5.000 UTM', desc: 'No responder, obstruir o retardar injustificadamente las solicitudes de acceso, rectificación, supresión, oposición o portabilidad dentro del plazo legal de 10 días hábiles.' },
    { id: 'falta_consentimiento', title: 'Falta de consentimiento', severity: 'leve', art: 'Art. 12', fine: 'Hasta 5.000 UTM', desc: 'Tratar datos personales sin contar con el consentimiento explícito e informado del titular, o no acreditar debidamente su obtención.' },
    { id: 'no_inventario', title: 'No llevar inventario de datos', severity: 'leve', art: 'Art. 15', fine: 'Hasta 5.000 UTM', desc: 'No mantener un registro actualizado de las bases de datos con datos personales, incluyendo categorías, finalidades, base legal y medidas de seguridad.' },
    { id: 'datos_sin_consentimiento', title: 'Tratar datos sensibles sin autorización', severity: 'grave', art: 'Art. 16', fine: 'Hasta 10.000 UTM', desc: 'Procesar datos sensibles (salud, biometría, religión, orientación sexual, etc.) sin el consentimiento explícito del titular o sin cumplir las condiciones legales.' },
    { id: 'transferencia_internacional', title: 'Transferencia internacional no autorizada', severity: 'grave', art: 'Art. 21', fine: 'Hasta 10.000 UTM', desc: 'Transferir datos personales a países que no otorguen un nivel adecuado de protección sin las garantías suficientes o sin autorización del titular.' },
    { id: 'medidas_seguridad', title: 'No implementar medidas de seguridad', severity: 'grave', art: 'Art. 25', fine: 'Hasta 10.000 UTM', desc: 'No adoptar las medidas técnicas, organizativas y de seguridad necesarias para proteger los datos personales contra accesos no autorizados o destrucción.' },
    { id: 'no_reportar_brecha', title: 'No reportar brechas de seguridad', severity: 'gravisima', art: 'Art. 26', fine: 'Hasta 20.000 UTM', desc: 'No notificar a la APDP las violaciones de seguridad que afecten datos personales dentro del plazo establecido, especialmente cuando involucren datos sensibles o de niños.' },
    { id: 'no_dpd', title: 'No designar DPD', severity: 'gravisima', art: 'Art. 28', fine: 'Hasta 20.000 UTM', desc: 'No contar con un Delegado de Protección de Datos cuando sea obligatorio por el volumen o naturaleza de los datos tratados, o no publicar sus datos de contacto.' },
    { id: 'no_apdp', title: 'No registrarse en APDP', severity: 'gravisima', art: 'Art. 31', fine: 'Hasta 20.000 UTM', desc: 'No inscribirse en el Registro de la Agencia de Protección de Datos Personales ni mantener actualizada la información del tratamiento de datos.' },
    { id: 'datos_ninios', title: 'Violación de datos de niños', severity: 'gravisima', art: 'Art. 17', fine: 'Hasta 20.000 UTM', desc: 'Tratar datos personales de niños, niñas o adolescentes sin el consentimiento del titular de la patria potestad o sin implementar las salvaguardas especiales requeridas.' },
    { id: 'reincidencia', title: 'Reincidencia en infracciones graves', severity: 'gravisima', art: 'Art. 35', fine: 'Hasta 20.000 UTM (triplicable)', desc: 'Cometer una infracción grave dentro del período de 2 años desde la sanción anterior. Las multas pueden triplicarse, alcanzando hasta 60.000 UTM.' },
  ]);

  const LEGAL_BASIS = useMemo(() => [
    { value: 'consent', label: t('compliance.consent', 'Consentimiento (Art. 12)') },
    { value: 'contract', label: t('compliance.contract', 'Relación Contractual') },
    { value: 'legal_obligation', label: t('compliance.legal', 'Obligación Legal') },
    { value: 'legitimate_interest', label: t('compliance.legitimate', 'Interés Legítimo') },
    { value: 'public_interest', label: t('compliance.publicInterest', 'Interés Público') },
  ], [t]);

  const CHECKLIST = useMemo(() => [
    { id: 'dpd', label: t('compliance.dpd', 'DPD Designado'), desc: t('compliance.dpdDesc', 'Delegado de Protección de Datos (Art. 28)'), icon: I.users },
    { id: 'apdp', label: t('compliance.apdpReg', 'Registro APDP'), desc: t('compliance.apdpDesc', 'Registro ante Agencia de Protección de Datos (Art. 31)'), icon: I.shield },
    { id: 'inventory', label: t('compliance.inventoryLabel', 'Inventario de Datos'), desc: t('compliance.inventoryDesc', 'Inventario de datos personales (Art. 15)'), icon: I.database },
    { id: 'privacy', label: t('compliance.privacy', 'Política de Privacidad'), desc: t('compliance.privacyDesc', 'Política actualizada y accesible (Art. 14)'), icon: I.fileText },
    { id: 'consents', label: t('compliance.consentsList', 'Consentimientos'), desc: t('compliance.consentsDesc', 'Mecanismo de consentimiento explícito (Art. 12)'), icon: I.check },
    { id: 'breach_protocol', label: t('compliance.breachProtocol', 'Protocolo de Brechas'), desc: t('compliance.breachProtocolDesc', 'Procedimiento de notificación (Art. 26)'), icon: I.alert },
    { id: 'arco', label: t('compliance.arco', 'Portal ARCO'), desc: t('compliance.arcoDesc', 'Derechos Acceso, Rectificación, Cancelación, Oposición + Portabilidad'), icon: I.users },
    { id: 'pseudonymization', label: t('compliance.pseudonymization', 'Seudonimización'), desc: t('compliance.pseudonymizationDesc', 'Reemplazo de identificadores directos por seudónimos (Art. 30)'), icon: I.search },
    { id: 'incident_response', label: t('compliance.incidentResponse', 'Plan de Respuesta a Incidentes'), desc: t('compliance.incidentResponseDesc', 'Procedimiento documentado para brechas de seguridad (Art. 26)'), icon: I.alert },
    { id: 'training', label: t('compliance.training', 'Capacitación'), desc: t('compliance.trainingDesc', 'Programa de formación en protección de datos'), icon: I.info },
    { id: 'transfer', label: t('compliance.transfer', 'Transferencias Internacionales'), desc: t('compliance.transferDesc', 'Control de datos enviados al extranjero'), icon: I.globe },
    { id: 'audit', label: t('compliance.audit', 'Auditoría'), desc: t('compliance.auditDesc', 'Registro de auditoría de acceso a datos'), icon: I.search },
  ], [t]);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    const cached = cache.get('compliance_overview');
    if (cached) {
      if (cached.config) setConfig(cached.config);
      if (cached.stats) setStats(cached.stats);
      if (Array.isArray(cached.consents)) setConsents(cached.consents);
      if (Array.isArray(cached.inventory)) setInventory(dedup(cached.inventory));
      if (Array.isArray(cached.breaches)) setBreaches(dedup(cached.breaches));
      if (Array.isArray(cached.arcoRequests)) setArcoRequests(cached.arcoRequests);
      if (Array.isArray(cached.trainings)) setTrainings(cached.trainings);
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    const overview = await api.getComplianceOverview(token).catch(() => null);
    if (overview && !overview.error) {
      cache.set('compliance_overview', overview);
      if (overview.config) setConfig(overview.config);
      if (overview.stats) setStats(overview.stats);
      if (Array.isArray(overview.consents)) setConsents(overview.consents);
      if (Array.isArray(overview.inventory)) setInventory(dedup(overview.inventory));
      if (Array.isArray(overview.breaches)) setBreaches(dedup(overview.breaches));
      if (Array.isArray(overview.arcoRequests)) setArcoRequests(overview.arcoRequests);
      if (Array.isArray(overview.trainings)) setTrainings(overview.trainings);
    }
    // Load pseudonymization rules separately
    const pRules = await api.getPseudonymizationRules(token).catch(() => null);
    if (Array.isArray(pRules)) setPseudoRules(pRules);
    // Load DPIAs
    const dpiaRes = await api.getComplianceDPIAs(token).catch(() => null);
    if (Array.isArray(dpiaRes)) setDpiaItems(dpiaRes);
    // Load DPAs
    const dpaRes = await api.getComplianceDPAs(token).catch(() => null);
    if (Array.isArray(dpaRes)) setDpaItems(dpaRes);
    if (!overview || overview.error) {
      // fallback
      // fallback: load individually
      const [c, s, cons, inv, br, tr, arcoRes, pRules, dpiaRes2, dpaRes2] = await Promise.all([
        api.getComplianceConfig(token).catch(() => null),
        api.getComplianceStats(token).catch(() => null),
        api.getComplianceConsents(token).catch(() => []),
        api.getComplianceInventory(token).catch(() => []),
        api.getComplianceBreaches(token).catch(() => []),
        api.getComplianceTrainings(token).catch(() => []),
        api.getArcoRequests(token).catch(() => []),
        api.getPseudonymizationRules(token).catch(() => []),
        api.getComplianceDPIAs(token).catch(() => []),
        api.getComplianceDPAs(token).catch(() => []),
      ]);
      if (Array.isArray(pRules)) setPseudoRules(pRules);
      if (Array.isArray(dpiaRes2)) setDpiaItems(dpiaRes2);
      if (Array.isArray(dpaRes2)) setDpaItems(dpaRes2);
      if (Array.isArray(arcoRes)) setArcoRequests(arcoRes);
      else if (arcoRes && Array.isArray(arcoRes.requests)) setArcoRequests(arcoRes.requests);
      if (c && !c.error) setConfig(c);
      if (s && !s.error) setStats(s);
      if (Array.isArray(cons)) setConsents(cons);
      if (Array.isArray(inv)) setInventory(dedup(inv));
      if (Array.isArray(br)) setBreaches(dedup(br));
      if (Array.isArray(tr)) setTrainings(tr);
    }
    setLoading(false);
  };

  const saveConfig = async (e) => {
    e.preventDefault();
    const res = await api.saveComplianceConfig(token, { ...configForm, apdpRegistered: configForm.apdpRegistered === 'true', internationalTransfer: configForm.internationalTransfer === 'true' });
    if (!res.error) { setConfig(res); setShowConfigModal(false); loadAll(); }
    else { showToast('Error al guardar configuración: ' + res.error); }
  };

  const createConsent = async (e) => {
    e.preventDefault();
    const res = await api.createComplianceConsent(token, { ...consentForm, dataCategories: consentForm.dataCategories.split(',').map(s => s.trim()) });
    if (res.error) { showToast('Error al registrar consentimiento: ' + res.error); return; }
    setShowConsentModal(false); setConsentForm({ titularEmail: '', titularName: '', titularRut: '', purpose: '', dataCategories: '', source: 'web_form' }); loadAll();
  };

  const revokeConsent = async (id) => {
    if (!window.confirm('¿Está seguro de revocar este consentimiento?')) return;
    const res = await api.revokeComplianceConsent(token, id);
    if (res.error) { showToast('Error al revocar consentimiento: ' + res.error); return; }
    loadAll();
  };

  const createInventory = async (e) => {
    e.preventDefault();
    const res = await api.createComplianceInventory(token, { ...invForm, sensitive: invForm.sensitive === 'true', retentionDays: parseInt(invForm.retentionDays), sharedWith: invForm.sharedWith ? invForm.sharedWith.split(',').map(s => s.trim()) : [], securityMeasures: invForm.securityMeasures ? invForm.securityMeasures.split(',').map(s => s.trim()) : [] });
    if (res.error) { showToast('Error al agregar al inventario: ' + res.error); return; }
    setShowInventoryModal(false); setInvForm({ category: 'clientes', dataType: 'email', sensitive: 'false', storage: 'local', storageLocation: '', retentionDays: '365', purpose: '', legalBasis: 'consent', sharedWith: '', securityMeasures: '', risk: 'medium' }); loadAll();
  };

  const deleteInventory = async (id) => {
    const res = await api.deleteComplianceInventory(token, id);
    if (!res.error) loadAll();
    else { showToast('Error al eliminar del inventario: ' + res.error); }
  };

  const updateInventoryItem = async (e) => {
    e.preventDefault();
    const data = { ...editInvItem, sensitive: editInvItem.sensitive === true || editInvItem.sensitive === 'true', retentionDays: parseInt(editInvItem.retentionDays) || 365, sharedWith: typeof editInvItem.sharedWith === 'string' ? editInvItem.sharedWith.split(',').map(s => s.trim()).filter(Boolean) : (editInvItem.sharedWith || []), securityMeasures: typeof editInvItem.securityMeasures === 'string' ? editInvItem.securityMeasures.split(',').map(s => s.trim()).filter(Boolean) : (editInvItem.securityMeasures || []) };
    const res = await api.updateComplianceInventory(token, editInvItem._id, data);
    if (!res.error) { setEditInvItem(null); showToast('Registro actualizado', 'success'); loadAll(); }
    else { showToast('Error: ' + res.error); }
  };

  const updateConsentItem = async (e) => {
    e.preventDefault();
    const res = await api.updateComplianceConsent(token, editConsentItem._id, editConsentItem);
    if (!res.error) { setEditConsentItem(null); showToast('Consentimiento actualizado', 'success'); loadAll(); }
    else { showToast('Error: ' + res.error); }
  };

  const reportBreach = async (e) => {
    e.preventDefault();
    const res = await api.reportComplianceBreach(token, { ...breachForm, affectedUsers: parseInt(breachForm.affectedUsers), sensitiveDataInvolved: breachForm.sensitiveDataInvolved === 'true', childrenDataInvolved: breachForm.childrenDataInvolved === 'true', economicDataInvolved: breachForm.economicDataInvolved === 'true', affectedData: breachForm.affectedData.split(',').map(s => s.trim()), containmentActions: breachForm.containmentActions ? breachForm.containmentActions.split(',').map(s => s.trim()) : [] });
    if (!res.error) { setShowBreachModal(false); setBreachForm({ type: 'hack', severity: 'high', description: '', affectedData: '', affectedUsers: '0', sensitiveDataInvolved: 'false', childrenDataInvolved: 'false', economicDataInvolved: 'false', rootCause: '', containmentActions: '' }); loadAll(); }
    else { showToast('Error al reportar brecha: ' + res.error); }
  };

  const openBreachResolveModal = (id) => {
    setBreachResolveModal(id);
    setBreachResolveType('');
    setBreachResolveNotes('');
  };

  const confirmBreachResolve = async () => {
    if (!breachResolveModal || !breachResolveType) return;
    setBreachResolving(true);
    const res = await api.resolveComplianceBreach(token, breachResolveModal, { status: 'resolved', resolvedType: breachResolveType, notes: breachResolveNotes });
    if (!res.error) { setBreachResolveModal(null); loadAll(); }
    else { showToast('Error al resolver brecha: ' + res.error); }
    setBreachResolving(false);
  };

  const resolveBreach = async (id) => {
    const res = await api.resolveComplianceBreach(token, id, { status: 'resolved' });
    if (!res.error) loadAll();
  };

  const createTraining = async (e) => {
    e.preventDefault();
    const res = await api.createComplianceTraining(token, { ...trainingForm });
    if (!res.error) { setShowTrainingModal(false); setTrainingForm({ employeeName: '', employeeEmail: '', employeeRut: '', employeePhone: '', employeePosition: '', employeeDepartment: '', topic: 'ley_21719', date: new Date().toISOString().split('T')[0], notes: '' }); loadAll(); }
    else { showToast('Error al crear capacitación: ' + res.error); }
  };

  const signDocument = (id) => {
    setSignTrainingId(id);
    setShowSignModal(true);
  };

  const saveSignature = async (signatureData) => {
    const res = await api.completeComplianceTraining(token, signTrainingId, { signatureData, signedAt: new Date().toISOString(), acknowledgedContent: true, acknowledgedAt: new Date().toISOString() });
    if (!res.error) { setShowSignModal(false); setSignTrainingId(null); loadAll(); }
    else { showToast('Error al guardar firma: ' + res.error); }
  };

  const deleteTraining = async (id) => {
    if (!confirm('¿Eliminar esta capacitación definitivamente?')) return;
    const res = await api.deleteComplianceTraining(token, id);
    if (!res.error) loadAll();
    else { showToast('Error al eliminar capacitación: ' + res.error); }
  };

  const unsignTraining = async (id) => {
    if (!confirm('¿Quitar la firma de esta capacitación? Podrá volver a firmarla después.')) return;
    const res = await api.unsignComplianceTraining(token, id);
    if (!res.error) loadAll();
    else { showToast('Error al quitar firma: ' + res.error); }
  };

  const openConsentInvite = () => {
    setInviteForm({ kind: 'consent', recipientEmail: '', recipientName: '', recipientRut: '', purpose: '', dataCategories: '', trainingId: '', expiresHours: '168' });
    setInviteResult(null);
    setInviteCopied(false);
    setShowInviteModal(true);
  };

  const openTrainingInvite = (tr) => {
    setInviteForm({ kind: 'training', recipientEmail: tr.employeeEmail || '', recipientName: tr.employeeName || '', recipientRut: tr.employeeRut || '', purpose: '', dataCategories: '', trainingId: tr._id, expiresHours: '168' });
    setInviteResult(null);
    setInviteCopied(false);
    setShowInviteModal(true);
  };

  const createInvite = async (sendEmail) => {
    if (inviteForm.kind === 'consent' && !inviteForm.purpose) { showToast('Indica la finalidad del consentimiento'); return; }
    if (sendEmail && !inviteForm.recipientEmail) { showToast('Indica el email del destinatario'); return; }
    setInviteSending(true);
    const res = await api.createComplianceInvite(token, {
      ...inviteForm,
      channel: sendEmail ? 'email' : 'link',
      sendEmail: sendEmail ? 'true' : 'false',
      baseUrl: window.location.origin,
    });
    setInviteSending(false);
    if (res.error) { showToast('Error al generar invitación: ' + res.error); return; }
    setInviteResult(res);
    if (sendEmail) {
      if (res.emailSent) showToast('Correo enviado a ' + inviteForm.recipientEmail, 'success');
      else showToast('Link generado, pero el correo falló: ' + (res.emailError || 'SMTP no configurado'));
    } else {
      showToast('Link de un solo uso generado', 'success');
    }
  };

  const copyInviteLink = async () => {
    if (!inviteResult?.url) return;
    try {
      await navigator.clipboard.writeText(inviteResult.url);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      showToast('No se pudo copiar el enlace');
    }
  };

  const openBulkModal = (kind) => {
    setBulkForm({ kind, purpose: '', dataCategories: '', topic: 'ley_21719', date: new Date().toISOString().split('T')[0], expiresHours: '168' });
    setBulkRecipients([]);
    setBulkResult(null);
    setBulkProgress(null);
    setShowBulkModal(true);
  };

  const parseCsvText = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
    let rows = lines.map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, '')));
    let map = { email: 0, name: 1, rut: 2, position: 3, department: 4 };
    const header = rows[0].map(h => h.toLowerCase());
    if (header.some(h => h.includes('email') || h.includes('correo'))) {
      map = {
        email: header.findIndex(h => h.includes('email') || h.includes('correo')),
        name: header.findIndex(h => h.includes('nombre') || h.includes('name')),
        rut: header.findIndex(h => h.includes('rut')),
        position: header.findIndex(h => h.includes('cargo') || h.includes('position')),
        department: header.findIndex(h => h.includes('depart')),
      };
      rows = rows.slice(1);
    }
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const seen = new Set();
    const out = [];
    for (const r of rows) {
      const email = (r[map.email] || '').toLowerCase();
      if (!emailRegex.test(email) || seen.has(email)) continue;
      seen.add(email);
      out.push({
        email,
        name: map.name >= 0 ? (r[map.name] || '') : '',
        rut: map.rut >= 0 ? (r[map.rut] || '') : '',
        position: map.position >= 0 ? (r[map.position] || '') : '',
        department: map.department >= 0 ? (r[map.department] || '') : '',
      });
    }
    return out;
  };

  const handleBulkFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsvText(String(reader.result || ''));
      setBulkRecipients(rows);
      if (!rows.length) showToast('No se encontraron emails válidos en el CSV');
      else showToast(rows.length + ' emails válidos detectados', 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const sendBulkInvites = async () => {
    if (bulkForm.kind === 'consent' && !bulkForm.purpose) { showToast('Indica la finalidad del consentimiento'); return; }
    if (!bulkRecipients.length) { showToast('Carga primero un CSV con emails'); return; }
    setBulkSending(true);
    const summary = { total: bulkRecipients.length, created: 0, emailsSent: 0, failed: [] };
    const BATCH = 100;
    for (let i = 0; i < bulkRecipients.length; i += BATCH) {
      const batch = bulkRecipients.slice(i, i + BATCH);
      setBulkProgress({ done: i, total: bulkRecipients.length });
      const res = await api.bulkComplianceInvites(token, {
        kind: bulkForm.kind,
        purpose: bulkForm.purpose,
        dataCategories: bulkForm.dataCategories,
        topic: bulkForm.topic,
        date: bulkForm.date,
        expiresHours: bulkForm.expiresHours,
        recipients: JSON.stringify(batch),
        baseUrl: window.location.origin,
        sendEmail: 'true',
      });
      if (res.error) {
        summary.failed.push(...batch.map(b => ({ email: b.email, error: res.error })));
        continue;
      }
      summary.created += res.created || 0;
      summary.emailsSent += res.emailsSent || 0;
      if (Array.isArray(res.failed)) summary.failed.push(...res.failed);
    }
    setBulkProgress({ done: bulkRecipients.length, total: bulkRecipients.length });
    setBulkResult(summary);
    setBulkSending(false);
    loadAll();
  };

  const generateTrainingReport = async () => {
    const res = await api.generateTrainingReport(token);
    if (!res.error && res.report?._id) {
      window.open('/api/reports/download/' + res.report._id + '?token=' + token, '_blank');
    }
    else if (res.error) { showToast('Error al generar reporte: ' + res.error); }
  };

  function SignaturePad({ onSave, onCancel }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [deviceType, setDeviceType] = useState(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }, []);

    const getPos = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      return { x, y };
    };

    const handlePointerDown = (e) => {
      e.preventDefault();
      canvasRef.current.setPointerCapture(e.pointerId);
      setDeviceType(e.pointerType);
      const { x, y } = getPos(e);
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    };

    const handlePointerMove = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      const ctx = canvasRef.current.getContext('2d');
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    };

    const handlePointerUp = (e) => {
      e.preventDefault();
      setIsDrawing(false);
    };

    const clear = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    };

    const handleSave = () => {
      const canvas = canvasRef.current;
      onSave(canvas.toDataURL('image/png'));
    };

    const deviceLabel = deviceType === 'pen' ? 'Lápiz / Dispositivo externo' : deviceType === 'touch' ? 'Táctil' : 'Ratón';

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-muted">
            {deviceType ? (
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${deviceType === 'pen' ? 'bg-green-400' : 'bg-blue-400'}`} />
                {deviceLabel}
              </span>
            ) : (
              <span>Dibuje su firma con el ratón, dedo o lápiz externo</span>
            )}
          </span>
        </div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full h-[160px] rounded-lg border border-border-theme cursor-crosshair touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-[11px] text-text-subtle">Firme aquí</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <Btn type="button" variant="secondary" onClick={clear}>Limpiar</Btn>
          <div className="flex gap-2">
            <Btn type="button" variant="secondary" onClick={onCancel}>Cancelar</Btn>
            <Btn type="button" onClick={handleSave} disabled={!hasSignature} className="flex items-center gap-1.5">
              {I.pen} Firmar Documento
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  const openConfigEdit = () => {
    if (config) {
      setConfigForm({
        companyRut: config.companyRut || '', companyName: config.companyName || '',
        dpdName: config.dpdName || '', dpdEmail: config.dpdEmail || '', dpdPhone: config.dpdPhone || '',
        apdpRegistered: config.apdpRegistered ? 'true' : 'false',
        privacyPolicyUrl: config.privacyPolicyUrl || '', cookiesPolicyUrl: config.cookiesPolicyUrl || '',
        dataRetentionPolicy: config.dataRetentionPolicy || '5 years',
        complianceLevel: config.complianceLevel || 'basic',
        internationalTransfer: config.internationalTransfer ? 'true' : 'false',
      });
    }
    setShowConfigModal(true);
  };

  const searchMap = {
    'inventario': 'inventory', 'dato': 'inventory', 'base de datos': 'inventory',
    'consentimiento': 'consents', 'titular': 'consents',
    'brecha': 'breaches', 'incidente': 'breaches',
    'capacitación': 'trainings', 'empleado': 'trainings', 'training': 'trainings',
    'seudonimización': 'pseudonymization', 'pseudo': 'pseudonymization',
    'dpia': 'dpia', 'impacto': 'dpia', 'evaluación': 'dpia',
    'dpa': 'dpa', 'encargado': 'dpa', 'procesador': 'dpa',
    'configuración': 'settings', 'config': 'settings', 'empresa': 'settings',
    'arco': 'arco', 'solicitud': 'arco',
    'reporte': 'reports', 'informe': 'reports', 'exportar': 'reports',
    'multa': 'violations', 'sanción': 'violations', 'infracción': 'violations',
    'overview': 'overview', 'dashboard': 'overview', 'inicio': 'overview',
  };
  useEffect(() => {
    if (!globalSearch.trim()) return;
    const term = globalSearch.toLowerCase().trim();
    for (const [key, tab] of Object.entries(searchMap)) {
      if (term.includes(key) || key.includes(term)) { setActiveTab(tab); return; }
    }
  }, [globalSearch]);

  const checklistStatus = (id) => {
    switch (id) {
      case 'dpd': return !!config?.dpdEmail;
      case 'apdp': return config?.apdpRegistered || false;
      case 'inventory': return inventory.length > 0;
      case 'privacy': return !!config?.privacyPolicyUrl;
      case 'consents': return consents.length > 0;
      case 'breach_protocol': return breaches.length > 0 || !!config?.companyName;
      case 'arco': return (config?.arcoUrls && Object.values(config.arcoUrls).some(v => v)) || !!config?.privacyPolicyUrl;
      case 'pseudonymization': return pseudoRules.some(r => r.status === 'executed') || inventory.some(i => (i.securityMeasures || []).some(m =>
        m.toLowerCase().includes('seudonim') || m.toLowerCase().includes('pseudonym')
      ));
      case 'incident_response': return breaches.some(b => b.status === 'resolved');
      case 'training': return trainings.length > 0;
      case 'transfer': return config?.internationalTransferCountries?.length > 0 || !config?.internationalTransfer;
      case 'audit': return stats?.auditLogCount > 0;
      default: return false;
    }
  };
  const checklistDone = CHECKLIST.filter(c => checklistStatus(c.id)).length;

  const handleChecklistAction = (id) => {
    switch (id) {
      case 'dpd':
      case 'apdp':
      case 'privacy':
      case 'transfer':
        openConfigEdit();
        break;
      case 'inventory':
        setShowInventoryModal(true);
        break;
      case 'consents':
      case 'breach_protocol':
        setActiveTab(id === 'consents' ? 'consents' : 'breaches');
        break;
      case 'arco':
        setShowArcoModal(true);
        break;
      case 'pseudonymization':
        setActiveTab('pseudonymization');
        break;
      case 'incident_response':
        setActiveTab('breaches');
        break;
      case 'training':
        setShowTrainingModal(true);
        break;
      case 'audit':
        navigate('/admin');
        break;
      default: break;
    }
  };

  const filteredConsents = consents.filter(c => {
    if (consentFilter === 'active' && c.revokedAt) return false;
    if (consentFilter === 'revoked' && !c.revokedAt) return false;
    if (consentSearch && !c.titularEmail?.toLowerCase().includes(consentSearch.toLowerCase())) return false;
    return true;
  });

  if (loading) return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tabs = [
    { id: 'overview', label: t('compliance.overview'), icon: I.shield, tip: 'Resumen general de cumplimiento.' },
    { id: 'inventory', label: t('compliance.inventory'), icon: I.database, tip: 'Bases de datos personales registradas.' },
    { id: 'consents', label: t('compliance.consents'), icon: I.check, tip: 'Consentimientos de titulares de datos.' },
    { id: 'breaches', label: t('compliance.breaches'), icon: I.alert, tip: 'Incidentes de seguridad y brechas.' },
    { id: 'pseudonymization', label: t('compliance.pseudonymization', 'Seudonimización'), icon: I.search, tip: 'Reglas de seudonimización de datos.' },
    { id: 'violations', label: 'Violaciones', icon: I.alert, tip: 'Infracciones y multas de la Ley 21.719.' },
    { id: 'dpia', label: 'Eval. Impacto', icon: I.shield, tip: 'Evaluaciones de impacto (DPIA).' },
    { id: 'dpa', label: 'Encargados', icon: I.users, tip: 'Acuerdos con encargados de tratamiento.' },
    { id: 'trainings', label: t('compliance.trainings', 'Capacitaciones'), icon: I.info, tip: 'Capacitación al personal en protección de datos.' },
    { id: 'reports', label: t('compliance.reports', 'Reportes'), icon: I.fileText, tip: 'Reportes y exportes de cumplimiento.' },
    { id: 'settings', label: t('compliance.settings', 'Configuración'), icon: I.settings, tip: 'Configuración de compliance de la empresa.' },
  ];

  const SectionHeader = ({ title, desc, action }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-5 md:mb-6">
      <div>
        <h3 className="text-[14px] md:text-[15px] font-semibold text-text-heading">{title}</h3>
        {desc && <p className="text-[11px] md:text-[12px] text-text-muted mt-1">{desc}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );

  const Table = ({ headers, children }) => (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-bg-base/60 border-b border-border-theme">
            {headers.map((h, i) => (
              <th key={i} className={`text-[9px] md:text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-3 md:px-4 ${h.align || 'text-left'}`}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-theme/30">
          {children}
        </tbody>
      </table>
    </div>
  );

  const PAGE_SIZE = 15;
  const Paginate = ({ items, page, setPage }) => {
    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    if (totalPages <= 1) return null;
    const start = page * PAGE_SIZE;
    return (
      <div className="flex items-center justify-between px-4 py-2 border-t border-border-theme/30">
        <span className="text-[10px] text-text-muted">{start + 1}–{Math.min(start + PAGE_SIZE, items.length)} de {items.length}</span>
        <div className="flex gap-1">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-2 py-0.5 text-[10px] rounded bg-bg-panel border border-border-theme text-text-muted hover:text-text-heading disabled:opacity-30 disabled:cursor-not-allowed transition-all">← Anterior</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} className={`px-2 py-0.5 text-[10px] rounded border transition-all ${page === i ? 'bg-accent-subtle border-primary-500/30 text-accent' : 'bg-bg-panel border-border-theme text-text-muted hover:text-text-heading'}`}>{i + 1}</button>
          )).slice(0, 7)}
          {totalPages > 7 && <span className="text-[10px] text-text-subtle px-1">...</span>}
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-2 py-0.5 text-[10px] rounded bg-bg-panel border border-border-theme text-text-muted hover:text-text-heading disabled:opacity-30 disabled:cursor-not-allowed transition-all">Siguiente →</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="sticky top-0 z-30 bg-bg-base border-b border-white/[0.04] flex-shrink-0">
        <div className="w-full px-4 md:px-8 pt-4 pb-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Cumplimiento normativo · Ley 21.719</p>
                <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">{tabs.find(t => t.id === activeTab)?.label || 'Compliance'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 md:ml-auto">
              <div className="hidden sm:flex items-center bg-bg-base border border-white/[0.04] rounded-xl px-3 py-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent-subtle transition-all">
                <span className="text-text-subtle">{I.search}</span>
                <input
                  type="text"
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  placeholder="Buscar sección..."
                  className="bg-transparent border-none text-[11px] text-text-heading placeholder-text-subtle focus:outline-none w-28 md:w-44 ml-1.5"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="w-full px-4 md:px-8 pb-0">
          <nav className="hidden md:flex gap-1 -mb-px overflow-x-auto">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive ? 'border-accent text-text-heading' : 'border-transparent text-text-muted hover:text-text-body hover:border-white/[0.1]'
                  }`}>
                  <span className={isActive ? 'text-accent' : 'text-text-subtle'}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
          <nav className="md:hidden pb-3">
            <select value={activeTab} onChange={e => setActiveTab(e.target.value)}
              className="w-full bg-bg-base border border-white/[0.04] text-text-heading text-[12px] rounded-xl px-3 py-2 appearance-none focus:outline-none focus:border-accent">
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto theme-scrollbar tour-detail-1">
        {activeTab === 'overview' && (
          <div className="p-4 md:p-8 w-full space-y-4 md:space-y-6">
            <RiskBanner now={now} />
            <OnboardingWizard checklistStatus={checklistStatus} setActiveTab={setActiveTab} openConfigEdit={openConfigEdit} setShowInventoryModal={setShowInventoryModal} setShowConsentModal={setShowConsentModal} setShowTrainingModal={setShowTrainingModal} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              <RiskScoreCard risk={estimateLegalRisk(checklistDone, CHECKLIST, breaches, arcoRequests)} />
              <StatCard icon={I.shield} label={t('compliance.complianceLabel', 'Nivel Cumplimiento')} value={`${Math.round(checklistDone / CHECKLIST.length * 100)}%`} color={checklistDone / CHECKLIST.length >= 0.7 ? 'text-emerald-400' : checklistDone / CHECKLIST.length >= 0.4 ? 'text-amber-400' : 'text-red-400'} sub={`${checklistDone}/${CHECKLIST.length} requisitos cumplidos`}  info="Porcentaje de cumplimiento de la Ley 21.719." />
              <StatCard icon={I.users} label={t('compliance.activeConsents', 'Consentimientos Activos')} value={stats?.activeConsents ?? consents.filter(c => !c.revokedAt).length} color="text-cyan-400" sub={`Total: ${stats?.totalConsents ?? consents.length}`} info="Consentimientos válidos de titulares de datos." />
              <StatCard icon={I.database} label={t('compliance.inventoryItems', 'Datos Registrados')} value={stats?.inventoryItems ?? inventory.length} color="text-indigo-400" sub={`${stats?.sensitiveItems ?? inventory.filter(i => i.sensitive).length} sensibles`} info="Bases de datos personales en el inventario." />
              <StatCard icon={I.alert} label={t('compliance.activeBreaches', 'Incidentes Activos')} value={stats?.activeBreaches ?? breaches.filter(b => b.status !== 'resolved').length} color={breaches.some(b => b.status !== 'resolved') ? 'text-red-400' : 'text-emerald-400'} sub={`${stats?.totalBreaches ?? breaches.length} total · ${stats?.criticalBreaches ?? breaches.filter(b => b.severity === 'critical').length} críticos`}  info="Incidentes de seguridad pendientes de resolución." />
              <StatCard icon={I.info} label="Capacitaciones" value={stats?.completedTrainings ?? trainings.filter(t => t.completed).length} color="text-amber-400" sub={`${stats?.totalTrainings ?? trainings.length} registradas`} info="Empleados capacitados en protección de datos." />
            </div>

            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[14px] md:text-[15px] font-semibold text-text-heading">Tendencias de Cumplimiento</h3>
                  <p className="text-[11px] md:text-[12px] text-text-muted mt-1">Evolución de métricas clave en el último periodo</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Cumplimiento', desc: 'Requisitos legales cumplidos', color: '#34d399', suffix: '%', current: `${Math.round(checklistDone / CHECKLIST.length * 100)}%`, data: [20, 35, 45, checklistDone / CHECKLIST.length * 100] },
                  { label: 'Consentimientos', desc: 'Consentimientos registrados', color: '#22d3ee', suffix: '', current: String(consents.length), data: [0, Math.max(1, consents.length * 0.3), Math.max(1, consents.length * 0.6), consents.length] },
                  { label: 'Datos registrados', desc: 'Ítems en el inventario', color: '#818cf8', suffix: '', current: String(inventory.length), data: [0, Math.max(1, inventory.length * 0.25), Math.max(1, inventory.length * 0.5), inventory.length] },
                  { label: 'Capacitaciones', desc: 'Empleados capacitados', color: '#fbbf24', suffix: '', current: String(trainings.length), data: [0, Math.max(1, trainings.length * 0.2), Math.max(1, trainings.length * 0.5), trainings.length] },
                ].map((m, i) => (
                  <div key={i} className="p-4 rounded-xl bg-bg-base/40 border border-border-theme/50 hover:border-border-theme transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-[10px] text-text-subtle uppercase tracking-wider">{m.label}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{m.desc}</p>
                      </div>
                      <span className="text-[20px] font-bold leading-none" style={{ color: m.color }}>{m.current}</span>
                    </div>
                    <div className="mt-3">
                      <MiniChart data={m.data} color={m.color} height={50} suffix={m.suffix} label={m.label} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[9px] text-text-subtle">
                      <span>Inicio</span>
                      <span>Hoy</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <div className="flex items-start justify-between gap-6 mb-5">
                <div>
                  <h3 className="text-[15px] font-semibold text-text-heading">{t('compliance.checklistTitle', 'Checklist de Cumplimiento Ley 21.719')}</h3>
                  <p className="text-[12px] text-text-muted mt-1">Requisitos legales obligatorios para la protección de datos personales</p>
                </div>
                <div className="text-right flex-shrink-0 flex items-start gap-1.5">
                  <span className={`text-[32px] font-bold leading-none ${checklistDone / CHECKLIST.length >= 0.7 ? 'text-emerald-400' : checklistDone / CHECKLIST.length >= 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>{Math.round(checklistDone / CHECKLIST.length * 100)}%</span>
                  <InfoTooltip text="Progreso general de cumplimiento legal." placement="left" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-bg-elevated/50 rounded-full h-2.5 mb-6">
                  <div className={`h-full rounded-full transition-all duration-700 ${
                    checklistDone / CHECKLIST.length >= 0.7 ? 'bg-emerald-500' : checklistDone / CHECKLIST.length >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} style={{ width: `${checklistDone / CHECKLIST.length * 100}%` }} />
                </div>
                <div className="mb-6"><InfoTooltip text="Progreso del checklist de cumplimiento." placement="left" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CHECKLIST.map(item => {
                  const done = checklistStatus(item.id);
                  return (
                    <div key={item.id} onClick={() => !done && handleChecklistAction(item.id)}
                      className={`flex items-start gap-3 p-4 rounded-lg transition-colors ${
                        done ? 'bg-emerald-500/[0.04]' : 'bg-bg-base/40 hover:bg-bg-elevated/40 cursor-pointer'
                      }`}>
                      <span className={`mt-0.5 ${done ? 'text-emerald-400' : 'text-text-subtle'}`}>{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[12px] font-medium ${done ? 'text-emerald-300' : 'text-text-muted'}`}>{item.label}</span>
                            {done
                                ? <Badge color="green" icon={I.check}>Cumple <InfoTooltip text="Requisito cumplido." /></Badge>
                                : <Badge color="red" icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>}>Pendiente <InfoTooltip text="Requisito pendiente." /></Badge>
                          }
                        </div>
                        <p className="text-[11px] text-text-subtle mt-1">{item.desc}</p>
                      </div>
                      {!done && <span className="text-[10px] text-accent font-medium flex-shrink-0 self-center ml-2">Completar →</span>}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <h3 className="text-[15px] font-semibold text-white mb-5 flex items-center gap-2">{t('compliance.quickActions', 'Acciones Rápidas')}<InfoTooltip text="Atajos para las tareas de compliance más comunes." /></h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <button onClick={() => setShowConfigModal(true)}
                  className="flex flex-row sm:flex-col items-center gap-3 p-3 md:p-5 rounded-lg bg-bg-base/40 hover:bg-bg-elevated/40 transition-all text-text-muted hover:text-text-heading group text-left sm:text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-bg-elevated/60 flex items-center justify-center text-accent transition-colors">
                    {I.settings}
                  </div>
                  <span className="text-[11px] md:text-[12px] font-medium">Configurar Empresa <InfoTooltip text="Configuración general, DPD y políticas de la empresa" placement="bottom" /></span>
                </button>
                <button onClick={() => setShowInventoryModal(true)}
                  className="flex flex-row sm:flex-col items-center gap-3 p-3 md:p-5 rounded-lg bg-bg-base/40 hover:bg-bg-elevated/40 transition-all text-text-muted hover:text-text-heading group text-left sm:text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-bg-elevated/60 flex items-center justify-center text-indigo-400 transition-colors flex-shrink-0">
                    {I.database}
                  </div>
                  <span className="text-[11px] md:text-[12px] font-medium">Agregar Datos <InfoTooltip text="Registrar nuevas categorías de datos personales en el inventario" placement="bottom" /></span>
                </button>
                <button onClick={() => setShowConsentModal(true)}
                  className="flex flex-row sm:flex-col items-center gap-3 p-3 md:p-5 rounded-lg bg-bg-base/40 hover:bg-bg-elevated/40 transition-all text-text-muted hover:text-text-heading group text-left sm:text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-bg-elevated/60 flex items-center justify-center text-emerald-400 transition-colors flex-shrink-0">
                    {I.check}
                  </div>
                  <span className="text-[11px] md:text-[12px] font-medium">Nuevo Consentimiento <InfoTooltip text="Registrar el consentimiento explícito de un titular de datos" placement="bottom" /></span>
                </button>
                <button onClick={() => setShowTrainingModal(true)}
                  className="flex flex-row sm:flex-col items-center gap-3 p-3 md:p-5 rounded-lg bg-bg-base/40 hover:bg-bg-elevated/40 transition-all text-text-muted hover:text-text-heading group text-left sm:text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-bg-elevated/60 flex items-center justify-center text-yellow-400 transition-colors flex-shrink-0">
                    {I.info}
                  </div>
                  <span className="text-[11px] md:text-[12px] font-medium">Nueva Capacitación <InfoTooltip text="Registrar empleado capacitado en protección de datos" placement="bottom" /></span>
                </button>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    config?.dpdEmail ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {config?.dpdEmail ? I.users : I.alert}
                  </div>
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{t('compliance.dpd', 'Delegado de Protección')} <InfoTooltip text="Designación obligatoria del Delegado de Protección (Art. 28)" placement="right" /></h4>
                </div>
                {config?.dpdEmail ? (
                  <div className="space-y-2">
                    <p className="text-[13px] text-white font-medium">{config.dpdName || t('compliance.notSpecified', 'No especificado')}</p>
                    <p className="text-[11px] text-text-muted font-mono">{config.dpdEmail}</p>
                    {config.dpdPhone && <p className="text-[11px] text-text-muted">{config.dpdPhone}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/60 animate-pulse" />
                    <p className="text-[12px] text-text-subtle">{t('compliance.notAssigned', 'No asignado - Requerido por ley')}</p>
                  </div>
                )}
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    config?.apdpRegistered ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {config?.apdpRegistered ? I.shield : I.alert}
                  </div>
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{t('compliance.apdp', 'Registro APDP')} <InfoTooltip text="Registro obligatorio ante la Agencia de Protección de Datos" placement="right" /></h4>
                </div>
                {config?.apdpRegistered ? (
                  <div className="space-y-2">
                    <p className="text-[13px] text-emerald-400 font-medium flex items-center gap-1.5">{I.check} {t('compliance.registered', 'Registrado')}</p>
                    {config.apdpRegistrationDate && <p className="text-[11px] text-text-subtle">{t('compliance.since', 'Desde:')} <span className="text-text-muted">{new Date(config.apdpRegistrationDate).toLocaleDateString('es-CL')}</span></p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/60 animate-pulse" />
                    <p className="text-[12px] text-text-subtle">{t('compliance.notRegistered', 'No registrado - Obligatorio')}</p>
                  </div>
                )}
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    trainings.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {trainings.length > 0 ? I.check : I.alert}
                  </div>
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Capacitación <InfoTooltip text="Programa de formación en protección de datos para empleados" placement="right" /></h4>
                </div>
                {trainings.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[13px] text-emerald-400 font-medium flex items-center gap-1.5">{I.check} {trainings.filter(t => t.completed).length} completadas</p>
                    <p className="text-[11px] text-text-muted">{trainings.length} capacitaciones registradas</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/60 animate-pulse" />
                    <p className="text-[12px] text-text-subtle">Sin capacitaciones registradas</p>
                  </div>
                )}
                <button onClick={() => setShowTrainingViewModal(true)} className="mt-3 text-[10px] text-accent hover:text-primary-300 font-medium">Ver todas →</button>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 text-accent flex items-center justify-center">
                    {I.info}
                  </div>
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{t('compliance.level', 'Nivel de Cumplimiento')} <InfoTooltip text="Nivel de certificación de cumplimiento normativo" placement="right" /></h4>
                </div>
                <p className="text-[22px] font-bold text-white capitalize mb-2 tracking-tight">{config?.complianceLevel ? t(`compliance.${config.complianceLevel}`, config.complianceLevel) : t('compliance.basic', 'Básico')}</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    config?.complianceLevel === 'certified' ? 'bg-emerald-400' : config?.complianceLevel === 'advanced' ? 'bg-blue-400' : config?.complianceLevel === 'intermediate' ? 'bg-yellow-400' : 'bg-gray-500'
                  }`} />
                  <span className={`text-[11px] font-medium ${
                    config?.complianceLevel === 'certified' ? 'text-emerald-400' : config?.complianceLevel === 'advanced' ? 'text-blue-400' : config?.complianceLevel === 'intermediate' ? 'text-yellow-400' : 'text-text-muted'
                  }`}>{config?.complianceLevel ? t(`compliance.${config.complianceLevel}`, config.complianceLevel) : t('compliance.basic', 'Básico')}</span>
                </div>
                {config?.nextAudit && <p className="text-[11px] text-text-subtle mb-1">{t('compliance.nextAudit', 'Próxima auditoría:')} <span className="text-text-muted">{new Date(config.nextAudit).toLocaleDateString('es-CL')}</span></p>}
                {config?.lastAudit && <p className="text-[11px] text-text-subtle">{t('compliance.lastAudit', 'Última:')} <span className="text-text-muted">{new Date(config.lastAudit).toLocaleDateString('es-CL')}</span></p>}
              </Card>
            </div>

            <Card className="p-4 md:p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">Ley 21.719 — Línea de Tiempo de Implementación <InfoTooltip text="Cronología de hitos legales para implementación." placement="right" /></h3>
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-bg-elevated/60" />
                <div className="space-y-4">
                  {[
                    { date: '13 Dic 2024', title: 'Publicación de la Ley', desc: 'Se publica la Ley 21.719 en el Diario Oficial, iniciando el período de 24 meses para su implementación.', done: true },
                    { date: '2025', title: 'Implementación de la APDP', desc: 'La Agencia de Protección de Datos Personales debe comenzar a operar. Se definen sus facultades, estructura y presupuesto.', done: false },
                    { date: '13 Dic 2026', title: 'Fin del Período de Transición', desc: 'Todas las empresas deben estar en cumplimiento. La APDP comienza a fiscalizar y aplicar multas de hasta 20.000 UTM (~$1.400M).', done: false, urgent: true },
                    { date: '2027+', title: 'Régimen Sancionatorio Pleno', desc: 'Comienza la aplicación efectiva de multas y sanciones. Las empresas no adecuadas enfrentan multas gravísimas que pueden triplicarse por reincidencia.', done: false },
                  ].map((milestone, i) => (
                    <div key={i} className="relative flex items-start gap-4">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 text-[9px] font-bold ${
                        milestone.done ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' :
                        milestone.urgent ? 'border-red-500 bg-red-500/20 text-red-400' :
                        'border-gray-600 bg-gray-600/20 text-text-muted'
                      }`}>
                        {milestone.done ? '✓' : milestone.urgent ? '!' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono ${milestone.done ? 'text-emerald-400' : milestone.urgent ? 'text-red-400' : 'text-text-muted'}`}>{milestone.date}</span>
                          <span className="text-[12px] font-semibold text-text-heading">{milestone.title}</span>
                        </div>
                        <p className="text-[11px] text-text-muted mt-0.5">{milestone.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="p-4 md:p-8 w-full">
            <SectionHeader title={t('compliance.inventoryTitle', 'Inventario de Datos Personales')} desc="Registro de todas las bases de datos personales bajo tratamiento"
              action={<div className="flex gap-2"><Btn onClick={() => setShowInventoryModal(true)} className="flex items-center gap-1.5">{I.plus} {t('compliance.addItem')}</Btn>{inventory.length > 0 && <Btn onClick={() => { if (window.confirm('¿Eliminar todo el inventario? Esta acción no se puede deshacer.')) { api.deleteAllComplianceInventory(token).then(() => loadAll()); } }} variant="danger" className="flex items-center gap-1.5">{I.trash} {t('compliance.deleteAll', 'Eliminar todo')}</Btn>}</div>} />
            {inventory.length === 0 ? (
                  <Card className="p-12 text-center">
                <div className="w-14 h-14 rounded-xl bg-bg-elevated/60 flex items-center justify-center mx-auto mb-4 text-text-muted">{I.database}</div>
                <p className="text-[13px] text-text-subtle mb-4">{t('compliance.noInventory')}</p>
                <Btn onClick={() => setShowInventoryModal(true)} className="flex items-center gap-1.5 mx-auto">{I.plus} {t('compliance.firstItem', 'Primer Item')}<InfoTooltip text="Agregar primera categoría de datos." /></Btn>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <Table headers={[
                  { label: <span className="flex items-center gap-1">{t('compliance.category')}<InfoTooltip text="Grupo de titulares (clientes, empleados, etc.)" /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.dataType')}<InfoTooltip text="Tipo de dato personal registrado." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.legalBasis')}<InfoTooltip text="Fundamento legal del tratamiento." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.risk')}<InfoTooltip text="Nivel de riesgo del tratamiento." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.sensitive')}<InfoTooltip text="Datos sensibles requieren consentimiento explícito." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.storage')}<InfoTooltip text="Dónde se almacenan los datos." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.retention', 'Retención')}<InfoTooltip text="Tiempo máximo de conservación." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.action', 'Acción')}<InfoTooltip text="Eliminar registro del inventario." /></span>, align: 'text-center' },
                ]}>
                  {inventory.slice(invPage * PAGE_SIZE, (invPage + 1) * PAGE_SIZE).map((item, i) => (
                    <tr key={item._id || i} className="border-t border-border-theme/30 hover:bg-bg-base/40 transition-colors">
                      <td className="py-3.5 px-4 text-white text-[12px] font-medium">{item.category}</td>
                      <td className="py-3.5 px-4 text-text-body text-[12px]">{item.dataType}</td>
                      <td className="py-3.5 px-4 text-text-muted text-[12px]">{item.legalBasis}</td>
                      <td className="py-3.5 px-4"><Badge color={item.risk === 'critical' ? 'red' : item.risk === 'high' ? 'yellow' : item.risk === 'medium' ? 'blue' : 'gray'}>{item.risk} <InfoTooltip text={item.risk === 'critical' ? 'Requiere acción inmediata.' : item.risk === 'high' ? 'Riesgo alto de tratamiento.' : item.risk === 'medium' ? 'Riesgo medio controlable.' : 'Riesgo bajo documentado.'} placement="right" /></Badge></td>
                      <td className="py-3.5 px-4">{item.sensitive ? <Badge color="red">{t('compliance.yes', 'Sí')}</Badge> : <span className="text-text-muted text-[12px]">{t('compliance.no', 'No')}</span>}</td>
                      <td className="py-3.5 px-4 text-text-muted text-[12px]">{item.storage}</td>
                      <td className="py-3.5 px-4 text-text-muted text-[12px]">{item.retentionDays ? `${item.retentionDays}d` : '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditInvItem(item)} className="text-accent/60 hover:text-accent p-1.5 rounded hover:bg-primary-500/10 transition-colors" title="Editar registro">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button onClick={() => deleteInventory(item._id)} className="text-red-400/60 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"><InfoTooltip text="Eliminar este registro." placement="left" />{I.trash}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
                <Paginate items={inventory} page={invPage} setPage={setInvPage} />
              </Card>
            )}
          </div>
        )}

        {activeTab === 'consents' && (
          <div className="p-4 md:p-8 w-full">
              <SectionHeader title={t('compliance.consents')} desc="Gestión de consentimientos de titulares de datos"
                action={<div className="flex items-center gap-2 md:gap-3 flex-wrap">
                  <div className="relative flex-1 md:flex-none">
                    <input value={consentSearch} onChange={e => setConsentSearch(e.target.value)} placeholder={t('compliance.searchByEmail', 'Buscar por email...')}
                      className="w-full md:w-52 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-accent placeholder-text-subtle" />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle">{I.search}</span>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2"><InfoTooltip text="Filtrar consentimientos por email." /></span>
                  </div>
                  <Sel value={consentFilter} onChange={e => setConsentFilter(e.target.value)} options={[{ value: 'all', label: t('compliance.all', 'Todos') }, { value: 'active', label: t('compliance.active', 'Activos') }, { value: 'revoked', label: t('compliance.revoked', 'Revocados') }]} className="w-full md:w-28" /> <InfoTooltip text="Filtrar por estado del consentimiento." />
                  <Btn onClick={() => openBulkModal('consent')} variant="secondary" className="flex items-center gap-1.5">{I.upload || I.plus} CSV Masivo<InfoTooltip text="Sube un CSV con emails y envía solicitudes de consentimiento en lotes de 100." /></Btn>
                  <Btn onClick={openConsentInvite} variant="secondary" className="flex items-center gap-1.5">{I.mail || I.globe} Solicitar<InfoTooltip text="Enviar solicitud de consentimiento por correo, link o QR de un solo uso." /></Btn>
                  <Btn onClick={() => setShowConsentModal(true)} className="flex items-center gap-1.5">{I.plus} {t('compliance.new', 'Nuevo')}<InfoTooltip text="Registrar nuevo consentimiento." /></Btn>
              </div>} />
            {filteredConsents.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-14 h-14 rounded-xl bg-bg-elevated/60 flex items-center justify-center mx-auto mb-4 text-text-muted">{I.check}</div>
                <p className="text-[13px] text-text-subtle mb-4">{t('compliance.noConsents')}</p>
                <Btn onClick={() => setShowConsentModal(true)}>{I.plus} {t('compliance.registerConsent', 'Registrar Consentimiento')}</Btn>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <Table headers={[
                  { label: <span className="flex items-center gap-1">{t('compliance.titularEmail')}<InfoTooltip text="Email del titular que otorgó el consentimiento." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.name', 'Nombre')}<InfoTooltip text="Nombre completo del titular." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.purpose')}<InfoTooltip text="Finalidad para la que se recabó el consentimiento." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.status', 'Estado')}<InfoTooltip text="Activo, revocado o expirado." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.granted')}<InfoTooltip text="Fecha en que se otorgó el consentimiento." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.expires', 'Expira')}<InfoTooltip text="Fecha de expiración si aplica." /></span> },
                  { label: <span className="flex items-center gap-1">{t('compliance.action', 'Acción')}<InfoTooltip text="Revocar o eliminar consentimiento." /></span>, align: 'text-center' },
                ]}>
                  {filteredConsents.slice(consentPage * PAGE_SIZE, (consentPage + 1) * PAGE_SIZE).map((c, i) => (
                    <tr key={c._id || i} className="border-t border-border-theme/30 hover:bg-bg-base/40 transition-colors">
                      <td className="py-3.5 px-4 text-white font-mono text-[12px]">{c.titularEmail}</td>
                      <td className="py-3.5 px-4 text-text-muted text-[12px]">{c.titularName || '-'}</td>
                      <td className="py-3.5 px-4 text-text-body text-[12px] max-w-[240px] truncate">{c.purpose}</td>
                      <td className="py-3.5 px-4">{c.revokedAt ? <Badge color="red" icon={I.xmark}>{t('compliance.revoked')}<InfoTooltip text="Consentimiento revocado." /></Badge> : <Badge color="green" icon={I.check}>{t('compliance.active', 'Activo')}<InfoTooltip text="Consentimiento vigente." /></Badge>}</td>
                      <td className="py-3.5 px-4 text-text-muted text-[12px]">{new Date(c.grantedAt).toLocaleDateString('es-CL')}</td>
                      <td className="py-3.5 px-4 text-text-muted text-[12px]">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('es-CL') : '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setEditConsentItem(c)} className="text-accent/60 hover:text-accent p-1.5 rounded hover:bg-primary-500/10 transition-colors" aria-label="Editar consentimiento" title="Editar consentimiento">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          {!c.revokedAt && <Btn onClick={() => revokeConsent(c._id)} variant="danger" size="sm">{t('compliance.revoke')}<InfoTooltip text="Revocar este consentimiento." /></Btn>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
                <Paginate items={filteredConsents} page={consentPage} setPage={setConsentPage} />
              </Card>
            )}
          </div>
        )}

        {activeTab === 'breaches' && (
          <div className="p-4 md:p-8 w-full">
            <SectionHeader title={t('compliance.breaches')} desc="Registro de incidentes de seguridad y violaciones de datos"
              action={<Btn onClick={() => setShowBreachModal(true)} className="flex items-center gap-1.5">{I.plus} {t('compliance.reportBreach')}<InfoTooltip text="Reportar un nuevo incidente." /></Btn>} />
            {breaches.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-14 h-14 rounded-xl bg-bg-elevated/60 flex items-center justify-center mx-auto mb-4 text-text-muted">{I.shield}</div>
                <p className="text-[13px] text-emerald-400 font-medium mb-2">{t('compliance.noBreaches')}</p>
                <p className="text-[12px] text-text-subtle">{t('compliance.breachesDesc', 'Mantén un registro de cualquier incidente de seguridad que afecte datos personales.')}</p>
              </Card>
            ) : (
              <Card className="overflow-hidden mb-5">
                <Table headers={[
                  { label: <span className="flex items-center gap-1">Fecha<InfoTooltip text="Fecha de detección del incidente." /></span> },
                  { label: <span className="flex items-center gap-1">Plazo APDP<InfoTooltip text="Tiempo restante para notificar a la APDP (72h)." /></span> },
                  { label: <span className="flex items-center gap-1">Tipo<InfoTooltip text="Categoría del incidente de seguridad." /></span> },
                  { label: <span className="flex items-center gap-1">Severidad<InfoTooltip text="Nivel de gravedad del incidente." /></span> },
                  { label: <span className="flex items-center gap-1">Estado<InfoTooltip text="Resuelto, reportado o investigando." /></span> },
                  { label: <span className="flex items-center gap-1">Afectados<InfoTooltip text="Número de titulares afectados." /></span> },
                  { label: <span className="flex items-center gap-1">Datos<InfoTooltip text="Tipo de datos comprometidos." /></span> },
                  { label: <span className="flex items-center gap-1">APDP<InfoTooltip text="Si se notificó a la Agencia." /></span> },
                  { label: <span className="flex items-center gap-1">CSIRT<InfoTooltip text="Si se reportó al CSIRT Nacional." /></span> },
                  { label: <span className="flex items-center gap-1"><InfoTooltip text="Ver detalle o resolver incidente." /></span>, align: 'text-center' },
                ]}>
                  {dedup(breaches).map((b, i) => (
                    <tr key={b._id || i} className={`border-t border-border-theme/30 hover:bg-bg-base/40 transition-colors ${b.severity === 'critical' ? 'bg-red-500/[0.02]' : ''}`}>
                      <td className="py-3 px-3 text-text-muted text-[11px] whitespace-nowrap">{new Date(b.detectedAt).toLocaleDateString('es-CL')}</td>
                      {(() => {
                        const remaining = getBreachRemainingMs(b);
                        const expired = remaining !== null && remaining <= 0;
                        const urgent = remaining !== null && remaining > 0 && remaining < 12 * 3600000;
                        return (
                          <td className="py-3 px-3 whitespace-nowrap">
                            {b.status === 'resolved' ? <span className="text-[10px] text-text-subtle">-</span> : remaining === null ? <span className="text-[10px] text-text-subtle">-</span> : (
                              <Badge color={expired ? 'red' : urgent ? 'yellow' : 'blue'} icon={expired ? I.alert : null}>
                                {expired ? 'Vencido' : formatCountdown(remaining)}
                                <InfoTooltip text={expired ? 'Fuera de plazo legal de 72h.' : 'Tiempo restante para notificar a APDP.'} placement="right" />
                              </Badge>
                            )}
                          </td>
                        );
                      })()}
                      <td className="py-3 px-3 text-white text-[11px] capitalize">{b.type.replace(/_/g, ' ')}</td>
                       <td className="py-3 px-3"><Badge color={b.severity === 'critical' ? 'red' : b.severity === 'high' ? 'yellow' : 'blue'}>{b.severity}<InfoTooltip text={b.severity === 'critical' ? 'Urgente: notificar a APDP.' : b.severity === 'high' ? 'Reportar a la brevedad.' : 'Monitorear evolución.'} placement="right" /></Badge></td>
                       <td className="py-3 px-3"><Badge color={b.status === 'resolved' ? 'green' : b.status === 'reported' ? 'yellow' : b.status === 'investigating' ? 'blue' : 'red'}>{b.status}<InfoTooltip text={b.status === 'resolved' ? 'Incidente cerrado.' : b.status === 'reported' ? 'Notificado a autoridad.' : b.status === 'investigating' ? 'En análisis forense.' : 'Pendiente de acción.'} placement="right" /></Badge></td>
                       <td className="py-3 px-3 text-text-muted text-[11px]">{b.affectedUsers || '-'}</td>
                       <td className="py-3 px-3 text-[10px]">
                        <div className="flex flex-wrap gap-1">
                          {b.sensitiveDataInvolved && <Badge color="red">Sensibles <InfoTooltip text="Datos sensibles comprometidos." placement="right" /></Badge>}
                          {b.childrenDataInvolved && <Badge color="yellow">Niños <InfoTooltip text="Datos de menores afectados." placement="right" /></Badge>}
                          {b.economicDataInvolved && <Badge color="blue">Econ. <InfoTooltip text="Datos económicos afectados." placement="right" /></Badge>}
                          {!b.sensitiveDataInvolved && !b.childrenDataInvolved && !b.economicDataInvolved && <span className="text-text-subtle">-</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3">{b.notifiedAPDP ? <Badge color="green" icon={I.check}>Sí <InfoTooltip text="Notificado a la APDP." placement="right" /></Badge> : <Badge color="red" icon={I.xmark}>No <InfoTooltip text="Pendiente notificación APDP." placement="right" /></Badge>}</td>
                       <td className="py-3 px-3">{b.reportToCSIRT ? <Badge color="green" icon={I.check}>Sí <InfoTooltip text="Reportado al CSIRT Nacional." placement="right" /></Badge> : <Badge color="gray">No <InfoTooltip text="No reportado al CSIRT." placement="right" /></Badge>}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button onClick={() => { setSelectedBreach(b); setShowBreachDetailModal(true); }} className="text-accent/60 hover:text-accent p-1.5 rounded hover:bg-primary-500/10 transition-colors" aria-label="Ver detalle del incidente" title="Ver detalle"><InfoTooltip text="Ver detalle del incidente." placement="left" />{I.search}</button>
                        {b.status !== 'resolved' && <Btn onClick={() => openBreachResolveModal(b._id)} variant="success" size="sm" className="ml-1">{t('compliance.resolve', 'Resolver')}<InfoTooltip text="Marcar incidente como resuelto." placement="left" /></Btn>}
                      </td>
                    </tr>
                  ))}
                </Table>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-400">{I.alert}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Plazo APDP <InfoTooltip text="Tiempo límite para notificar a la autoridad" placement="right" /></span>
                </div>
                <p className="text-[12px] text-text-body font-medium">72 horas</p>
                <p className="text-[10px] text-text-subtle mt-1">Notificar a la APDP por los medios más expeditos posibles sin dilaciones indebidas (Art. 26 Ley 21.719)</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400">{I.users}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Afectados <InfoTooltip text="Titulares que deben ser notificados individualmente" placement="right" /></span>
                </div>
                <p className="text-[12px] text-text-body font-medium">Notificación a Titulares</p>
                <p className="text-[10px] text-text-subtle mt-1">Si la brecha afecta datos sensibles, niños o datos económicos, debes informar individualmente a los titulares</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400">{I.shield}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">CSIRT Nacional <InfoTooltip text="Centro de respuesta a incidentes informáticos" placement="right" /></span>
                </div>
                <p className="text-[12px] text-text-body font-medium">3h / 72h</p>
                <p className="text-[10px] text-text-subtle mt-1">Alerta temprana en 3h · Reporte completo en 72h (Ley 21.663 Marco de Ciberseguridad)</p>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'pseudonymization' && (
          <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
            <SectionHeader title={t('compliance.pseudonymization', 'Seudonimización')} desc="Reemplazo de identificadores directos por seudónimos (Art. 30)" action={<Btn onClick={async () => { const res = await api.getPseudonymizationRules(token).catch(() => null); if (res && !res.error && Array.isArray(res)) setPseudoRules(res); setPseudoForm({ name: '', description: '', method: 'hash', databaseId: '', databaseName: '', tableName: '', columnName: '' }); setShowPseudoModal(true); }}>+ Nueva Regla</Btn>} />

            {pseudoRules.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-text-subtle text-[13px] mb-3">No hay reglas de seudonimización configuradas.</div>
                <p className="text-[11px] text-text-subtle">Crea una regla para registrar qué datos serán seudonimizados y marca su ejecución como evidencia de cumplimiento.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {pseudoRules.map(r => (
                  <Card key={r._id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          r.status === 'executed' ? 'bg-emerald-500/10 text-emerald-400' :
                          r.status === 'active' ? 'bg-blue-500/10 text-blue-400' :
                          r.status === 'reverted' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-bg-elevated text-text-muted'
                        }`}>{I.search}</div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-white truncate">{r.name}</p>
                          <p className="text-[11px] text-text-muted truncate">{r.description || r.method}{r.tableName ? ` en ${r.tableName}.${r.columnName}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          r.status === 'executed' ? 'bg-emerald-500/10 text-emerald-400' :
                          r.status === 'active' ? 'bg-blue-500/10 text-blue-400' :
                          r.status === 'reverted' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-bg-elevated text-text-muted'
                        }`}>{r.status}</span>
                        {r.status === 'draft' || r.status === 'active' ? (
                          <button onClick={async () => { await api.executePseudonymizationRule(token, r._id); const res = await api.getPseudonymizationRules(token); if (Array.isArray(res)) setPseudoRules(res); }}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">Ejecutar <InfoTooltip text="Aplica la seudonimización a los datos indicados." /></button>
                        ) : r.status === 'executed' ? (
                          <button onClick={async () => { await api.revertPseudonymizationRule(token, r._id); const res = await api.getPseudonymizationRules(token); if (Array.isArray(res)) setPseudoRules(res); }}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors">Revertir <InfoTooltip text="Deshace la seudonimización y restaura los datos originales." /></button>
                        ) : null}
                        <button onClick={async () => { await api.deletePseudonymizationRule(token, r._id); const res = await api.getPseudonymizationRules(token); if (Array.isArray(res)) setPseudoRules(res); }}
                          className="text-[11px] px-2 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Eliminar <InfoTooltip text="Eliminar regla de seudonimización." /></button>
                      </div>
                    </div>
                    {r.executedAt && <p className="text-[10px] text-text-subtle mt-2">Ejecutada: {new Date(r.executedAt).toLocaleString('es')}</p>}
                    {r.revertedAt && <p className="text-[10px] text-text-subtle mt-1">Revertida: {new Date(r.revertedAt).toLocaleString('es')}</p>}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="p-4 md:p-8 w-full space-y-4 md:space-y-6">
            <SectionHeader title="Violaciones y Sanciones — Ley 21.719" desc="Infracciones clasificadas según su gravedad y las multas asociadas en UTM" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 border-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-400">{I.alert}</span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Leves <InfoTooltip text="Infracciones formales sin daño directo a titulares" placement="right" /></span>
                </div>
                <p className="text-[28px] font-bold text-yellow-400">{violations.filter(v => v.severity === 'leve').length}</p>
                <p className="text-[11px] text-text-muted mt-1">Multa hasta 5.000 UTM</p>
              </Card>
              <Card className="p-5 border-orange-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-orange-400">{I.alert}</span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Graves <InfoTooltip text="Infracciones que afectan derechos o involucran datos sensibles" placement="right" /></span>
                </div>
                <p className="text-[28px] font-bold text-orange-400">{violations.filter(v => v.severity === 'grave').length}</p>
                <p className="text-[11px] text-text-muted mt-1">Multa hasta 10.000 UTM</p>
              </Card>
              <Card className="p-5 border-red-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-red-400">{I.alert}</span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Gravísimas <InfoTooltip text="Las multas más altas, pueden triplicarse por reincidencia" placement="right" /></span>
                </div>
                <p className="text-[28px] font-bold text-red-400">{violations.filter(v => v.severity === 'gravisima').length}</p>
                <p className="text-[11px] text-text-muted mt-1">Multa hasta 20.000 UTM (triplicable por reincidencia)</p>
              </Card>
            </div>

            <Card className="p-4 md:p-6">
              <h3 className="text-[15px] font-semibold text-white mb-1">Régimen de Infracciones</h3>
              <p className="text-[12px] text-text-muted mb-5">La Ley 21.719 establece un régimen sancionatorio progresivo. Las multas son determinadas por la APDP considerando la gravedad, el daño causado, la reincidencia y la capacidad económica del infractor.</p>

              <div className="space-y-2">
                {violations.map((v, i) => {
                  const sevColor = v.severity === 'gravisima' ? 'red' : v.severity === 'grave' ? 'orange' : 'yellow';
                  const sevLabel = v.severity === 'gravisima' ? 'Gravísima' : v.severity === 'grave' ? 'Grave' : 'Leve';
                  return (
                    <div key={v.id} className="p-4 rounded-lg bg-bg-base/40 border border-border-theme/50 hover:border-surface-600/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          sevColor === 'red' ? 'bg-red-500/10 text-red-400' :
                          sevColor === 'orange' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>{I.alert}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-medium text-text-heading">{v.title}</span>
                            <Badge color={sevColor}>{sevLabel}</Badge>
                            <span className="text-[9px] text-primary-500 font-mono">{v.art}</span>
                          </div>
                          <p className="text-[11px] text-text-muted mt-1">{v.desc}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-semibold text-red-400">{v.fine}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <h3 className="text-[15px] font-semibold text-white mb-3">Referencias Legales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <p className="text-text-body font-medium mb-1">Art. 34 — Infracciones Leves</p>
                  <p className="text-text-muted">Incumplimientos formales que no afectan directamente los derechos de los titulares. Multa de hasta 5.000 UTM (~$35M CLP).</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <p className="text-text-body font-medium mb-1">Art. 34 — Infracciones Graves</p>
                  <p className="text-text-muted">Incumplimientos que afectan derechos de los titulares o involucran datos sensibles. Multa de hasta 10.000 UTM (~$70M CLP).</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <p className="text-text-body font-medium mb-1">Art. 34 — Infracciones Gravísimas</p>
                  <p className="text-text-muted">Incumplimientos graves como no reportar brechas, no registrar APDP o violar datos de niños. Multa de hasta 20.000 UTM (~$140M CLP).</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <p className="text-text-body font-medium mb-1">Art. 35 — Reincidencia</p>
                  <p className="text-text-muted">Si dentro de 2 años se comete una nueva infracción de igual o mayor gravedad, la multa puede triplicarse, alcanzando hasta 60.000 UTM (~$420M CLP).</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <p className="text-text-body font-medium mb-1">Art. 36 — Criterios de Graduación</p>
                  <p className="text-text-muted">La APDP considera: naturaleza de la infracción, gravedad del daño, reincidencia, capacidad económica, colaboración con la investigación y medidas correctivas adoptadas.</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <p className="text-text-body font-medium mb-1">Art. 37 — Prescripción</p>
                  <p className="text-text-muted">Las infracciones leves prescriben en 1 año, las graves en 2 años y las gravísimas en 3 años desde su comisión o desde que cesaron si son continuas.</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-red-500/[0.03] border-red-500/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0">{I.alert}</div>
                <div>
                  <h4 className="text-[13px] font-semibold text-white mb-1">Período de Transición — 13 Dic 2026</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Las empresas tienen hasta el <strong className="text-red-400">13 de diciembre de 2026</strong> para cumplir con todos los requisitos de la Ley 21.719. 
                    A partir de esa fecha, la APDP comenzará a fiscalizar y aplicar las multas descritas. 
                    Se recomienda iniciar el proceso de adecuación lo antes posible para evitar sanciones.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'dpia' && (
          <div className="p-4 md:p-8 w-full space-y-4 md:space-y-6">
            <SectionHeader title="Evaluación de Impacto — DPIA" desc="Evaluación de riesgos para tratamientos de alto riesgo (Art. 14 quater / Art. 16)"
              action={<div className="flex items-center gap-2"><Btn onClick={() => { setEditingDpia(null); setDpiaForm({ title: '', description: '', responsibleName: '', responsibleDept: '', processingPurpose: '', dataCategories: '', dataSubjects: 'customers', legalBasis: 'consent', riskJustification: '', mitigationMeasures: '', sensitiveData: 'false', childrenData: 'false', largeScale: 'false', automatedDecisions: 'false', profiling: 'false', biometricData: 'false', geolocationData: 'false', videoSurveillance: 'false', crossBorderTransfer: 'false', vulnerableSubjects: 'false', systematicMonitoring: 'false', newTechnologies: 'false' }); setShowDpiaModal(true); }} className="flex items-center gap-1.5">{I.plus} Nueva DPIA</Btn><InfoTooltip text="Crear evaluación de impacto." placement="left" /></div>} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-accent">{I.shield}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Total DPIAs <InfoTooltip text="Evaluaciones de impacto registradas." placement="top" /></span>
                </div>
                <p className="text-[24px] font-bold text-white mt-1">{dpiaItems.length}</p>
              </Card>
              <Card className="p-5 border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400">{I.check}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Aprobadas</span>
                  <InfoTooltip text="DPIAs aprobadas y conformes." placement="top" />
                </div>
                <p className="text-[24px] font-bold text-emerald-400 mt-1">{dpiaItems.filter(d => d.status === 'approved').length}</p>
              </Card>
              <Card className="p-5 border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400">{I.alert}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Riesgo Alto/Crítico</span>
                  <InfoTooltip text="Tratamientos con nivel de riesgo elevado." placement="top" />
                </div>
                <p className="text-[24px] font-bold text-yellow-400 mt-1">{dpiaItems.filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical').length}</p>
              </Card>
              <Card className="p-5 border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-400">{I.xmark}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Requieren Revisión</span>
                  <InfoTooltip text="DPIAs pendientes de revisión o rechazadas." placement="top" />
                </div>
                <p className="text-[24px] font-bold text-red-400 mt-1">{dpiaItems.filter(d => d.status === 'needs_revision' || d.status === 'rejected').length}</p>
              </Card>
            </div>

            {dpiaItems.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-14 h-14 rounded-xl bg-bg-elevated/60 flex items-center justify-center mx-auto mb-4 text-text-muted">{I.shield}</div>
                <p className="text-[13px] text-text-subtle mb-2">No hay evaluaciones de impacto registradas.</p>
                <p className="text-[11px] text-text-subtle mb-4">Las DPIAs son obligatorias para tratamientos de alto riesgo según Art. 14 quater de la Ley 21.719.</p>
                <Btn onClick={() => { setEditingDpia(null); setDpiaForm({ title: '', description: '', responsibleName: '', responsibleDept: '', processingPurpose: '', dataCategories: '', dataSubjects: 'customers', legalBasis: 'consent', riskJustification: '', mitigationMeasures: '', sensitiveData: 'false', childrenData: 'false', largeScale: 'false', automatedDecisions: 'false', profiling: 'false', biometricData: 'false', geolocationData: 'false', videoSurveillance: 'false', crossBorderTransfer: 'false', vulnerableSubjects: 'false', systematicMonitoring: 'false', newTechnologies: 'false' }); setShowDpiaModal(true); }} className="flex items-center gap-1.5 mx-auto">{I.plus} Crear Primera DPIA</Btn>
              </Card>
            ) : (
              <div className="space-y-3">
                {dpiaItems.map(d => {
                  const riskColor = d.riskLevel === 'critical' ? 'red' : d.riskLevel === 'high' ? 'yellow' : d.riskLevel === 'medium' ? 'blue' : 'gray';
                  const statusColor = d.status === 'approved' ? 'green' : d.status === 'rejected' ? 'red' : d.status === 'in_review' ? 'blue' : d.status === 'needs_revision' ? 'yellow' : 'gray';
                  return (
                    <Card key={d._id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[14px] font-semibold text-text-heading">{d.title}</h4>
                            <Badge color={riskColor}>{d.riskLevel === 'not_assessed' ? 'Sin evaluar' : d.riskLevel}</Badge>
                            <Badge color={statusColor}>{d.status === 'in_review' ? 'En revisión' : d.status === 'needs_revision' ? 'Necesita revisión' : d.status.charAt(0).toUpperCase() + d.status.slice(1)}</Badge>
                          </div>
                          <p className="text-[11px] text-text-muted mt-1">{d.description || d.processingPurpose}</p>
                          <div className="flex items-center gap-4 mt-3 text-[11px] text-text-muted">
                            {d.responsibleName && <span>Responsable: <span className="text-text-muted">{d.responsibleName}</span></span>}
                            {d.dataSubjects && <span>Sujetos: <span className="text-text-muted capitalize">{d.dataSubjects.replace('_', ' ')}</span></span>}
                            {d.riskScore !== undefined && <span>Score: <span className="text-text-muted font-mono">{d.riskScore}/100</span></span>}
                            <span>Creado: <span className="text-text-muted">{new Date(d.createdAt).toLocaleDateString('es-CL')}</span></span>
                          </div>
                          {d.mitigationMeasures?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {(Array.isArray(d.mitigationMeasures) ? d.mitigationMeasures : String(d.mitigationMeasures).split(',').map(s => s.trim())).filter(Boolean).map((m, i) => (
                                <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-bg-elevated text-text-muted">{m}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-3">
                            {d.sensitiveData && <Badge color="red">Datos sensibles</Badge>}
                            {d.childrenData && <Badge color="yellow">Niños</Badge>}
                            {d.automatedDecisions && <Badge color="blue">Decisiones automatizadas</Badge>}
                            {d.biometricData && <Badge color="indigo">Biométricos</Badge>}
                            {d.crossBorderTransfer && <Badge color="red">Transferencia internacional</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {d.status === 'draft' && (
                            <button onClick={async () => { await api.approveComplianceDPIA(token, d._id, {}); const res = await api.getComplianceDPIAs(token); if (Array.isArray(res)) setDpiaItems(res); }}
                              className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">Aprobar<InfoTooltip text="Aprobar la evaluación DPIA." /></button>
                          )}
                          <button onClick={() => {
                            setEditingDpia(d);
                            setDpiaForm({
                              title: d.title || '', description: d.description || '', responsibleName: d.responsibleName || '', responsibleDept: d.responsibleDept || '',
                              processingPurpose: d.processingPurpose || '', dataCategories: Array.isArray(d.dataCategories) ? d.dataCategories.join(', ') : d.dataCategories || '',
                              dataSubjects: d.dataSubjects || 'customers', legalBasis: d.legalBasis || 'consent',
                              riskJustification: d.riskJustification || '', mitigationMeasures: Array.isArray(d.mitigationMeasures) ? d.mitigationMeasures.join(', ') : d.mitigationMeasures || '',
                              sensitiveData: d.sensitiveData ? 'true' : 'false', childrenData: d.childrenData ? 'true' : 'false',
                              largeScale: d.largeScale ? 'true' : 'false', automatedDecisions: d.automatedDecisions ? 'true' : 'false',
                              profiling: d.profiling ? 'true' : 'false', biometricData: d.biometricData ? 'true' : 'false',
                              geolocationData: d.geolocationData ? 'true' : 'false', videoSurveillance: d.videoSurveillance ? 'true' : 'false',
                              crossBorderTransfer: d.crossBorderTransfer ? 'true' : 'false', vulnerableSubjects: d.vulnerableSubjects ? 'true' : 'false',
                              systematicMonitoring: d.systematicMonitoring ? 'true' : 'false', newTechnologies: d.newTechnologies ? 'true' : 'false',
                            });
                            setShowDpiaModal(true);
                          }} className="text-[11px] px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">Editar<InfoTooltip text="Editar esta DPIA." /></button>
                          <button onClick={async () => { if (!confirm('¿Eliminar esta DPIA definitivamente?')) return; await api.deleteComplianceDPIA(token, d._id); const res = await api.getComplianceDPIAs(token); if (Array.isArray(res)) setDpiaItems(res); }}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Eliminar<InfoTooltip text="Eliminar esta DPIA." /></button>
                        </div>
                      </div>
                      {d.approvedAt && (
                        <div className="mt-3 pt-3 border-t border-white/[0.04] text-[10px] text-text-subtle">
                          Aprobada por {d.approvedBy || '-'} el {new Date(d.approvedAt).toLocaleDateString('es-CL')}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            <Card className="p-4 md:p-6 bg-primary-500/[0.03] border-primary-500/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-accent flex-shrink-0">{I.info}</div>
                <div>
                  <h4 className="text-[13px] font-semibold text-white mb-1">¿Cuándo es obligatoria una DPIA?</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Según el <strong className="text-text-heading">Art. 14 quater</strong> de la Ley 21.719, la Evaluación de Impacto es obligatoria cuando el tratamiento presente 
                    <strong className="text-text-heading"> riesgos específicos para los derechos y libertades de los titulares</strong>, en particular cuando se utilicen nuevas tecnologías, 
                    se realicen decisiones automatizadas, se traten datos sensibles, biométricos, de niños, o se realice vigilancia masiva.
                  </p>
                  <p className="text-[11px] text-text-muted mt-2">
                    La APDP puede exigir la DPIA en cualquier momento y, si no se ha realizado, puede constituir una infracción grave.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'dpa' && (
          <div className="p-4 md:p-8 w-full space-y-4 md:space-y-6">
            <SectionHeader title="Acuerdos con Encargados de Tratamiento — DPA" desc="Contratos con procesadores externos de datos personales (Art. 9)"
              action={<Btn onClick={() => { setEditingDpa(null); setDpaForm({ processorName: '', processorRut: '', processorContactName: '', processorEmail: '', processorPhone: '', processorAddress: '', serviceDescription: '', dataCategories: '', dataSubjects: 'customers', processingPurpose: '', contractDate: '', expirationDate: '', contractReference: '', securityMeasures: '', internationalTransfer: 'false', transferCountry: '', transferGuarantees: '', status: 'draft', subProcessors: '', notes: '' }); setShowDpaModal(true); }} className="flex items-center gap-1.5">{I.plus} Nuevo DPA<InfoTooltip text="Registrar acuerdo con encargado." /></Btn>} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-5">
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider flex items-center gap-1">Total Encargados <InfoTooltip text="Acuerdos con procesadores externos." placement="top" /></p>
                <p className="text-[24px] font-bold text-white mt-1">{dpaItems.length}</p>
              </Card>
              <Card className="p-5 border-emerald-500/20">
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider flex items-center gap-1">Activos <InfoTooltip text="DPAs vigentes y en vigor." placement="top" /></p>
                <p className="text-[24px] font-bold text-emerald-400 mt-1">{dpaItems.filter(d => d.status === 'active').length}</p>
              </Card>
              <Card className="p-5 border-yellow-500/20">
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider flex items-center gap-1">En revisión <InfoTooltip text="DPAs pendientes de aprobación." placement="top" /></p>
                <p className="text-[24px] font-bold text-yellow-400 mt-1">{dpaItems.filter(d => d.status === 'under_review').length}</p>
              </Card>
              <Card className="p-5 border-red-500/20">
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider flex items-center gap-1">Vencidos <InfoTooltip text="DPAs con fecha de vencimiento pasada." placement="top" /></p>
                <p className="text-[24px] font-bold text-red-400 mt-1">{dpaItems.filter(d => d.status === 'expired').length}</p>
              </Card>
            </div>

            {dpaItems.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-14 h-14 rounded-xl bg-bg-elevated/60 flex items-center justify-center mx-auto mb-4 text-text-muted">{I.users}</div>
                <p className="text-[13px] text-text-subtle mb-2">No hay acuerdos con encargados registrados.</p>
                <p className="text-[11px] text-text-subtle mb-4">Los DPAs son obligatorios cuando un tercero trata datos personales por cuenta del responsable (Art. 9 Ley 21.719).</p>
                <Btn onClick={() => { setEditingDpa(null); setDpaForm({ processorName: '', processorRut: '', processorContactName: '', processorEmail: '', processorPhone: '', processorAddress: '', serviceDescription: '', dataCategories: '', dataSubjects: 'customers', processingPurpose: '', contractDate: '', expirationDate: '', contractReference: '', securityMeasures: '', internationalTransfer: 'false', transferCountry: '', transferGuarantees: '', status: 'draft', subProcessors: '', notes: '' }); setShowDpaModal(true); }} className="flex items-center gap-1.5 mx-auto">{I.plus} Registrar Primer DPA</Btn>
              </Card>
            ) : (
              <div className="space-y-3">
                {dpaItems.map(d => {
                  const statusColor = d.status === 'active' ? 'green' : d.status === 'expired' ? 'red' : d.status === 'terminated' ? 'gray' : d.status === 'under_review' ? 'yellow' : 'blue';
                  const isExpiring = d.expirationDate && new Date(d.expirationDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                  return (
                    <Card key={d._id} className={`p-5 ${isExpiring ? 'border-yellow-500/30' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[14px] font-semibold text-text-heading">{d.processorName}</h4>
                            <Badge color={statusColor}>{d.status === 'under_review' ? 'En revisión' : d.status}</Badge>
                            {isExpiring && <Badge color="yellow">Por vencer</Badge>}
                            {d.internationalTransfer && <Badge color="red">Transf. internacional</Badge>}
                          </div>
                          <p className="text-[11px] text-text-muted mt-1">{d.serviceDescription}</p>
                          <div className="flex items-center gap-4 mt-3 text-[11px] text-text-muted flex-wrap">
                            {d.processorEmail && <span>Contacto: <span className="text-text-muted font-mono">{d.processorEmail}</span></span>}
                            {d.processorRut && <span>RUT: <span className="text-text-muted">{d.processorRut}</span></span>}
                            {d.contractDate && <span>Contrato: <span className="text-text-muted">{new Date(d.contractDate).toLocaleDateString('es-CL')}</span></span>}
                            {d.expirationDate && <span>Vence: <span className={`${isExpiring ? 'text-yellow-400' : 'text-text-muted'}`}>{new Date(d.expirationDate).toLocaleDateString('es-CL')}</span></span>}
                          </div>
                          {d.securityMeasures?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {d.securityMeasures.map((m, i) => (
                                <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-bg-elevated text-text-muted">{m}</span>
                              ))}
                            </div>
                          )}
                          {d.contractReference && <p className="text-[10px] text-text-subtle mt-2">Ref: {d.contractReference}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => {
                            setEditingDpa(d);
                            setDpaForm({
                              processorName: d.processorName || '', processorRut: d.processorRut || '', processorContactName: d.processorContactName || '',
                              processorEmail: d.processorEmail || '', processorPhone: d.processorPhone || '', processorAddress: d.processorAddress || '',
                              serviceDescription: d.serviceDescription || '', dataCategories: Array.isArray(d.dataCategories) ? d.dataCategories.join(', ') : d.dataCategories || '',
                              dataSubjects: d.dataSubjects || 'customers', processingPurpose: d.processingPurpose || '',
                              contractDate: d.contractDate ? new Date(d.contractDate).toISOString().split('T')[0] : '',
                              expirationDate: d.expirationDate ? new Date(d.expirationDate).toISOString().split('T')[0] : '',
                              contractReference: d.contractReference || '', securityMeasures: Array.isArray(d.securityMeasures) ? d.securityMeasures.join(', ') : d.securityMeasures || '',
                              internationalTransfer: d.internationalTransfer ? 'true' : 'false', transferCountry: d.transferCountry || '',
                              transferGuarantees: d.transferGuarantees || '', status: d.status || 'draft',
                              subProcessors: Array.isArray(d.subProcessors) ? JSON.stringify(d.subProcessors) : d.subProcessors || '',
                              notes: d.notes || '',
                            });
                            setShowDpaModal(true);
                          }} className="text-[11px] px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">Editar<InfoTooltip text="Editar este DPA." /></button>
                          <button onClick={async () => { if (!confirm('¿Eliminar este DPA definitivamente?')) return; await api.deleteComplianceDPA(token, d._id); const res = await api.getComplianceDPAs(token); if (Array.isArray(res)) setDpaItems(res); }}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Eliminar<InfoTooltip text="Eliminar este DPA." /></button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card className="p-4 md:p-6 bg-primary-500/[0.03] border-primary-500/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-accent flex-shrink-0">{I.info}</div>
                <div>
                  <h4 className="text-[13px] font-semibold text-white mb-1">¿Qué dice el Art. 9?</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    El <strong className="text-text-heading">Art. 9</strong> de la Ley 21.719 establece que cuando el responsable del tratamiento contrate a un tercero 
                    (<strong className="text-text-heading">encargado del tratamiento</strong>) para procesar datos personales, debe suscribir un 
                    <strong className="text-text-heading"> contrato o acuerdo legal</strong> que regule las obligaciones en materia de protección de datos, 
                    incluyendo las medidas de seguridad, la confidencialidad, y las instrucciones del tratamiento.
                  </p>
                  <p className="text-[11px] text-text-muted mt-2">
                    El encargado solo puede tratar los datos según las instrucciones documentadas del responsable y debe implementar medidas técnicas y organizativas adecuadas.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'trainings' && (
          <div className="p-4 md:p-8 w-full">
            <SectionHeader title="Capacitaciones Ley 21.719" desc="Registro de empleados capacitados en protección de datos personales — Art. 28 letra c)"
              action={<div className="flex gap-2">
                <Btn onClick={() => openBulkModal('training')} variant="secondary" className="flex items-center gap-1.5">{I.upload || I.plus} CSV Masivo<InfoTooltip text="Sube un CSV con empleados: se crean las capacitaciones y se envían las solicitudes de firma por correo en lotes de 100." /></Btn>
                <Btn onClick={() => setShowTrainingModal(true)} className="flex items-center gap-1.5">{I.plus} Agregar Empleado</Btn>
              </div>} />
            {trainings.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-14 h-14 rounded-xl bg-bg-elevated/60 flex items-center justify-center mx-auto mb-4 text-text-muted">{I.info}</div>
                <p className="text-[13px] text-text-subtle mb-4">No hay empleados registrados en capacitaciones.</p>
                <p className="text-[11px] text-text-subtle mb-4">Agrega empleados y solicita su firma digital como constancia de haber recibido la capacitación sobre la Ley 21.719.</p>
                <Btn onClick={() => setShowTrainingModal(true)} className="flex items-center gap-1.5 mx-auto">{I.plus} Agregar Primer Empleado</Btn>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <Table headers={[
                  { label: <span className="flex items-center gap-1">Empleado<InfoTooltip text="Nombre del empleado capacitado." /></span> },
                  { label: <span className="flex items-center gap-1">RUT<InfoTooltip text="Identificación del empleado." /></span> },
                  { label: <span className="flex items-center gap-1">Contacto<InfoTooltip text="Email y teléfono del empleado." /></span> },
                  { label: <span className="flex items-center gap-1">Cargo / Depto.<InfoTooltip text="Posición y departamento del empleado." /></span> },
                  { label: <span className="flex items-center gap-1">Tema<InfoTooltip text="Tema de la capacitación recibida." /></span> },
                  { label: <span className="flex items-center gap-1">Fecha<InfoTooltip text="Fecha de la capacitación." /></span> },
                  { label: <span className="flex items-center gap-1">Estado<InfoTooltip text="Completado o pendiente de firma." /></span> },
                  { label: <span className="flex items-center gap-1">Firma<InfoTooltip text="Firma digital como constancia." /></span> },
                  { label: 'Acción', align: 'text-center' },
                ]}>
                  {trainings.map((tr, i) => (
                    <tr key={tr._id || i} className="border-t border-border-theme/30 hover:bg-bg-base/40 transition-colors">
                      <td className="py-3 px-3 text-white text-[12px] font-medium">{tr.employeeName}</td>
                      <td className="py-3 px-3 text-text-muted text-[11px] font-mono">{tr.employeeRut || '-'}</td>
                      <td className="py-3 px-3">
                        <div className="text-[11px] text-text-body">{tr.employeeEmail}</div>
                        {tr.employeePhone && <div className="text-[10px] text-text-muted">{tr.employeePhone}</div>}
                      </td>
                      <td className="py-3 px-3 text-text-muted text-[11px]">
                        {tr.employeePosition || '-'}{tr.employeeDepartment ? ` · ${tr.employeeDepartment}` : ''}
                      </td>
                      <td className="py-3 px-3 text-text-body text-[11px] max-w-[140px] truncate">{tr.topic}</td>
                      <td className="py-3 px-3 text-text-muted text-[11px] whitespace-nowrap">{new Date(tr.date).toLocaleDateString('es-CL')}</td>
                      <td className="py-3 px-3">
                        <Badge color={tr.completed ? 'green' : 'yellow'}>{tr.completed ? 'Completado' : 'Pendiente'}</Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {tr.signatureData ? (
                          <div className="flex flex-col items-center gap-1">
                            <img src={tr.signatureData} alt="Firma" className="h-7 rounded border border-border-theme bg-bg-panel" />
                            <span className="text-[8px] text-text-subtle">{tr.signedAt ? new Date(tr.signedAt).toLocaleDateString('es-CL') : ''}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-subtle">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!tr.signatureData ? (
                            <>
                            <button onClick={() => signDocument(tr._id)}
                              className="text-[10px] text-accent hover:text-primary-300 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-500/10">
                              {I.pen} Firmar<InfoTooltip text="Firmar constancia de capacitación." />
                            </button>
                            <button onClick={() => openTrainingInvite(tr)}
                              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-cyan-500/10">
                              Solicitar<InfoTooltip text="Enviar solicitud de firma al empleado por correo, link o QR de un solo uso." />
                            </button>
                            </>
                          ) : (
                            <button onClick={() => unsignTraining(tr._id)}
                              className="text-[10px] text-yellow-400 hover:text-yellow-300 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-yellow-500/10">
                              {I.pen} Refirmar<InfoTooltip text="Volver a firmar documento." />
                            </button>
                          )}
                          <button onClick={() => deleteTraining(tr._id)}
                            className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10">
                            {I.trash}<InfoTooltip text="Eliminar capacitación." />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
              </Card>
            )}
            {trainings.length > 0 && (
              <div className="flex justify-end mt-4">
                <Btn onClick={generateTrainingReport} className="flex items-center gap-1.5">
                  {I.download} Generar Reporte PDF<InfoTooltip text="Exportar informe de capacitaciones." placement="left" />
                </Btn>
              </div>
            )}

            <Card className="p-4 md:p-6 mt-6">
              <h3 className="text-[15px] font-semibold text-white mb-3">Empleados Capacitados</h3>
              <p className="text-[12px] text-text-muted mb-5">Resumen de capacitaciones realizadas al personal de la empresa según Art. 28 letra c) de la Ley 21.719.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Total Empleados <InfoTooltip text="Total de empleados registrados en capacitaciones." /></p>
                  <p className="text-[24px] font-bold text-white mt-1">{trainings.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Completados <InfoTooltip text="Empleados que completaron la capacitación." /></p>
                  <p className="text-[24px] font-bold text-emerald-400 mt-1">{trainings.filter(t => t.completed).length}</p>
                </div>
                <div className="p-4 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Pendientes Firma <InfoTooltip text="Empleados que aún no firman la constancia." /></p>
                  <p className="text-[24px] font-bold text-yellow-400 mt-1">{trainings.filter(t => !t.signatureData).length}</p>
                </div>
                <div className="p-4 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Firmados <InfoTooltip text="Empleados con firma digital registrada." /></p>
                  <p className="text-[24px] font-bold text-cyan-400 mt-1">{trainings.filter(t => !!t.signatureData).length}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
            <SectionHeader title={t('compliance.reportsTitle', 'Reportes de Cumplimiento')} desc="Genera y exporta informes de estado de cumplimiento según Ley 21.719" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5">
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">Nivel de Cumplimiento <InfoTooltip text="Nivel actual de cumplimiento normativo de la empresa" /></p>
                <p className="text-[28px] font-bold text-white mb-1 capitalize">{config?.complianceLevel ? t(`compliance.${config.complianceLevel}`, config.complianceLevel) : 'Básico'}</p>
                <div className="w-full bg-bg-elevated/50 rounded-full h-2 mt-2">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.round((checklistDone / CHECKLIST.length) * 100)}%` }} />
                </div>
                <p className="text-[11px] text-text-muted mt-2">{checklistDone}/{CHECKLIST.length} requisitos cumplidos</p>
              </Card>
              <Card className="p-5">
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">Brechas Reportadas <InfoTooltip text="Total de incidentes de seguridad registrados" /></p>
                <p className="text-[28px] font-bold text-white mb-1">{stats?.totalBreaches ?? breaches.length}</p>
                <div className="flex items-center gap-3 text-[11px] mt-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> {stats?.activeBreaches ?? breaches.filter(b => b.status !== 'resolved').length} activas</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {stats?.completedTrainings ?? breaches.filter(b => b.status === 'resolved').length} resueltas</span>
                </div>
              </Card>
              <Card className="p-5">
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">Solicitudes ARCO <InfoTooltip text="Solicitudes de derechos ARCO recibidas de titulares" /></p>
                <p className="text-[28px] font-bold text-white mb-1">{stats?.arcoStats?.total ?? 0}</p>
                <div className="flex items-center gap-3 text-[11px] mt-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> {stats?.arcoStats?.pending ?? 0} pendientes</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {stats?.arcoStats?.completed ?? 0} completadas</span>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <Card className="p-4 md:p-6 hover:border-cyan-500/40 transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">{I.fileText}</div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-text-heading">ROPA — Registro de Actividades de Tratamiento</h4>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">Exporte el Registro de Actividades de Tratamiento en formato oficial APDP (Art. 15). Listo para presentar ante la Agencia en fiscalizaciones.</p>
                    <div className="flex items-center gap-2 mt-4">
                      <a href={api.exportComplianceROPA(token)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-all duration-200">
                        {I.download} Exportar ROPA<InfoTooltip text="Descargar ROPA formato APDP." placement="right" />
                      </a>
                      <span className="text-[9px] text-text-subtle">{inventory.length} items registrados</span>
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 md:p-6 hover:border-cyan-500/40 transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">{I.shield}</div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-text-heading">Reporte de Brechas</h4>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">Informe detallado de todas las violaciones de datos registradas, severidad, estado de notificación APDP y CSIRT, y acciones tomadas.</p>
                    <div className="flex items-center gap-2 mt-4">
                      <Btn onClick={() => setActiveTab('breaches')} variant="secondary">Ver Brechas <InfoTooltip text="Ir al listado de incidentes." placement="right" /></Btn>
                      <span className="text-[9px] text-text-subtle">{breaches.filter(b => b.status !== 'resolved').length} activas</span>
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 md:p-6 hover:border-emerald-500/40 transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">{I.check}</div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-text-heading">Resumen ARCO + Capacitaciones</h4>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">Resumen de solicitudes ARCO recibidas y capacitaciones realizadas al personal. Control de plazos legales de respuesta de 10 días hábiles.</p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <Btn onClick={() => setShowArcoModal(true)} variant="secondary">Ver ARCO</Btn>
                      <Btn onClick={() => setShowTrainingViewModal(true)} variant="ghost">Ver Capacitaciones</Btn>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="p-4 md:p-6 hover:border-indigo-500/40 transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">{I.shield}</div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-text-heading">DPIA — Evaluaciones de Impacto</h4>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">Exporte evaluaciones de impacto a protección de datos como PDF formal (Art. 14 quater / Art. 16).</p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {dpiaItems.length === 0 && <span className="text-[10px] text-text-subtle">No hay DPIAs registrados</span>}
                      {dpiaItems.map(d => (
                        <a key={d._id} href={api.exportDPIA(token, d._id)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-all duration-200">
                          {I.download} {d.title || 'DPIA'}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 md:p-6 hover:border-amber-500/40 transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">{I.users}</div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-text-heading">DPA — Acuerdos con Encargados</h4>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">Exporte acuerdos de tratamiento de datos con encargados como PDF formal (Art. 9).</p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {dpaItems.length === 0 && <span className="text-[10px] text-text-subtle">No hay DPAs registrados</span>}
                      {dpaItems.map(d => (
                        <a key={d._id} href={api.exportDPA(token, d._id)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-all duration-200">
                          {I.download} {d.processorName || 'DPA'}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 md:p-6 hover:border-pink-500/40 transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 flex-shrink-0">{I.fileText}</div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-text-heading">Cláusula Laboral</h4>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">Generador de cláusulas de protección de datos para contratos de trabajo (Art. 154 bis Código del Trabajo).</p>
                    <div className="flex items-center gap-2 mt-4">
                      <a href={api.exportLaborClause(token)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-all duration-200">
                        {I.download} Generar Cláusula
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 md:p-6 hover:border-cyan-500/40 transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">{I.globe}</div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-text-heading">Portabilidad de Datos</h4>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">Exporte los datos personales de un titular en CSV o JSON (Art. 9 — Portabilidad).</p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <Btn onClick={async () => { const email = prompt('Email del titular:'); if (!email) return; const res = await api.exportPortability(token, email, 'json'); if (!res.error) { const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `portability-${email}.json`; a.click(); URL.revokeObjectURL(url); } }} variant="secondary">
                        {I.download} Exportar JSON
                      </Btn>
                      <Btn onClick={async () => { const email = prompt('Email del titular:'); if (!email) return; const res = await api.exportPortability(token, email, 'csv'); if (!res.error && res.csv) { const blob = new Blob([res.csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `portability-${email}.csv`; a.click(); URL.revokeObjectURL(url); } }} variant="ghost">
                        {I.download} Exportar CSV
                      </Btn>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 md:p-6">
              <h4 className="text-[14px] font-semibold text-white mb-5">{t('compliance.executiveSummary', 'Resumen Ejecutivo')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 text-[12px]">
                <div className="space-y-2.5">
                  {[
                    { label: t('compliance.company', 'Empresa'), value: config?.companyName || t('compliance.notConfigured', 'No configurada') },
                    { label: 'RUT', value: config?.companyRut || '-' },
                    { label: t('compliance.dpdShort', 'DPD'), value: config?.dpdName || t('compliance.notAssigned', 'No asignado') },
                    { label: t('compliance.level'), value: config?.complianceLevel ? t(`compliance.${config.complianceLevel}`, config.complianceLevel) : t('compliance.basic') },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-bg-base/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      <p className="text-text-muted">{item.label}: <span className="text-white font-medium">{item.value}</span></p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <p className="text-text-muted">Checklist</p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-bg-elevated/50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(checklistDone / CHECKLIST.length) * 100}%` }} />
                      </div>
                      <span className="text-emerald-400 font-bold text-[12px]">{checklistDone}/{CHECKLIST.length}</span>
                    </div>
                  </div>
                  {[
                    { label: t('compliance.activeConsents'), value: consents.filter(c => !c.revokedAt).length, color: 'text-cyan-400' },
                    { label: t('compliance.inventoryItems'), value: inventory.length, color: 'text-indigo-400' },
                    { label: t('compliance.activeBreaches'), value: breaches.filter(b => b.status !== 'resolved').length, color: 'text-red-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                      <p className="text-text-muted">{item.label}</p>
                      <span className={`font-bold text-[12px] ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card className="p-4 md:p-6">
              <h4 className="text-[14px] font-semibold text-white mb-4">{t('compliance.recommendedSteps', 'Próximos Pasos Recomendados')}</h4>
              <div className="space-y-2.5">
                {CHECKLIST.filter(c => !checklistStatus(c.id)).map(item => (
                  <div key={item.id} onClick={() => handleChecklistAction(item.id)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-bg-base/40 hover:bg-bg-elevated/40 cursor-pointer transition-colors">
                    <span className="text-text-subtle">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-text-body font-medium">{item.label}</p>
                      <p className="text-[11px] text-text-subtle mt-0.5">{item.desc}</p>
                    </div>
                    <Badge color="red" icon={I.xmark}>{t('compliance.pending', 'Pendiente')}</Badge>
                  </div>
                ))}
                {CHECKLIST.filter(c => !checklistStatus(c.id)).length === 0 && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/[0.05]">
                    <span className="text-emerald-400">{I.check}</span>
                    <p className="text-[12px] text-emerald-400 font-medium">{t('compliance.allDone', '¡Todos los requisitos cumplidos!')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
            <SectionHeader title={t('compliance.configTitle')} desc="Configuración general de compliance de la empresa"
              action={<Btn onClick={openConfigEdit} className="flex items-center gap-1.5">{I.settings} {t('compliance.edit', 'Editar')}<InfoTooltip text="Editar configuración de compliance." /></Btn>} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="p-5">
                <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-bg-elevated/60 flex items-center justify-center text-accent">{I.users}</div>
                  {t('compliance.dpd')}
                </h4>
                <div className="space-y-2.5 text-[12px]">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <span className="text-text-muted">{t('compliance.dpdName')}</span>
                    <span className="text-white font-medium">{config?.dpdName || t('compliance.notAssigned', 'No asignado')}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <span className="text-text-muted">{t('compliance.dpdEmail')}</span>
                    <span className="text-white font-mono">{config?.dpdEmail || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <span className="text-text-muted">{t('compliance.dpdPhone')}</span>
                    <span className="text-text-heading">{config?.dpdPhone || '-'}</span>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-bg-elevated/60 flex items-center justify-center text-emerald-400">{I.shield}</div>
                  {t('compliance.apdp')}
                </h4>
                <div className="space-y-3 text-[12px]">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <span className="text-text-muted">{t('compliance.status', 'Estado')}</span>
                    {config?.apdpRegistered ? <Badge color="green" icon={I.check}>{t('compliance.registered', 'Registrado')}</Badge> : <Badge color="red" icon={I.xmark}>{t('compliance.notRegistered', 'No registrado')}</Badge>}
                  </div>
                  {config?.apdpRegistrationDate && <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <span className="text-text-muted">{t('compliance.date', 'Fecha')}</span>
                    <span className="text-text-heading">{new Date(config.apdpRegistrationDate).toLocaleDateString('es-CL')}</span>
                  </div>}
                </div>
              </Card>
              <Card className="p-5">
                <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-bg-elevated/60 flex items-center justify-center text-indigo-400">{I.database}</div>
                  {t('compliance.policies', 'Políticas')}
                </h4>
                <div className="space-y-2.5 text-[12px]">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <span className="text-text-muted">{t('compliance.privacy', 'Privacidad')}</span>
                    {config?.privacyPolicyUrl ? <Badge color="green" icon={I.check}>{t('compliance.configured', 'Configurada')}</Badge> : <Badge color="red" icon={I.xmark}>{t('compliance.notConfigured', 'No configurada')}</Badge>}
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <span className="text-text-muted">{t('compliance.cookies', 'Cookies')}</span>
                    {config?.cookiesPolicyUrl ? <Badge color="green" icon={I.check}>{t('compliance.configured', 'Configurada')}</Badge> : <Badge color="red" icon={I.xmark}>{t('compliance.notConfigured', 'No configurada')}</Badge>}
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <span className="text-text-muted">{t('compliance.retention', 'Retención')}</span>
                    <span className="text-text-heading">{config?.dataRetentionPolicy || t('compliance.notDefined', 'No definida')}</span>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-bg-elevated/60 flex items-center justify-center text-cyan-400">{I.globe}</div>
                  {t('compliance.transfer', 'Transferencias Internacionales')}
                </h4>
                <div className="space-y-3 text-[12px]">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <span className="text-text-muted">{t('compliance.transfers', 'Transferencias')}</span>
                    {config?.internationalTransfer ? <Badge color="yellow">{t('compliance.active', 'Activas')}</Badge> : <Badge color="gray">{t('compliance.no', 'No')}</Badge>}
                  </div>
                  {config?.internationalTransferCountries?.length > 0 && <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-base/40">
                    <span className="text-text-muted">{t('compliance.countries', 'Países')}</span>
                    <span className="text-white text-right max-w-[240px] truncate">{config.internationalTransferCountries.join(', ')}</span>
                  </div>}
                </div>
              </Card>
            </div>
            <Card className="p-5">
              <h4 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-bg-elevated/60 flex items-center justify-center text-accent">{I.info}</div>
                {t('compliance.company', 'Empresa')}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
                <div className="p-3 rounded-lg bg-bg-base/40">
                  <p className="text-text-muted text-[10px] mb-1">{t('compliance.companyName')}</p>
                  <p className="text-white font-medium">{config?.companyName || t('compliance.notConfigured', 'No configurada')}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base/40">
                  <p className="text-text-muted text-[10px] mb-1">{t('compliance.companyRut')}</p>
                  <p className="text-white font-medium">{config?.companyRut || '-'}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base/40">
                  <p className="text-text-muted text-[10px] mb-1">{t('compliance.level')}</p>
                  <p className="text-white capitalize font-medium">{config?.complianceLevel ? t(`compliance.${config.complianceLevel}`, config.complianceLevel) : t('compliance.basic')}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base/40">
                  <p className="text-text-muted text-[10px] mb-1">{t('compliance.consentVersion', 'Versión Consentimiento')}</p>
                  <p className="text-white font-mono font-medium">{config?.consentVersion || '1.0'}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <Modal show={showConsentModal} onClose={() => setShowConsentModal(false)} title={t('compliance.registerConsent', 'Registrar Consentimiento')}>
        <form onSubmit={createConsent} className="space-y-3">
          <Inp value={consentForm.titularEmail} onChange={e => setConsentForm({...consentForm, titularEmail: e.target.value})} label={t('compliance.titularEmail') + ' *'} type="email" required />
          <Inp value={consentForm.titularName} onChange={e => setConsentForm({...consentForm, titularName: e.target.value})} label={t('compliance.titularName', 'Nombre del Titular')} />
          <Inp value={consentForm.titularRut} onChange={e => setConsentForm({...consentForm, titularRut: e.target.value})} label={t('compliance.titularRut', 'RUT del Titular')} />
          <Inp value={consentForm.purpose} onChange={e => setConsentForm({...consentForm, purpose: e.target.value})} label={t('compliance.purpose') + ' *'} placeholder={t('compliance.purposePlaceholder', 'Ej: Envío de newsletter, procesamiento de pedidos...')} required />
          <Inp value={consentForm.dataCategories} onChange={e => setConsentForm({...consentForm, dataCategories: e.target.value})} label={t('compliance.dataCategories', 'Categorías de Datos')} placeholder={t('compliance.dataCategoriesPlaceholder', 'nombre, email, teléfono (separado por comas)')} />
          <Sel value={consentForm.source} onChange={e => setConsentForm({...consentForm, source: e.target.value})} label={t('compliance.source', 'Fuente')} options={[{ value: 'web_form', label: t('compliance.webForm', 'Formulario Web') }, { value: 'api', label: 'API' }, { value: 'signed_document', label: t('compliance.signedDocument', 'Documento Firmado') }, { value: 'verbal', label: t('compliance.verbal', 'Verbal') }]} />
          <div className="flex justify-end space-x-2 pt-2">
            <Btn type="button" onClick={() => setShowConsentModal(false)} variant="secondary">{t('compliance.cancel', 'Cancelar')}</Btn>
            <Btn type="submit">{t('compliance.register', 'Registrar')}</Btn>
          </div>
        </form>
      </Modal>

      <Modal show={showInviteModal} onClose={() => setShowInviteModal(false)} title={inviteForm.kind === 'consent' ? 'Solicitar Consentimiento (Email / Link / QR)' : 'Solicitar Firma de Capacitación (Email / Link / QR)'}>
        {!inviteResult ? (
          <div className="space-y-3">
            <p className="text-[11px] text-text-muted bg-bg-base/40 rounded-lg p-3 border border-border-theme/50">
              {inviteForm.kind === 'consent'
                ? 'Genera un enlace de un solo uso para que el titular otorgue su consentimiento explícito (Art. 12). Puedes enviarlo por correo o compartirlo como link / código QR.'
                : `El empleado ${inviteForm.recipientName} recibirá un enlace de un solo uso para firmar digitalmente la constancia de capacitación (Art. 28 letra c).`}
            </p>
            {inviteForm.kind === 'consent' && (
              <>
                <Inp value={inviteForm.purpose} onChange={e => setInviteForm({ ...inviteForm, purpose: e.target.value })} label="Finalidad *" placeholder="Ej: Envío de newsletter, procesamiento de pedidos..." required />
                <Inp value={inviteForm.dataCategories} onChange={e => setInviteForm({ ...inviteForm, dataCategories: e.target.value })} label="Categorías de Datos" placeholder="nombre, email, teléfono (separado por comas)" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Inp value={inviteForm.recipientName} onChange={e => setInviteForm({ ...inviteForm, recipientName: e.target.value })} label="Nombre del Titular" />
                  <Inp value={inviteForm.recipientRut} onChange={e => setInviteForm({ ...inviteForm, recipientRut: e.target.value })} label="RUT" placeholder="XX.XXX.XXX-X" />
                </div>
              </>
            )}
            <Inp value={inviteForm.recipientEmail} onChange={e => setInviteForm({ ...inviteForm, recipientEmail: e.target.value })} label={inviteForm.kind === 'consent' ? 'Email del Titular' : 'Email del Empleado'} type="email" placeholder="persona@empresa.cl" />
            <Sel value={inviteForm.expiresHours} onChange={e => setInviteForm({ ...inviteForm, expiresHours: e.target.value })} label="Validez del enlace"
              options={[
                { value: '24', label: '24 horas' },
                { value: '72', label: '3 días' },
                { value: '168', label: '7 días' },
                { value: '720', label: '30 días' },
              ]} />
            <div className="bg-primary-500/10 border border-accent-border rounded-lg p-3 text-[11px] text-primary-300 flex items-start gap-2">
              {I.info} <span>El enlace es de <strong>un solo uso</strong>: se invalida automáticamente al ser completado o al expirar.</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Btn type="button" onClick={() => setShowInviteModal(false)} variant="secondary">Cancelar</Btn>
              <Btn type="button" onClick={() => createInvite(false)} disabled={inviteSending} variant="success">Generar Link / QR</Btn>
              <Btn type="button" onClick={() => createInvite(true)} disabled={inviteSending}>{inviteSending ? 'Enviando...' : 'Enviar por Correo'}</Btn>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-lg p-3 text-[11px] flex items-start gap-2 ${inviteResult.emailSent ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-primary-500/10 border border-accent-border text-primary-300'}`}>
              {I.check} <span>{inviteResult.emailSent ? `Correo enviado a ${inviteForm.recipientEmail}. También puedes compartir el link o QR:` : 'Invitación generada. Comparte el link o el código QR con la persona:'}</span>
            </div>
            <div>
              <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Link de un solo uso</label>
              <div className="flex gap-2">
                <input readOnly value={inviteResult.url} onFocus={e => e.target.select()}
                  className="flex-1 bg-bg-base border border-border-theme text-[11px] text-white font-mono rounded-lg px-3 py-2 focus:outline-none focus:border-accent" />
                <Btn type="button" onClick={copyInviteLink} variant={inviteCopied ? 'success' : 'secondary'}>{inviteCopied ? 'Copiado ✓' : 'Copiar'}</Btn>
              </div>
            </div>
            <div className="text-center">
              <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-2">Código QR</label>
              <img src={inviteResult.qr} alt="Código QR de la invitación" className="w-44 h-44 mx-auto rounded-lg border border-border-theme bg-white p-1" />
              <p className="text-[10px] text-text-subtle mt-2">Expira el {inviteResult.invite?.expiresAt ? new Date(inviteResult.invite.expiresAt).toLocaleString('es-CL') : '-'}</p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              {!inviteResult.emailSent && inviteForm.recipientEmail && (
                <Btn type="button" onClick={() => createInvite(true)} disabled={inviteSending} variant="secondary">{inviteSending ? 'Enviando...' : 'Enviar también por correo'}</Btn>
              )}
              <Btn type="button" onClick={() => { setShowInviteModal(false); loadAll(); }}>Cerrar</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal show={showBulkModal} onClose={() => !bulkSending && setShowBulkModal(false)} title={bulkForm.kind === 'consent' ? 'Envío Masivo de Consentimientos (CSV)' : 'Envío Masivo de Capacitaciones (CSV)'} wide>
        {!bulkResult ? (
          <div className="space-y-3">
            <p className="text-[11px] text-text-muted bg-bg-base/40 rounded-lg p-3 border border-border-theme/50">
              Sube un archivo CSV con los destinatarios. Columnas soportadas: <code className="text-primary-300">email, nombre, rut, cargo, departamento</code> (solo el email es obligatorio; separador coma o punto y coma).
              Cada persona recibirá un <strong>enlace de un solo uso</strong> por correo. Los envíos se procesan en <strong>lotes de 100</strong>.
            </p>
            {bulkForm.kind === 'consent' ? (
              <>
                <Inp value={bulkForm.purpose} onChange={e => setBulkForm({ ...bulkForm, purpose: e.target.value })} label="Finalidad *" placeholder="Ej: Tratamiento de datos laborales, envío de comunicaciones..." required />
                <Inp value={bulkForm.dataCategories} onChange={e => setBulkForm({ ...bulkForm, dataCategories: e.target.value })} label="Categorías de Datos" placeholder="nombre, email, teléfono (separado por comas)" />
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Sel value={bulkForm.topic} onChange={e => setBulkForm({ ...bulkForm, topic: e.target.value })} label="Tema de la Capacitación *"
                  options={[
                    { value: 'ley_21719', label: 'Ley 21.719 — Protección de Datos Personales' },
                    { value: 'ciberseguridad', label: 'Ciberseguridad' },
                    { value: 'brechas', label: 'Protocolo de Brechas (Art. 26)' },
                    { value: 'arco', label: 'Derechos ARCO (Arts. 8-13)' },
                    { value: 'consentimientos', label: 'Gestión de Consentimientos (Art. 12)' },
                    { value: 'general', label: 'General' },
                  ]} />
                <Inp value={bulkForm.date} onChange={e => setBulkForm({ ...bulkForm, date: e.target.value })} label="Fecha de Capacitación" type="date" />
              </div>
            )}
            <Sel value={bulkForm.expiresHours} onChange={e => setBulkForm({ ...bulkForm, expiresHours: e.target.value })} label="Validez de los enlaces"
              options={[
                { value: '24', label: '24 horas' },
                { value: '72', label: '3 días' },
                { value: '168', label: '7 días' },
                { value: '720', label: '30 días' },
              ]} />
            <div>
              <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Archivo CSV *</label>
              <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border-theme hover:border-accent rounded-lg p-5 cursor-pointer transition-colors bg-bg-base/30">
                <input type="file" accept=".csv,text/csv,text/plain" onChange={handleBulkFile} className="hidden" />
                <span className="text-[12px] text-text-body font-medium">{bulkRecipients.length ? `${bulkRecipients.length} emails válidos cargados` : 'Haz clic para seleccionar el CSV'}</span>
                <span className="text-[10px] text-text-subtle">Ej: email,nombre,rut — juan@empresa.cl,Juan Pérez,12.345.678-9</span>
              </label>
            </div>
            {bulkRecipients.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-[11px] text-emerald-400 flex items-start gap-2">
                {I.check} <span><strong>{bulkRecipients.length}</strong> destinatarios listos · se enviarán en <strong>{Math.ceil(bulkRecipients.length / 100)}</strong> lote(s) de hasta 100 correos.</span>
              </div>
            )}
            {bulkSending && bulkProgress && (
              <div>
                <div className="flex justify-between text-[10px] text-text-muted mb-1">
                  <span>Enviando lote {Math.floor(bulkProgress.done / 100) + 1} de {Math.ceil(bulkProgress.total / 100)}...</span>
                  <span>{bulkProgress.done}/{bulkProgress.total}</span>
                </div>
                <div className="h-2 rounded-full bg-bg-base overflow-hidden border border-border-theme/50">
                  <div className="h-full bg-primary-500 transition-all duration-500" style={{ width: `${Math.round((bulkProgress.done / Math.max(1, bulkProgress.total)) * 100)}%` }} />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Btn type="button" onClick={() => setShowBulkModal(false)} variant="secondary" disabled={bulkSending}>Cancelar</Btn>
              <Btn type="button" onClick={sendBulkInvites} disabled={bulkSending || !bulkRecipients.length}>
                {bulkSending ? 'Enviando...' : `Enviar ${bulkRecipients.length || ''} correos`}
              </Btn>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-bg-base/40 border border-border-theme/50 text-center">
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Total</p>
                <p className="text-[22px] font-bold text-white">{bulkResult.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-base/40 border border-border-theme/50 text-center">
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Correos Enviados</p>
                <p className="text-[22px] font-bold text-emerald-400">{bulkResult.emailsSent}</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-base/40 border border-border-theme/50 text-center">
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Fallidos</p>
                <p className="text-[22px] font-bold text-red-400">{bulkResult.failed.length}</p>
              </div>
            </div>
            {bulkResult.failed.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-red-500/20 rounded-lg divide-y divide-red-500/10">
                {bulkResult.failed.map((f, i) => (
                  <div key={i} className="px-3 py-2 text-[11px]">
                    <span className="text-red-300 font-mono">{f.email}</span>
                    <span className="text-text-subtle ml-2">{f.error}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Btn type="button" onClick={() => { setBulkResult(null); setBulkRecipients([]); setBulkProgress(null); }} variant="secondary">Enviar otro CSV</Btn>
              <Btn type="button" onClick={() => setShowBulkModal(false)}>Cerrar</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal show={showInventoryModal} onClose={() => setShowInventoryModal(false)} title={t('compliance.addToInventory', 'Agregar al Inventario')}>
        <form onSubmit={createInventory} className="space-y-3">
          <Sel value={invForm.category} onChange={e => setInvForm({...invForm, category: e.target.value})} label={t('compliance.category')} options={CATEGORIES} />
          <Sel value={invForm.dataType} onChange={e => {
            const dt = e.target.value;
            const sensitiveKeywords = ['password', 'passwd', 'pwd', 'secret', 'token', 'apikey', 'api_key', 'credential', 'auth', 'jwt', 'hash', 'salt', 'cipher', 'encrypt', 'pin', 'otp', 'ssn', 'passport', 'driver_license', 'national_id', 'health', 'medical', 'biometric', 'fingerprint', 'dna', 'genetic', 'financial', 'bank', 'credit_card', 'card_number', 'cvv', 'datos_bancarios', 'credenciales', 'salud', 'biometrico', 'religion', 'orientacion_sexual'];
            const isSensitive = sensitiveKeywords.some(kw => dt.includes(kw));
            setInvForm({...invForm, dataType: dt, sensitive: isSensitive ? 'true' : invForm.sensitive});
          }} label={t('compliance.dataType')} options={DATA_TYPES} />
          <Sel value={invForm.sensitive} onChange={e => setInvForm({...invForm, sensitive: e.target.value})} label={t('compliance.sensitive')} options={[{ value: 'false', label: t('compliance.no', 'No') }, { value: 'true', label: t('compliance.yes', 'Sí') }]} />
          <Sel value={invForm.legalBasis} onChange={e => setInvForm({...invForm, legalBasis: e.target.value})} label={t('compliance.legalBasis')} options={LEGAL_BASIS} />
          <Sel value={invForm.risk} onChange={e => setInvForm({...invForm, risk: e.target.value})} label={t('compliance.risk')} options={RISK_LEVELS} />
          <Sel value={invForm.storage} onChange={e => setInvForm({...invForm, storage: e.target.value})} label={t('compliance.storage')} options={STORAGE_TYPES} />
          <Inp value={invForm.storageLocation} onChange={e => setInvForm({...invForm, storageLocation: e.target.value})} label={t('compliance.location', 'Ubicación')} placeholder={t('compliance.locationPlaceholder', 'Ej: AWS us-east-1, servidor local')} />
          <Inp value={invForm.purpose} onChange={e => setInvForm({...invForm, purpose: e.target.value})} label={t('compliance.purpose')} placeholder={t('compliance.purposePlaceholder2', '¿Para qué se usa este dato?')} />
          <Inp value={invForm.retentionDays} onChange={e => setInvForm({...invForm, retentionDays: e.target.value})} label={t('compliance.retentionDays', 'Días de Retención')} type="number" />
          <Inp value={invForm.sharedWith} onChange={e => setInvForm({...invForm, sharedWith: e.target.value})} label={t('compliance.sharedWith', 'Compartido con (terceros)')} placeholder={t('compliance.sharedWithPlaceholder', 'proveedor1, proveedor2 (separado por comas)')} />
          <Inp value={invForm.securityMeasures} onChange={e => setInvForm({...invForm, securityMeasures: e.target.value})} label={t('compliance.securityMeasures', 'Medidas de Seguridad')} placeholder={t('compliance.securityMeasuresPlaceholder', 'encriptado, firewall, acceso restringido')} />
          <div className="flex justify-end space-x-2 pt-2">
            <Btn type="button" onClick={() => setShowInventoryModal(false)} variant="secondary">{t('compliance.cancel', 'Cancelar')}</Btn>
            <Btn type="submit">{t('compliance.add', 'Agregar')}</Btn>
          </div>
        </form>
      </Modal>

      <Modal show={showBreachModal} onClose={() => setShowBreachModal(false)} title={t('compliance.reportBreach')}>
        <form onSubmit={reportBreach} className="space-y-3">
          <Sel value={breachForm.type} onChange={e => setBreachForm({...breachForm, type: e.target.value})} label={t('compliance.incidentType', 'Tipo de Incidente')} options={BREACH_TYPES} />
          <Sel value={breachForm.severity} onChange={e => setBreachForm({...breachForm, severity: e.target.value})} label={t('compliance.severity', 'Severidad')} options={['low', 'medium', 'high', 'critical']} />
          <div>
            <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">{t('compliance.description', 'Descripción')} *</label>
            <textarea value={breachForm.description} onChange={e => setBreachForm({...breachForm, description: e.target.value})} required rows={3} placeholder={t('compliance.descriptionPlaceholder', 'Describe qué ocurrió, cómo se detectó y el alcance...')}
              className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
          </div>
          <Inp value={breachForm.affectedData} onChange={e => setBreachForm({...breachForm, affectedData: e.target.value})} label={t('compliance.affectedData', 'Datos Afectados')} placeholder={t('compliance.affectedDataPlaceholder', 'emails, contraseñas, rut (separado por comas)')} />
          <Inp value={breachForm.affectedUsers} onChange={e => setBreachForm({...breachForm, affectedUsers: e.target.value})} label={t('compliance.affectedUsers', 'Usuarios Afectados')} type="number" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Sel value={breachForm.sensitiveDataInvolved} onChange={e => setBreachForm({...breachForm, sensitiveDataInvolved: e.target.value})} label={t('compliance.sensitiveData', 'Datos Sensibles')} options={[{ value: 'false', label: t('compliance.no', 'No') }, { value: 'true', label: t('compliance.yes', 'Sí') }]} />
            <Sel value={breachForm.childrenDataInvolved} onChange={e => setBreachForm({...breachForm, childrenDataInvolved: e.target.value})} label={t('compliance.childrenData', 'Datos Niños')} options={[{ value: 'false', label: t('compliance.no', 'No') }, { value: 'true', label: t('compliance.yes', 'Sí') }]} />
            <Sel value={breachForm.economicDataInvolved} onChange={e => setBreachForm({...breachForm, economicDataInvolved: e.target.value})} label={t('compliance.economicData', 'Datos Económicos')} options={[{ value: 'false', label: t('compliance.no', 'No') }, { value: 'true', label: t('compliance.yes', 'Sí') }]} />
          </div>
          <Inp value={breachForm.rootCause} onChange={e => setBreachForm({...breachForm, rootCause: e.target.value})} label={t('compliance.rootCause', 'Causa Raíz')} placeholder={t('compliance.rootCausePlaceholder', 'Ej: phishing, vulnerabilidad sin parche, error humano')} />
          <Inp value={breachForm.containmentActions} onChange={e => setBreachForm({...breachForm, containmentActions: e.target.value})} label={t('compliance.containmentActions', 'Acciones de Contención')} placeholder={t('compliance.containmentActionsPlaceholder', 'rotar claves, aislar servidor, resetear contraseñas (separado por comas)')} />
          <div className="border-t border-white/[0.04] pt-3">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="reportCSIRT" checked={breachForm.reportToCSIRT === 'true'} onChange={e => setBreachForm({...breachForm, reportToCSIRT: e.target.checked ? 'true' : 'false'})}
                className="w-4 h-4 rounded border-border-theme bg-bg-base text-primary-500 focus:ring-accent-subtle" />
              <label htmlFor="reportCSIRT" className="text-[11px] text-text-muted">Reportar al CSIRT Nacional (Ley 21.663 - 3h alerta temprana)</label>
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-[11px] text-red-400 flex items-start gap-2">
            {I.alert} <span>{t('compliance.breachWarning', 'Las brechas de severidad "critical" o que involucren datos sensibles o de niños se notificarán automáticamente a la APDP.')}</span>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Btn type="button" onClick={() => setShowBreachModal(false)} variant="secondary">{t('compliance.cancel', 'Cancelar')}</Btn>
            <Btn type="submit">{t('compliance.reportBreach')}</Btn>
          </div>
        </form>
      </Modal>

      <Modal show={showTrainingModal} onClose={() => setShowTrainingModal(false)} title="Agregar Empleado a Capacitación">
        <form onSubmit={createTraining} className="space-y-3">
          <p className="text-[11px] text-text-muted bg-bg-base/40 rounded-lg p-3 border border-border-theme/50">
            Complete los datos del empleado que ha recibido la capacitación sobre la Ley 21.719 de Protección de Datos Personales. El empleado deberá firmar digitalmente para confirmar su recepción.
          </p>
          <div className="flex items-center gap-2 mb-2">
            {['Empleado', 'Capacitación'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${i === 0 ? 'bg-primary-500 text-text-heading' : 'bg-bg-elevated text-text-muted'}`}>{i + 1}</div>
                <span className="text-[10px] text-text-subtle font-medium">{s}</span>
                {i === 0 && <div className="w-8 h-px bg-border-theme" />}
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-2">Datos del Empleado</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Inp value={trainingForm.employeeName} onChange={e => setTrainingForm({...trainingForm, employeeName: e.target.value})} label="Nombre Completo *" required />
              <Inp value={trainingForm.employeeRut} onChange={e => setTrainingForm({...trainingForm, employeeRut: e.target.value})} label="RUT" placeholder="XX.XXX.XXX-X" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Inp value={trainingForm.employeeEmail} onChange={e => setTrainingForm({...trainingForm, employeeEmail: e.target.value})} label="Email *" type="email" required />
              <Inp value={trainingForm.employeePhone} onChange={e => setTrainingForm({...trainingForm, employeePhone: e.target.value})} label="Teléfono" placeholder="+56 9 XXXX XXXX" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Inp value={trainingForm.employeePosition} onChange={e => setTrainingForm({...trainingForm, employeePosition: e.target.value})} label="Cargo" placeholder="Ej: Analista de Datos" />
              <Inp value={trainingForm.employeeDepartment} onChange={e => setTrainingForm({...trainingForm, employeeDepartment: e.target.value})} label="Departamento" placeholder="Ej: TI, RRHH, Legal" />
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-2">Capacitación</p>
            <Sel value={trainingForm.topic} onChange={e => setTrainingForm({...trainingForm, topic: e.target.value})} label="Tema *"
              options={[
                { value: 'ley_21719', label: 'Ley 21.719 — Protección de Datos Personales' },
                { value: 'ciberseguridad', label: 'Ciberseguridad' },
                { value: 'brechas', label: 'Protocolo de Brechas (Art. 26)' },
                { value: 'arco', label: 'Derechos ARCO (Arts. 8-13)' },
                { value: 'consentimientos', label: 'Gestión de Consentimientos (Art. 12)' },
                { value: 'general', label: 'General' },
              ]} />
            <Inp value={trainingForm.date} onChange={e => setTrainingForm({...trainingForm, date: e.target.value})} label="Fecha de Capacitación *" type="date" required />
            <input value={trainingForm.notes} onChange={e => setTrainingForm({...trainingForm, notes: e.target.value})} placeholder="Notas adicionales (opcional)..."
              className="mt-3 w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
          </div>
          <div className="bg-primary-500/10 border border-accent-border rounded-lg p-3 text-[11px] text-primary-300 flex items-start gap-2">
            {I.info} <span>El empleado deberá firmar digitalmente después de registrado para validar que ha recibido y comprendido la capacitación. Sin firma, el registro queda como pendiente.</span>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Btn type="button" onClick={() => setShowTrainingModal(false)} variant="secondary">Cancelar</Btn>
            <Btn type="submit">Registrar Empleado</Btn>
          </div>
        </form>
      </Modal>

      <Modal show={showTrainingViewModal} onClose={() => setShowTrainingViewModal(false)} title="Capacitaciones Realizadas">
        {trainings.length === 0 ? (
          <EmptyState
            icon={I.info}
            title="Sin capacitaciones"
            description="Aún no hay empleados registrados en capacitaciones."
            action={<Btn onClick={() => { setShowTrainingViewModal(false); setShowTrainingModal(true); }}>Registrar Primera Capacitación</Btn>}
          />
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {trainings.map((t, i) => (
              <div key={t._id || i} className="p-3 rounded-lg bg-bg-base/40 border border-border-theme/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-white font-medium">{t.employeeName}</span>
                  <Badge color={t.completed ? 'green' : 'yellow'}>{t.completed ? 'Completado' : 'Pendiente'}</Badge>
                </div>
                <p className="text-[11px] text-text-muted">{t.topic} · {new Date(t.date).toLocaleDateString('es-CL')}</p>
                {(t.employeePosition || t.employeeDepartment) && (
                  <p className="text-[10px] text-text-subtle">{t.employeePosition || ''}{t.employeeDepartment ? ` · ${t.employeeDepartment}` : ''}</p>
                )}
                {t.employeeRut && <p className="text-[10px] text-text-subtle font-mono">RUT: {t.employeeRut}</p>}
                {t.employeePhone && <p className="text-[10px] text-text-subtle">Tel: {t.employeePhone}</p>}
                {t.notes && <p className="text-[10px] text-text-subtle mt-1">Notas: {t.notes}</p>}
                {t.signatureData ? (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <img src={t.signatureData} alt="Firma" className="h-8 rounded border border-border-theme bg-bg-panel" />
                      <span className="text-[9px] text-text-subtle">Firmado {t.signedAt ? new Date(t.signedAt).toLocaleString('es-CL') : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => unsignTraining(t._id)} className="text-[10px] text-yellow-400 hover:text-yellow-300 font-medium flex items-center gap-1">
                        {I.pen} Volver a firmar
                      </button>
                      <button onClick={() => deleteTraining(t._id)} className="text-[10px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1">
                        {I.trash} Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => signDocument(t._id)} className="text-[10px] text-accent hover:text-primary-300 font-medium flex items-center gap-1">
                      {I.pen} Firmar documento
                    </button>
                    <button onClick={() => { setShowTrainingViewModal(false); openTrainingInvite(t); }} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
                      Solicitar (Email / Link / QR)
                    </button>
                    <button onClick={() => deleteTraining(t._id)} className="text-[10px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1">
                      {I.trash} Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {trainings.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Btn onClick={generateTrainingReport} className="flex items-center gap-1.5">
              {I.download} Generar Reporte PDF
            </Btn>
          </div>
        )}
      </Modal>

      <Modal show={showSignModal} onClose={() => setShowSignModal(false)} title="Firma Digital — Constancia Ley 21.719">
        <div className="space-y-3">
          <div className="bg-bg-base/40 border border-border-theme/50 rounded-lg p-3 space-y-2">
            <p className="text-[11px] text-text-body font-medium">Declaración del Empleado</p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Al firmar a continuación, declaro que he recibido, comprendido y tomado conocimiento de la capacitación en <strong className="text-text-heading">Protección de Datos Personales según la Ley 21.719</strong>. 
              Entiendo mis obligaciones en el tratamiento de datos personales y las medidas de seguridad que debo aplicar en mis funciones.
            </p>
            <p className="text-[10px] text-text-subtle">
              Art. 28 letra c) — El responsable del tratamiento debe capacitar al personal en materia de protección de datos personales.
            </p>
          </div>
          <SignaturePad onSave={saveSignature} onCancel={() => setShowSignModal(false)} />
        </div>
      </Modal>

      <Modal show={showArcoModal} onClose={() => { setShowArcoModal(false); setArcoResponse({}); }} title="Portal ARCO — Derechos del Titular (Ley 21.719)">
        <div className="space-y-4">
          <p className="text-[11px] text-text-muted">La Ley 21.719 reconoce 5 derechos fundamentales. Debes responder en un plazo máximo de <span className="text-white font-medium">10 días hábiles</span>.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {arcoRights.map((right) => {
              const count = arcoRequests.filter(r => r.tipo === right.id).length;
              const pending = arcoRequests.filter(r => r.tipo === right.id && (r.status === 'pending' || r.status === 'in_progress')).length;
              return (
                <div key={right.id} className="p-2.5 rounded-lg bg-bg-base/40 border border-border-theme/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white font-medium">{right.title}</span>
                    <span className="text-[9px] text-primary-500 font-mono">{right.art}</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">{count} solicitud(es) · <span className={pending > 0 ? 'text-yellow-400' : 'text-text-subtle'}>{pending} pendiente(s)</span></p>
                </div>
              );
            })}
          </div>

          {arcoRequests.length > 0 && (
            <div>
              <p className="text-[11px] text-white font-medium mb-2">Solicitudes Recientes</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {arcoRequests.slice(0, 20).map((req) => {
                  const right = arcoRights.find(r => r.id === req.tipo);
                  const isPending = req.status === 'pending' || req.status === 'in_progress';
                  return (
                    <div key={req._id} className={`p-2.5 rounded-lg border ${isPending ? 'bg-bg-base/60 border-yellow-500/20' : 'bg-bg-base/30 border-white/[0.04]'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${isPending ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{req.status}</span>
                          <span className="text-[11px] text-white font-medium">{right?.title || req.tipo}</span>
                          {isPending && (() => {
                            const days = getArcoRemainingBusinessDays(req);
                            const overdue = days !== null && days < 0;
                            return <span className={`text-[9px] px-1.5 py-0.5 rounded border ${overdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : days <= 3 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{overdue ? `${Math.abs(days)} días vencido` : `${days} días hábiles`}</span>;
                          })()}
                        </div>
                        <span className="text-[9px] text-text-subtle">{req.submittedAt ? new Date(req.submittedAt).toLocaleDateString('es-CL') : '-'}</span>
                      </div>
                      <p className="text-[10px] text-text-muted">{req.solicitante?.nombre || 'Sin nombre'} — {req.solicitante?.email || 'Sin email'}</p>
                      {req.descripcion && <p className="text-[10px] text-text-muted mt-1 line-clamp-2">{req.descripcion}</p>}
                      {isPending && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                          <textarea value={arcoResponse[req._id] || ''} onChange={e => setArcoResponse(prev => ({ ...prev, [req._id]: e.target.value }))} placeholder="Respuesta (opcional)..."
                            className="flex-1 bg-bg-panel border border-border-theme rounded px-2 py-1.5 text-[11px] text-white placeholder-text-subtle focus:outline-none focus:border-accent resize-none" rows={2} />
                          <button onClick={async () => {
                            const res = await api.respondArcoRequest(token, req._id, arcoResponse[req._id] || 'Solicitud atendida');
                            if (!res.error) { showToast('Solicitud respondida correctamente', 'success'); setArcoResponse(prev => { const n = { ...prev }; delete n[req._id]; return n; }); loadAll(); }
                            else { showToast('Error: ' + res.error); }
                          }} className="px-2 py-1.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                            Responder
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {arcoRequests.length === 0 && (
            <EmptyState
              icon={I.check}
              title="Sin solicitudes ARCO"
              description="No se han recibido solicitudes de acceso, rectificación, cancelación u oposición."
              action={<Btn onClick={() => { setShowArcoModal(false); window.location.href = '/arco-solicitud'; }}>Crear solicitud de prueba</Btn>}
            />
          )}

          <div className="bg-primary-500/10 border border-accent-border rounded-lg p-3">
            <p className="text-[11px] text-primary-300 font-medium mb-1">Resumen</p>
            <p className="text-[11px] text-text-muted">Total: <span className="text-white font-medium">{arcoRequests.length}</span> · Completadas: <span className="text-emerald-400">{arcoRequests.filter(r => r.status === 'completed').length}</span> · Pendientes: <span className="text-yellow-400">{arcoRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length}</span></p>
          </div>
        </div>
      </Modal>

      <Modal show={showPseudoModal} onClose={() => setShowPseudoModal(false)} title="Nueva Regla de Seudonimización">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const res = await api.createPseudonymizationRule(token, pseudoForm);
          if (!res.error) {
            const rules = await api.getPseudonymizationRules(token);
            if (Array.isArray(rules)) setPseudoRules(rules);
            setShowPseudoModal(false);
          }
        }} className="space-y-3">
          <Inp value={pseudoForm.name} onChange={e => setPseudoForm({...pseudoForm, name: e.target.value})} label="Nombre de la Regla" required />
          <textarea value={pseudoForm.description} onChange={e => setPseudoForm({...pseudoForm, description: e.target.value})} placeholder="Descripción opcional"
            className="w-full bg-bg-panel border border-border-theme rounded-lg px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-accent transition-colors resize-none" rows={2} />
          <Sel value={pseudoForm.method} onChange={e => setPseudoForm({...pseudoForm, method: e.target.value})} label="Método de Seudonimización" options={[
            { value: 'hash', label: 'Hash (SHA-256)' },
            { value: 'uuid', label: 'UUID (Identificador único)' },
            { value: 'sequential', label: 'Secuencial (1, 2, 3...)' },
            { value: 'mask', label: 'Enmascaramiento (ej: ***@***.com)' },
            { value: 'formatPreserving', label: 'Preservando formato' },
          ]} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Inp value={pseudoForm.tableName} onChange={e => setPseudoForm({...pseudoForm, tableName: e.target.value})} label="Tabla (opcional)" placeholder="usuarios" />
            <Inp value={pseudoForm.columnName} onChange={e => setPseudoForm({...pseudoForm, columnName: e.target.value})} label="Columna (opcional)" placeholder="email" />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Btn type="button" onClick={() => setShowPseudoModal(false)} variant="secondary">Cancelar</Btn>
            <Btn type="submit">Crear Regla</Btn>
          </div>
        </form>
      </Modal>

      <Modal show={showDpiaModal} onClose={() => setShowDpiaModal(false)} title={editingDpia ? 'Editar DPIA' : 'Nueva Evaluación de Impacto — DPIA'}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const data = { ...dpiaForm, dataCategories: dpiaForm.dataCategories.split(',').map(s => s.trim()).filter(Boolean), mitigationMeasures: dpiaForm.mitigationMeasures.split(',').map(s => s.trim()).filter(Boolean) };
          let res;
          if (editingDpia) {
            res = await api.updateComplianceDPIA(token, editingDpia._id, data);
          } else {
            res = await api.createComplianceDPIA(token, data);
          }
          if (!res.error) { setShowDpiaModal(false); const items = await api.getComplianceDPIAs(token); if (Array.isArray(items)) setDpiaItems(items); }
        }} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="bg-primary-500/10 border border-accent-border rounded-lg p-3 text-[11px] text-primary-300 flex items-start gap-2 mb-2">
            {I.info} <span>La DPIA evalúa los riesgos del tratamiento de datos personales. Complete los indicadores de riesgo para obtener un score automático.</span>
          </div>
          <Inp value={dpiaForm.title} onChange={e => setDpiaForm({...dpiaForm, title: e.target.value})} label="Título del Tratamiento *" placeholder="Ej: Sistema de videovigilancia en oficinas" required />
          <div>
            <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Descripción</label>
            <textarea value={dpiaForm.description} onChange={e => setDpiaForm({...dpiaForm, description: e.target.value})} placeholder="Describa el tratamiento de datos y su contexto..." rows={2}
              className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
          </div>
          <Inp value={dpiaForm.processingPurpose} onChange={e => setDpiaForm({...dpiaForm, processingPurpose: e.target.value})} label="Finalidad del Tratamiento *" required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Inp value={dpiaForm.responsibleName} onChange={e => setDpiaForm({...dpiaForm, responsibleName: e.target.value})} label="Responsable" placeholder="Nombre" />
            <Inp value={dpiaForm.responsibleDept} onChange={e => setDpiaForm({...dpiaForm, responsibleDept: e.target.value})} label="Departamento" placeholder="TI, RRHH, Legal..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Sel value={dpiaForm.dataSubjects} onChange={e => setDpiaForm({...dpiaForm, dataSubjects: e.target.value})} label="Sujetos de Datos" options={[
              { value: 'employees', label: 'Empleados' }, { value: 'customers', label: 'Clientes' }, { value: 'providers', label: 'Proveedores' },
              { value: 'candidates', label: 'Candidatos' }, { value: 'users_web', label: 'Usuarios Web' }, { value: 'minors', label: 'Niños/Niñas' },
              { value: 'vulnerable', label: 'Grupos vulnerables' }, { value: 'other', label: 'Otros' },
            ]} />
            <Sel value={dpiaForm.legalBasis} onChange={e => setDpiaForm({...dpiaForm, legalBasis: e.target.value})} label="Base Legal" options={LEGAL_BASIS} />
          </div>
          <Inp value={dpiaForm.dataCategories} onChange={e => setDpiaForm({...dpiaForm, dataCategories: e.target.value})} label="Categorías de Datos" placeholder="nombre, email, RUT, salud, ubicación (separado por comas)" />

          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-3">Indicadores de Riesgo (Art. 14 quater)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { key: 'sensitiveData', label: 'Datos sensibles' },
                { key: 'childrenData', label: 'Datos de niños' },
                { key: 'largeScale', label: 'Gran escala' },
                { key: 'automatedDecisions', label: 'Decisiones automatizadas' },
                { key: 'profiling', label: 'Perfilamiento' },
                { key: 'biometricData', label: 'Datos biométricos' },
                { key: 'geolocationData', label: 'Geolocalización' },
                { key: 'videoSurveillance', label: 'Videovigilancia' },
                { key: 'crossBorderTransfer', label: 'Transferencia internacional' },
                { key: 'vulnerableSubjects', label: 'Sujetos vulnerables' },
                { key: 'systematicMonitoring', label: 'Monitoreo sistemático' },
                { key: 'newTechnologies', label: 'Nuevas tecnologías' },
              ].map(ind => (
                <label key={ind.key} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  dpiaForm[ind.key] === 'true' ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-bg-base border-border-theme text-text-muted hover:bg-bg-elevated'
                }`}>
                  <input type="checkbox" checked={dpiaForm[ind.key] === 'true'} onChange={e => setDpiaForm({...dpiaForm, [ind.key]: e.target.checked ? 'true' : 'false'})}
                    className="w-3.5 h-3.5 rounded border-border-theme bg-bg-base text-primary-500 focus:ring-accent-subtle" />
                  <span className="text-[11px]">{ind.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-3">
            <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Medidas de Mitigación</label>
            <input value={dpiaForm.mitigationMeasures} onChange={e => setDpiaForm({...dpiaForm, mitigationMeasures: e.target.value})} placeholder="encriptación, control de acceso, seudonimización, minimización (separado por comas)"
              className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
          </div>

          <div className="border-t border-white/[0.04] pt-3">
            <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Justificación del Riesgo</label>
            <textarea value={dpiaForm.riskJustification} onChange={e => setDpiaForm({...dpiaForm, riskJustification: e.target.value})} placeholder="Explique por qué el riesgo es necesario y cómo se mitiga..." rows={2}
              className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-white/[0.04]">
            <Btn type="button" onClick={() => setShowDpiaModal(false)} variant="secondary">Cancelar</Btn>
            <Btn type="submit">{editingDpia ? 'Guardar Cambios' : 'Crear DPIA'}</Btn>
          </div>
        </form>
      </Modal>

      <Modal show={showDpaModal} onClose={() => setShowDpaModal(false)} title={editingDpa ? 'Editar DPA' : 'Nuevo Acuerdo con Encargado — DPA'}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          let res;
          if (editingDpa) {
            res = await api.updateComplianceDPA(token, editingDpa._id, dpaForm);
          } else {
            res = await api.createComplianceDPA(token, dpaForm);
          }
          if (!res.error) { setShowDpaModal(false); const items = await api.getComplianceDPAs(token); if (Array.isArray(items)) setDpaItems(items); }
        }} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="bg-primary-500/10 border border-accent-border rounded-lg p-3 text-[11px] text-primary-300 flex items-start gap-2 mb-2">
            {I.info} <span>Registre al encargado de tratamiento que procesa datos personales por cuenta de su empresa. El Art. 9 exige un contrato escrito.</span>
          </div>
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-2">Datos del Encargado</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Inp value={dpaForm.processorName} onChange={e => setDpaForm({...dpaForm, processorName: e.target.value})} label="Nombre del Encargado *" required />
              <Inp value={dpaForm.processorRut} onChange={e => setDpaForm({...dpaForm, processorRut: e.target.value})} label="RUT" placeholder="XX.XXX.XXX-X" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Inp value={dpaForm.processorContactName} onChange={e => setDpaForm({...dpaForm, processorContactName: e.target.value})} label="Persona de Contacto" />
              <Inp value={dpaForm.processorEmail} onChange={e => setDpaForm({...dpaForm, processorEmail: e.target.value})} label="Email" type="email" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Inp value={dpaForm.processorPhone} onChange={e => setDpaForm({...dpaForm, processorPhone: e.target.value})} label="Teléfono" />
              <Inp value={dpaForm.processorAddress} onChange={e => setDpaForm({...dpaForm, processorAddress: e.target.value})} label="Dirección" />
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-2">Servicio y Datos</p>
            <Inp value={dpaForm.serviceDescription} onChange={e => setDpaForm({...dpaForm, serviceDescription: e.target.value})} label="Descripción del Servicio *" required />
            <Inp value={dpaForm.processingPurpose} onChange={e => setDpaForm({...dpaForm, processingPurpose: e.target.value})} label="Finalidad del Tratamiento *" required />
            <Inp value={dpaForm.dataCategories} onChange={e => setDpaForm({...dpaForm, dataCategories: e.target.value})} label="Categorías de Datos" placeholder="nombre, email, RUT, salud (separado por comas)" />
            <Sel value={dpaForm.dataSubjects} onChange={e => setDpaForm({...dpaForm, dataSubjects: e.target.value})} label="Sujetos de Datos" options={[
              { value: 'employees', label: 'Empleados' }, { value: 'customers', label: 'Clientes' }, { value: 'providers', label: 'Proveedores' },
              { value: 'candidates', label: 'Candidatos' }, { value: 'users_web', label: 'Usuarios Web' }, { value: 'minors', label: 'Niños/Niñas' },
              { value: 'vulnerable', label: 'Grupos vulnerables' }, { value: 'other', label: 'Otros' },
            ]} />
          </div>
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-2">Contrato</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Inp value={dpaForm.contractDate} onChange={e => setDpaForm({...dpaForm, contractDate: e.target.value})} label="Fecha del Contrato" type="date" />
              <Inp value={dpaForm.expirationDate} onChange={e => setDpaForm({...dpaForm, expirationDate: e.target.value})} label="Fecha de Vencimiento" type="date" />
            </div>
            <Inp value={dpaForm.contractReference} onChange={e => setDpaForm({...dpaForm, contractReference: e.target.value})} label="Referencia del Contrato" placeholder="N° contrato, folio, o enlace al documento" />
            <Sel value={dpaForm.status} onChange={e => setDpaForm({...dpaForm, status: e.target.value})} label="Estado" options={[
              { value: 'draft', label: 'Borrador' }, { value: 'active', label: 'Activo' }, { value: 'under_review', label: 'En revisión' },
              { value: 'expired', label: 'Vencido' }, { value: 'terminated', label: 'Terminado' },
            ]} />
          </div>
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-2">Seguridad y Cumplimiento</p>
            <Inp value={dpaForm.securityMeasures} onChange={e => setDpaForm({...dpaForm, securityMeasures: e.target.value})} label="Medidas de Seguridad" placeholder="encriptación, ISO 27001, SOC2, acceso restringido (separado por comas)" />
        <Inp value={dpaForm.subProcessors} onChange={e => setDpaForm({...dpaForm, subProcessors: e.target.value})} label="Sub-encargados (sub-processors)" placeholder="proveedor1, proveedor2 (separado por comas)" />
            <div className="flex items-center gap-3 mt-2">
              <input type="checkbox" id="dpaInternational" checked={dpaForm.internationalTransfer === 'true'} onChange={e => setDpaForm({...dpaForm, internationalTransfer: e.target.checked ? 'true' : 'false'})}
                className="w-4 h-4 rounded border-border-theme bg-bg-base text-primary-500 focus:ring-accent-subtle" />
              <label htmlFor="dpaInternational" className="text-[11px] text-text-muted">Transferencia internacional de datos</label>
            </div>
            {dpaForm.internationalTransfer === 'true' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <Inp value={dpaForm.transferCountry} onChange={e => setDpaForm({...dpaForm, transferCountry: e.target.value})} label="País de Destino" placeholder="Ej: Estados Unidos" />
                <Inp value={dpaForm.transferGuarantees} onChange={e => setDpaForm({...dpaForm, transferGuarantees: e.target.value})} label="Garantías" placeholder="Cláusulas contractuales tipo, BCR, etc." />
              </div>
            )}
          </div>
          <div className="border-t border-white/[0.04] pt-3">
            <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Notas</label>
            <textarea value={dpaForm.notes} onChange={e => setDpaForm({...dpaForm, notes: e.target.value})} placeholder="Notas adicionales..." rows={2}
              className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-white/[0.04]">
            <Btn type="button" onClick={() => setShowDpaModal(false)} variant="secondary">Cancelar</Btn>
            <Btn type="submit">{editingDpa ? 'Guardar Cambios' : 'Crear DPA'}</Btn>
          </div>
        </form>
      </Modal>

      <Modal show={showConfigModal} onClose={() => setShowConfigModal(false)} title={t('compliance.configTitle')}>
        <form onSubmit={saveConfig} className="space-y-3">
          <Inp value={configForm.companyName} onChange={e => setConfigForm({...configForm, companyName: e.target.value})} label={t('compliance.companyName')} />
          <Inp value={configForm.companyRut} onChange={e => setConfigForm({...configForm, companyRut: e.target.value})} label={t('compliance.companyRut')} placeholder="XX.XXX.XXX-X" />
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[11px] font-semibold text-text-muted mb-2">{t('compliance.dpd')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Inp value={configForm.dpdName} onChange={e => setConfigForm({...configForm, dpdName: e.target.value})} label={t('compliance.dpdName')} />
              <Inp value={configForm.dpdEmail} onChange={e => setConfigForm({...configForm, dpdEmail: e.target.value})} label={t('compliance.dpdEmail')} type="email" />
              <Inp value={configForm.dpdPhone} onChange={e => setConfigForm({...configForm, dpdPhone: e.target.value})} label={t('compliance.dpdPhone')} />
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[11px] font-semibold text-text-muted mb-2">{t('compliance.apdp')}</p>
            <Sel value={configForm.apdpRegistered} onChange={e => setConfigForm({...configForm, apdpRegistered: e.target.value})} label={t('compliance.apdpRegistered', 'Registrado en APDP')} options={[{ value: 'false', label: t('compliance.notRegistered', 'No registrado') }, { value: 'true', label: t('compliance.registered', 'Registrado') }]} />
          </div>
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[11px] font-semibold text-text-muted mb-2">{t('compliance.policies', 'Políticas')}</p>
            <Inp value={configForm.privacyPolicyUrl} onChange={e => setConfigForm({...configForm, privacyPolicyUrl: e.target.value})} label={t('compliance.privacyUrl')} placeholder="https://tusitio.cl/privacidad" />
            <Inp value={configForm.cookiesPolicyUrl} onChange={e => setConfigForm({...configForm, cookiesPolicyUrl: e.target.value})} label={t('compliance.cookiesUrl')} placeholder="https://tusitio.cl/cookies" />
            <Sel value={configForm.dataRetentionPolicy} onChange={e => setConfigForm({...configForm, dataRetentionPolicy: e.target.value})} label={t('compliance.retentionPolicy', 'Política de Retención')} options={['1 year', '2 years', '3 years', '5 years', '10 years']} />
          </div>
          <div className="border-t border-white/[0.04] pt-3">
            <p className="text-[11px] font-semibold text-text-muted mb-2">{t('compliance.levelAndTransfers', 'Nivel y Transferencias')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Sel value={configForm.complianceLevel} onChange={e => setConfigForm({...configForm, complianceLevel: e.target.value})} label={t('compliance.level')} options={[{ value: 'basic', label: t('compliance.basic') }, { value: 'intermediate', label: t('compliance.intermediate') }, { value: 'advanced', label: t('compliance.advanced') }, { value: 'certified', label: t('compliance.certified') }]} />
              <Sel value={configForm.internationalTransfer} onChange={e => setConfigForm({...configForm, internationalTransfer: e.target.value})} label={t('compliance.transfer', 'Transferencias Internacionales')} options={[{ value: 'false', label: t('compliance.no', 'No') }, { value: 'true', label: t('compliance.yes', 'Sí') }]} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Btn type="button" onClick={() => setShowConfigModal(false)} variant="secondary">{t('compliance.cancel', 'Cancelar')}</Btn>
            <Btn type="submit">{t('compliance.saveConfig', 'Guardar Configuración')}</Btn>
          </div>
        </form>
      </Modal>

      {showBreachDetailModal && selectedBreach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-bg-panel border border-border-theme/50 rounded-2xl w-full max-w-[520px] mx-4 shadow-2xl shadow-black/40 overflow-hidden max-h-[80vh] overflow-y-auto">
            <div className="px-6 pt-6 pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-text-heading">Detalle del Incidente</h3>
                <button onClick={() => setShowBreachDetailModal(false)} className="text-text-muted hover:text-text-heading p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div><span className="text-text-muted block mb-0.5">Tipo</span><span className="text-white font-medium">{selectedBreach.type || '-'}</span></div>
                <div><span className="text-text-muted block mb-0.5">Severidad</span><span className="text-white font-medium">{selectedBreach.severity || '-'}</span></div>
                <div><span className="text-text-muted block mb-0.5">Estado</span><span className="text-white font-medium">{selectedBreach.status === 'resolved' ? 'Resuelta' : 'Abierta'}</span></div>
                <div><span className="text-text-muted block mb-0.5">Detectado</span><span className="text-white font-medium">{selectedBreach.detectedAt ? new Date(selectedBreach.detectedAt).toLocaleString('es-CL') : '-'}</span></div>
                <div><span className="text-text-muted block mb-0.5">Usuarios Afectados</span><span className="text-white font-medium">{selectedBreach.affectedUsers || '0'}</span></div>
                <div><span className="text-text-muted block mb-0.5">Notificado APDP</span><span className={`font-medium ${selectedBreach.notifiedAPDP ? 'text-emerald-400' : 'text-red-400'}`}>{selectedBreach.notifiedAPDP ? 'Sí' : 'No'}</span></div>
                <div><span className="text-text-muted block mb-0.5">Reportado CSIRT</span><span className={`font-medium ${selectedBreach.reportToCSIRT ? 'text-emerald-400' : 'text-text-muted'}`}>{selectedBreach.reportToCSIRT ? 'Sí' : 'No'}</span></div>
                {selectedBreach.resolvedAt && <div><span className="text-text-muted block mb-0.5">Resuelto</span><span className="text-white font-medium">{new Date(selectedBreach.resolvedAt).toLocaleString('es-CL')}</span></div>}
              </div>
              {selectedBreach.description && <div><span className="text-text-muted text-[11px] block mb-0.5">Descripción</span><p className="text-[11px] text-text-body bg-bg-base/40 rounded-lg p-3">{selectedBreach.description}</p></div>}
              {selectedBreach.rootCause && <div><span className="text-text-muted text-[11px] block mb-0.5">Causa Raíz</span><p className="text-[11px] text-text-body bg-bg-base/40 rounded-lg p-3">{selectedBreach.rootCause}</p></div>}
              {selectedBreach.containmentActions?.length > 0 && <div><span className="text-text-muted text-[11px] block mb-0.5">Acciones de Contención</span><div className="flex flex-wrap gap-1">{selectedBreach.containmentActions.map((a, i) => <span key={i} className="px-2 py-0.5 bg-bg-elevated border border-border-theme rounded text-[10px] text-text-body">{a}</span>)}</div></div>}
              {selectedBreach.affectedData?.length > 0 && <div><span className="text-text-muted text-[11px] block mb-0.5">Datos Afectados</span><div className="flex flex-wrap gap-1">{selectedBreach.affectedData.map((d, i) => <span key={i} className="px-2 py-0.5 bg-bg-elevated border border-border-theme rounded text-[10px] text-text-body">{d}</span>)}</div></div>}
              <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
                {selectedBreach.sensitiveDataInvolved && <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">Datos Sensibles</span>}
                {selectedBreach.childrenDataInvolved && <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-400">Menores</span>}
                {selectedBreach.economicDataInvolved && <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400">Datos Económicos</span>}
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-white/[0.04]/60 bg-bg-base/40">
              <button onClick={() => setShowBreachDetailModal(false)} className="px-4 py-2 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme/50 hover:border-surface-600 transition-all">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {breachResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-bg-panel border border-border-theme/50 rounded-2xl w-full max-w-[420px] mx-4 shadow-2xl shadow-black/40 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-text-heading">Resolver Violación</h3>
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
                    <button key={opt.value} onClick={() => setBreachResolveType(opt.value)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        breachResolveType === opt.value
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-text-heading'
                          : 'bg-bg-base/40 border-border-theme/50 text-text-muted hover:border-surface-600'
                      }`}>
                      <p className="text-[11px] font-semibold">{opt.label}</p>
                      <p className="text-[9px] text-text-muted mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-text-muted font-semibold uppercase tracking-wider mb-2 block">Notas (opcional)</label>
                <textarea value={breachResolveNotes} onChange={e => setBreachResolveNotes(e.target.value)}
                  placeholder="Describe los pasos tomados para resolver..."
                  rows={3}
                  className="w-full bg-bg-base/60 border border-border-theme/50 rounded-xl px-4 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle transition-all resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/[0.04]/60 bg-bg-base/40">
              <button onClick={() => setBreachResolveModal(null)}
                className="px-4 py-2 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme/50 hover:border-surface-600 transition-all">
                Cancelar
              </button>
              <button onClick={confirmBreachResolve} disabled={!breachResolveType || breachResolving}
                className="px-4 py-2 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {breachResolving ? <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                {breachResolving ? 'Resolviendo...' : 'Resolver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editInvItem && (
        <Modal show={true} onClose={() => setEditInvItem(null)} title="Editar Registro de Inventario">
          <form onSubmit={updateInventoryItem} className="space-y-3">
            <Inp value={editInvItem.category} onChange={e => setEditInvItem({...editInvItem, category: e.target.value})} label="Categoría *" required />
            <Inp value={editInvItem.dataType} onChange={e => setEditInvItem({...editInvItem, dataType: e.target.value})} label="Tipo de Dato *" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Sel value={editInvItem.sensitive?.toString()} onChange={e => setEditInvItem({...editInvItem, sensitive: e.target.value === 'true'})} label="Datos Sensibles" options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Sí' }]} />
              <Sel value={editInvItem.risk} onChange={e => setEditInvItem({...editInvItem, risk: e.target.value})} label="Nivel de Riesgo" options={[{ value: 'low', label: 'Bajo' }, { value: 'medium', label: 'Medio' }, { value: 'high', label: 'Alto' }, { value: 'critical', label: 'Crítico' }]} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Sel value={editInvItem.storage} onChange={e => setEditInvItem({...editInvItem, storage: e.target.value})} label="Almacenamiento" options={[{ value: 'local', label: 'Local' }, { value: 'cloud', label: 'Nube' }, { value: 'hybrid', label: 'Híbrido' }]} />
              <Inp value={editInvItem.retentionDays || ''} onChange={e => setEditInvItem({...editInvItem, retentionDays: e.target.value})} label="Retención (días)" type="number" />
            </div>
            <Inp value={editInvItem.storageLocation || ''} onChange={e => setEditInvItem({...editInvItem, storageLocation: e.target.value})} label="Ubicación del Almacenamiento" />
            <Inp value={editInvItem.purpose || ''} onChange={e => setEditInvItem({...editInvItem, purpose: e.target.value})} label="Finalidad" />
            <Sel value={editInvItem.legalBasis} onChange={e => setEditInvItem({...editInvItem, legalBasis: e.target.value})} label="Base Legal" options={[{ value: 'consent', label: 'Consentimiento' }, { value: 'contract', label: 'Contrato' }, { value: 'legal_obligation', label: 'Obligación Legal' }, { value: 'legitimate_interest', label: 'Interés Legítimo' }, { value: 'public_interest', label: 'Interés Público' }]} />
            <Inp value={typeof editInvItem.sharedWith === 'string' ? editInvItem.sharedWith : (editInvItem.sharedWith || []).join(', ')} onChange={e => setEditInvItem({...editInvItem, sharedWith: e.target.value})} label="Compartido Con" placeholder="proveedor1, proveedor2 (separado por comas)" />
            <Inp value={typeof editInvItem.securityMeasures === 'string' ? editInvItem.securityMeasures : (editInvItem.securityMeasures || []).join(', ')} onChange={e => setEditInvItem({...editInvItem, securityMeasures: e.target.value})} label="Medidas de Seguridad" placeholder="ISO 27001, encriptación (separado por comas)" />
            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.04]">
              <Btn type="button" onClick={() => setEditInvItem(null)} variant="secondary">Cancelar</Btn>
              <Btn type="submit">Guardar Cambios</Btn>
            </div>
          </form>
        </Modal>
      )}

      {editConsentItem && (
        <Modal show={true} onClose={() => setEditConsentItem(null)} title="Editar Consentimiento">
          <form onSubmit={updateConsentItem} className="space-y-3">
            <Inp value={editConsentItem.titularName || ''} onChange={e => setEditConsentItem({...editConsentItem, titularName: e.target.value})} label="Nombre del Titular" />
            <Inp value={editConsentItem.titularEmail || ''} onChange={e => setEditConsentItem({...editConsentItem, titularEmail: e.target.value})} label="Email del Titular" type="email" required />
            <Inp value={editConsentItem.titularRut || ''} onChange={e => setEditConsentItem({...editConsentItem, titularRut: e.target.value})} label="RUT del Titular" />
            <Inp value={editConsentItem.purpose || ''} onChange={e => setEditConsentItem({...editConsentItem, purpose: e.target.value})} label="Finalidad del Tratamiento" />
            <Inp value={editConsentItem.dataCategories || ''} onChange={e => setEditConsentItem({...editConsentItem, dataCategories: e.target.value})} label="Categorías de Datos" placeholder="nombre, email, teléfono (separado por comas)" />
            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.04]">
              <Btn type="button" onClick={() => setEditConsentItem(null)} variant="secondary">Cancelar</Btn>
              <Btn type="submit">Guardar Cambios</Btn>
            </div>
          </form>
        </Modal>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-2xl shadow-black/40 border flex items-center gap-3 animate-in slide-in-from-bottom-4 ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
          {toast.type === 'error' ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          )}
          <span className="text-[12px] font-medium">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

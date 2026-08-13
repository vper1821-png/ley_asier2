import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import { useTheme } from '../context/ThemeContext';
import { TourProvider, useTour } from '../context/TourContext';
import Compliance from './Compliance';
import Agents from './Agents';
import Alerts from './Alerts';
import Reports from './Reports';
import Databases from './Databases';
import DatabaseLogs from './DatabaseLogs';
import SupportChat from '../components/SupportChat';
import NotificationBell from '../components/NotificationBell';
import AlertBanner from '../components/AlertBanner';
import * as api from '../api/api';
import Hardening from './Hardening';
import Tickets from './Tickets';
import PaymentsUser from './PaymentsUser';
import DashboardContent from './DashboardContent';
import AccountSettings from './AccountSettings';
import ArcoRequests from './ArcoRequests';
import DashboardDPO from './DashboardDPO';
import HostMonitor from './HostMonitor';
import ErrorBoundary from '../components/ErrorBoundary';

const navItems = [
  { id: 'dashboard', labelKey: 'sidebar.dashboard', icon: 'dashboard' },
  { id: 'agents', labelKey: 'sidebar.agents', icon: 'agents' },
  { id: 'host-monitor', labelKey: 'sidebar.hostMonitor', icon: 'hostMonitor' },
  { id: 'alerts', labelKey: 'sidebar.alerts', icon: 'alerts' },
  { id: 'reports', labelKey: 'sidebar.reports', icon: 'reports' },
  { id: 'databases',  labelKey: 'sidebar.databases',  icon: 'databases' },
  { id: 'db-logs',    labelKey: 'sidebar.dbLogs',    icon: 'dbLogs' },
  { id: 'compliance', labelKey: 'sidebar.compliance', icon: 'compliance' },
  { id: 'hardening', labelKey: 'sidebar.hardening', icon: 'hardening' },
  { id: 'payments', labelKey: 'sidebar.payments', icon: 'payments' },
  { id: 'tickets', labelKey: 'sidebar.tickets', icon: 'tickets' },
  { id: 'arco', labelKey: 'sidebar.arco', icon: 'arco' },
  { id: 'dpo',    labelKey: 'sidebar.dpo',    icon: 'dpo' },
  { id: 'settings', labelKey: 'sidebar.settings', icon: 'settings' },
];

const getNavIcon = (name) => {
  const icons = {
    dashboard: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
    agents: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
    hostMonitor: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    alerts: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
    reports: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
    ai: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
    databases: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>,
    compliance: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    hardening: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    dbLogs: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>,
    tickets: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>,
    arco: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
    dpo: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>,
    payments: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
    settings: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    lawTools: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
  };
  return icons[name] || null;
};

function DashboardInner({ sidebarCollapsed, setSidebarCollapsed, mobileSidebar, setMobileSidebar, activeNav, setActiveNav }) {
  const { user, logout, token } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const { presets, currentPreset, resolvedColors, theme, setPreset, setCustom, resetCustom } = useTheme();
  const { startTour, isRunning, currentStep, totalSteps } = useTour();
  const navigate = useNavigate();
  const [showThemePopup, setShowThemePopup] = useState(false);
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [complianceScore, setComplianceScore] = useState(0);

  useEffect(() => {
    if (!user?.paymentStatus) return;
    if (user?.isAdmin) return;
    if (user.paymentStatus !== 'active') {
      navigate('/pending', { replace: true });
    }
  }, [user?.paymentStatus, user?.isAdmin]);

  useEffect(() => {
    if (!token) return;
    api.getDashboardStatus(token).then(res => {
      if (!res.error) {
        setMaintenanceInfo({ maintenanceMode: res.maintenanceMode, maintenanceMessage: res.maintenanceMessage });
        if (Array.isArray(res.alerts)) setAlerts(res.alerts);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch('/api/payments/my-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    }).then(r => r.json()).then(data => {
      if (data?.error === 'token inválido' || data?.error === 'token requerido') {
        if (!window.__sessionExpiredFired) {
          window.__sessionExpiredFired = true;
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
        return;
      }
      if (!data.error && data.pendingPayments?.length > 0) {
        const pending = data.pendingPayments;
        const total = pending.reduce((s, p) => s + (p.amount || 0), 0);
        const periods = pending.map(p => `${p.month}/${p.year}`).join(', ');
        api.createNotification(token, 'payment',
          `${pending.length} pago${pending.length > 1 ? 's' : ''} pendiente${pending.length > 1 ? 's' : ''}`,
          `${periods} por $${total} USD — Realiza la transferencia para mantener tu cuenta activa.`
        );
      }
    }).catch(() => {});
  }, []);
  const customVars = [
    { var: '--primary-500', label: 'Primary', desc: 'Main brand color' },
    { var: '--primary-600', label: 'Primary Dark', desc: 'Hover / active' },
    { var: '--surface-800', label: 'Surface Elevated', desc: 'Cards & panels' },
    { var: '--surface-700', label: 'Surface Border', desc: 'Borders & dividers' },
    { var: '--surface-650', label: 'Surface Hover', desc: 'Hover backgrounds' },
    { var: '--success', label: 'Success', desc: 'Positive states' },
    { var: '--warning', label: 'Warning', desc: 'Caution states' },
    { var: '--danger', label: 'Danger', desc: 'Error states' },
    { var: '--text-color', label: 'Text', desc: 'Body text color' },
  ];
  const [customColors, setCustomColors] = useState(() => {
    const init = {};
    customVars.forEach(cv => { init[cv.var] = resolvedColors[cv.var] || '#000000'; });
    return init;
  });
  const popupRef = useRef(null);

  useEffect(() => {
    setCustomColors({
      ...customVars.reduce((acc, cv) => ({ ...acc, [cv.var]: resolvedColors[cv.var] || '#000000' }), {}),
    });
  }, [resolvedColors]);

  useEffect(() => {
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setShowThemePopup(false);
    };
    if (showThemePopup) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showThemePopup]);

  const presetSwatches = (p) => (
    <div className="flex gap-px">
      <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: p.colors['--primary-500'] }}></div>
      <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: p.colors['--surface-700'] }}></div>
      <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: p.colors['--surface-800'] }}></div>
      <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: p.colors['--surface-950'] }}></div>
    </div>
  );

  const handleLogout = () => { logout(); navigate('/'); };

  const activeLabel = t(navItems.find(n => n.id === activeNav)?.labelKey || '');

  const renderSidebar = (mobile = false) => (
    <aside className={`flex flex-col bg-bg-base ${mobile ? 'w-72 h-full' : 'border-r border-border-theme transition-all duration-300 flex-shrink-0 ' + (sidebarCollapsed ? 'w-16' : 'w-56')}`}>
      {/* Logo */}
      <div className={`flex items-center ${sidebarCollapsed && !mobile ? 'justify-center px-0 py-3' : 'px-3 py-3 space-x-2'} border-b border-border-theme tour-sidebar-logo`}>
        <div className="w-7 h-7 rounded flex items-center justify-center overflow-hidden flex-shrink-0 bg-bg-panel">
          <img src="/logo-nuevo.png" alt="SecureLab" className="w-full h-full object-contain" />
        </div>
        {!sidebarCollapsed || mobile ? (
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-white truncate font-medium">SecureLab</p>
            <p className="text-[9px] text-text-subtle truncate leading-tight mt-px">Cumplimiento ley 21.719</p>
          </div>
        ) : null}
        {mobile && (
          <button onClick={() => setMobileSidebar(false)} className="p-1 rounded text-text-muted hover:text-text-heading hover:bg-bg-elevated">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Pending compliance ring */}
      {(!sidebarCollapsed || mobile) && (
        <div className="px-4 py-3 border-b border-border-theme">
          <p className="text-[10px] font-medium text-text-subtle uppercase tracking-wider mb-2">Tareas pendientes</p>
          <div className="flex items-center gap-3">
            <div className={`relative w-14 h-14 shrink-0 ${
              complianceScore === 100 ? 'text-emerald-500' : complianceScore >= 60 ? 'text-yellow-400' : 'text-red-500'
            }`}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="5" className="text-text-subtle opacity-20" />
                <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - complianceScore / 100)} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-text-heading">{complianceScore}%</span>
            </div>
            <p className="text-[11px] text-text-body leading-tight">
              {complianceScore === 100 ? 'Todo en orden' : complianceScore >= 60 ? 'Queda por completar' : 'Atención requerida'}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-custom tour-nav-items">
        <div className={sidebarCollapsed && !mobile ? 'px-1' : 'px-3'}>
          {(!sidebarCollapsed || mobile) && (
            <p className="text-[10px] font-medium text-text-subtle uppercase tracking-wider mb-1.5 px-2">
              {t('sidebar.general')}
            </p>
          )}
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveNav(item.id); if (mobile) setMobileSidebar(false); }}
              className={`w-full flex items-center ${sidebarCollapsed && !mobile ? 'justify-center' : 'space-x-2'} px-2 py-1.5 rounded text-[12px] transition-colors ${
                activeNav === item.id
                  ? 'bg-bg-panel text-text-heading'
                  : 'text-text-muted hover:bg-bg-panel hover:text-text-heading'
              }`}>
              {getNavIcon(item.icon)}
              {(!sidebarCollapsed || mobile) && <span>{t(item.labelKey)}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-border-theme space-y-1.5">
        <button onClick={startTour}
          className={`w-full flex items-center ${sidebarCollapsed && !mobile ? 'justify-center' : 'justify-center gap-2'} px-2.5 py-2 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-primary-600/20 to-indigo-600/20 text-accent hover:from-primary-600/30 hover:to-indigo-600/30 hover:text-primary-300 transition-all duration-200 tour-start-btn`}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          {(!sidebarCollapsed || mobile) && <span>Tour guiado</span>}
        </button>

        <button onClick={() => setShowThemePopup(true)}
          className={`w-full flex items-center ${sidebarCollapsed && !mobile ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg text-[11px] bg-bg-panel/80 border border-border-theme text-text-muted cursor-pointer hover:bg-bg-elevated/80 hover:border-surface-600 hover:text-text-body transition-all duration-200 tour-theme-btn`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: resolvedColors['--primary-500'], boxShadow: `0 0 6px ${resolvedColors['--primary-500']}60` }}></div>
            {(!sidebarCollapsed || mobile) && <span className="truncate font-medium">{currentPreset.label}</span>}
          </div>
          {(!sidebarCollapsed || mobile) && (
            <svg className="w-3 h-3 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          )}
        </button>

        {user?.isAdmin && (
          <button onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium bg-bg-panel/80 border border-border-theme text-text-muted hover:bg-bg-elevated/80 hover:border-surface-600 hover:text-gray-200 transition-all duration-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {(!sidebarCollapsed || mobile) && <span>{t('admin.panelAdmin')}</span>}
          </button>
        )}

        {/* Collapse toggle — desktop only */}
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex w-full items-center justify-center px-2.5 py-2 rounded-lg text-[11px] bg-bg-panel/80 border border-border-theme text-text-muted hover:bg-bg-elevated/80 hover:border-surface-600 hover:text-text-body transition-all duration-200">
          <svg className={`w-3.5 h-3.5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
          </svg>
        </button>

        <div className="tour-notifications">
          <NotificationBell collapsed={sidebarCollapsed && !mobile} />
        </div>

        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium bg-red-900/10 border border-red-800/20 text-red-400 hover:bg-red-900/20 hover:border-red-700/30 transition-all duration-200 tour-logout-btn">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          {(!sidebarCollapsed || mobile) && <span>{t('sidebar.logout')}</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-bg-base text-[13px] text-text-body overflow-hidden">
      {/* Sidebar — desktop */}
      <div className="hidden md:flex">
        {renderSidebar(false)}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebar(false)} />
          <div className="relative z-10">
            {renderSidebar(true)}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-hidden bg-bg-base flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-3 py-2.5 border-b border-border-theme flex-shrink-0">
          <button onClick={() => setMobileSidebar(true)} className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-bg-panel">
              <img src="/logo-nuevo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <span className="text-[13px] font-medium text-white truncate">{activeLabel}</span>
          </div>
          <div className="tour-notifications">
            <NotificationBell collapsed={false} dropUp={false} />
          </div>
        </div>

        {(maintenanceInfo?.maintenanceMode && !user?.isAdmin) ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Modo Mantenimiento</h2>
              <p className="text-[13px] text-text-muted mb-4">{maintenanceInfo?.maintenanceMessage || 'El sistema se encuentra en mantenimiento. Vuelve a intentarlo más tarde.'}</p>
              <div className="w-8 h-8 mx-auto border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 md:p-4 tour-main-content">
            <AlertBanner alerts={alerts} />
            <ErrorBoundary>
              {activeNav === 'compliance' && <Compliance />}
              {activeNav === 'agents' && <Agents onNavigate={setActiveNav} />}
              {activeNav === 'host-monitor' && <HostMonitor />}
              {activeNav === 'alerts' && <Alerts />}
              {activeNav === 'reports' && <Reports />}
              {activeNav === 'databases' && <Databases />}
              {activeNav === 'db-logs' && <DatabaseLogs />}
              {activeNav === 'hardening' && <Hardening />}
              {activeNav === 'tickets' && <Tickets />}
              {activeNav === 'payments' && <PaymentsUser />}
              {activeNav === 'arco' && <ArcoRequests />}
              {activeNav === 'dpo' && <DashboardDPO />}
              {activeNav === 'settings' && <AccountSettings />}
              {activeNav === 'dashboard' && <DashboardContent />}
            </ErrorBoundary>
          </div>
        )}
      </main>

      <div className="tour-support-chat">
        <SupportChat />
      </div>
      {/* Theme Popup */}
      {showThemePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowThemePopup(false)}></div>
          <div ref={popupRef} className="relative bg-bg-panel/95 backdrop-blur-2xl border border-border-theme rounded-2xl shadow-2xl shadow-black/50 w-full max-w-[440px] mx-3 max-h-[85vh] overflow-y-auto scrollbar-custom p-3 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold text-text-heading">Theme</h2>
              <button onClick={() => setShowThemePopup(false)} className="p-1 rounded-lg text-text-muted hover:text-text-body hover:bg-white/[0.06] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Presets */}
            <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest mb-3">Presets</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {presets.map(p => {
                const isActive = currentPreset.name === p.name && Object.keys(theme.custom).length === 0;
                return (
                  <button key={p.name} onClick={() => { setPreset(p.name); resetCustom(); }}
                    className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150 border ${
                      isActive
                        ? 'bg-primary-500/10 border-primary-500/30 shadow-sm shadow-primary-500/10'
                        : 'bg-bg-elevated/30 border-border-theme'
                    }`}>
                    {presetSwatches(p)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium truncate ${isActive ? 'text-text-heading' : 'text-text-body'}`}>{p.label}</p>
                      <p className="text-[10px] text-text-subtle mt-0.5 capitalize">{p.name.replace(/-/g, ' ')}</p>
                    </div>
                    {isActive && (
                      <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom colors */}
            <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest mb-3">Custom Colors</p>
            <div className="space-y-2 mb-5">
              {customVars.map(cv => {
                const isCustomized = theme.custom[cv.var] !== undefined;
                return (
                  <div key={cv.var} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-150 ${
                    isCustomized
                      ? 'bg-primary-500/5 border-accent-border'
                      : 'bg-bg-elevated/30 border-border-theme'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md border border-border-theme" style={{ backgroundColor: customColors[cv.var] }}></div>
                      <div>
                        <p className="text-[12px] text-text-body">{cv.label}</p>
                        <p className="text-[10px] text-text-subtle font-mono">{customColors[cv.var]}{isCustomized ? ' *' : ''}</p>
                      </div>
                    </div>
                    <input type="color" value={customColors[cv.var]} onChange={(e) => {
                      const c = e.target.value;
                      setCustomColors(prev => ({ ...prev, [cv.var]: c }));
                      setCustom(cv.var, c);
                    }}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0" />
                  </div>
                );
              })}
            </div>

            <button onClick={() => { resetCustom(); setCustomColors(prev => {
              const next = {};
              customVars.forEach(cv => { next[cv.var] = resolvedColors[cv.var] || '#000000'; });
              return next;
            }); }}
              className="w-full py-2.5 rounded-xl text-[11px] font-medium text-text-muted hover:text-text-body bg-bg-elevated/30 hover:bg-bg-elevated/40 border border-border-theme hover:border-surface-600 transition-all duration-150">
              Reset all to preset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardShell />
  );
}

function DashboardShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');

  return (
    <TourProvider setActiveNav={setActiveNav} setMobileSidebar={setMobileSidebar}>
      <DashboardInner
        sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}
        mobileSidebar={mobileSidebar} setMobileSidebar={setMobileSidebar}
        activeNav={activeNav} setActiveNav={setActiveNav}
      />
    </TourProvider>
  );
}

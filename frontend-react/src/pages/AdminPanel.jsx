import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api/api';

const initialPlans = {
  Free: { name: 'Free', price: 0, scans: 5, agents: 1, support: 'Email', features: ['1 dominio', '5 escaneos/mes', 'Reportes bÃ¡sicos', 'Soporte email'] },
  Basic: { name: 'Basic', price: 29, scans: 50, agents: 3, support: 'Email Prioritario', features: ['3 dominios', '50 escaneos/mes', 'Reportes PDF', '3 agentes', 'Soporte prioritario'] },
  Advanced: { name: 'Advanced', price: 79, scans: 200, agents: 10, support: 'Chat 24/7', features: ['10 dominios', '200 escaneos/mes', 'Reportes avanzados', '10 agentes', 'Chat 24/7', 'API access'] },
  Expert: { name: 'Expert', price: 199, scans: -1, agents: -1, support: 'Dedicado', features: ['Dominios ilimitados', 'Escaneos ilimitados', 'Agentes ilimitados', 'Soporte dedicado', 'API + Webhooks', 'On-premise'] },
};

export default function AdminPanel() {
  const { user, token } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const { presets, currentPreset, setPreset } = useTheme();
  const navigate = useNavigate();
  const getDefaultTab = (r) => {
    if (r === 'support') return 'tickets';
    if (r === 'finance') return 'payments';
    return 'overview';
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab(user?.role));
  const [users, setUsers] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ companyName: '', email: '', domain: '', password: '', planType: 'Free', isActive: true, aiRetention: 'never', role: 'user' });
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('impago');
  const [suspendCustomReason, setSuspendCustomReason] = useState('');

  const [plans, setPlans] = useState(() => { const s = localStorage.getItem('invisia_plans'); return s ? JSON.parse(s) : initialPlans; });
  const [plansLoading, setPlansLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ price: 0, scans: 0, agents: 0, support: '', features: [] });
  const [featureInput, setFeatureInput] = useState('');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [settings, setSettings] = useState({ contactPhone: '', contactEmail: '', smtpHost: '', smtpPort: '', smtpUser: '', smtpPassword: '', smtpFromEmail: '', enablePdfEmailNotification: false, enableTicketNotification: false, pdfEmailSubject: '', pdfEmailBody: '' });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkHtml, setBulkHtml] = useState('');
  const [bulkContacts, setBulkContacts] = useState([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkPreview, setBulkPreview] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [agentName, setAgentName] = useState(() => localStorage.getItem('adminAgentName') || '');
  const [agentNameModal, setAgentNameModal] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [systemHealth] = useState([
    { name: 'REST API', status: 'operational', latency: '-', uptime: '-' },
    { name: 'WebSocket Server', status: 'operational', latency: '-', uptime: '-' },
  ]);
  const [liveAgents] = useState([]);
  const [liveAlerts] = useState([]);

  const [incidentTypeFilter, setIncidentTypeFilter] = useState('all');
  const [incidentSearch, setIncidentSearch] = useState('');
  const [contactModal, setContactModal] = useState(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactBody, setContactBody] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactMsg, setContactMsg] = useState('');

  const [userDetailModal, setUserDetailModal] = useState(null);
  const [userDetailData, setUserDetailData] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [resetPwModal, setResetPwModal] = useState(null);
  const [resetPwValue, setResetPwValue] = useState('');
  const [resetPwMsg, setResetPwMsg] = useState('');
  const [userActionMsg, setUserActionMsg] = useState('');

  const [alerts, setAlerts] = useState([]);
  const [alertForm, setAlertForm] = useState({ title: '', message: '', type: 'info', enabled: true, showOnLanding: false });
  const [editingAlert, setEditingAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceScheduledAt, setMaintenanceScheduledAt] = useState('');
  const [logCompanyFilter, setLogCompanyFilter] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');
  const [logTotal, setLogTotal] = useState(0);
  const [logOffset, setLogOffset] = useState(0);
  const logLimit = 50;

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsMsg, setReportsMsg] = useState('');
  const [reportCompanyFilter, setReportCompanyFilter] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const loadReports = async () => {
    setReportsLoading(true);
    const res = await api.getAdminReports(token, reportCompanyFilter || undefined, reportSearch || undefined);
    if (res.data?.error) { setReportsMsg('Error: ' + res.data.error); setReports([]); }
    else { setReports(res.data || []); setReportsMsg(''); }
    setReportsLoading(false);
  };
  const deleteReport = async (reportId) => {
    if (!confirm('¿Eliminar este reporte permanentemente?')) return;
    const res = await api.deleteAdminReport(token, reportId);
    if (res.data?.success) { setReports(reports.filter(r => r._id !== reportId)); setReportsMsg('Reporte eliminado.'); }
    else { setReportsMsg('Error: ' + (res.data?.error || '')); }
  };
  const downloadAdminReport = (reportId, title) => {
    window.open(`/api/reports/download/${reportId}?token=${encodeURIComponent(token)}`, '_blank');
  };
  const formatReportSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const exportCSV = (data, columns, filename) => {
    const header = columns.map(c => `"${c}"`).join(',');
    const rows = data.map(row => columns.map(c => {
      const val = typeof c === 'function' ? c(row) : row[c] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(','));
    const csv = [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!token || !user?.isAdmin) { navigate('/dashboard'); return; }
    loadUsers();
    loadTickets();
  }, []);

  const loadUsers = async () => {
    const res = await api.listUsers(token);
    if (!res.error) setUsers(Array.isArray(res) ? res : []);
    setLoading(false);
  };

  const loadTickets = async () => {
    const res = await api.getSupportTickets(token);
    if (!res.error) setAllTickets(Array.isArray(res) ? res : []);
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    const res = await api.getAuditLogs(token, 100);
    if (!res.error) setLogs(Array.isArray(res) ? res : []);
    setLogsLoading(false);
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    const res = await api.loadAdminSettings(token);
    if (!res.error) {
      const s = res;
      setSettings({
        contactPhone: s.contactPhone || '',
        contactEmail: s.contactEmail || '',
        smtpHost: s.smtpHost || '',
        smtpPort: s.smtpPort || '',
        smtpUser: s.smtpUser || '',
        smtpPassword: s.smtpPassword || '',
        smtpFromEmail: s.smtpFromEmail || '',
        enablePdfEmailNotification: !!s.enablePdfEmailNotification,
        enableTicketNotification: !!s.enableTicketNotification,
        pdfEmailSubject: s.pdfEmailSubject || '',
        pdfEmailBody: s.pdfEmailBody || '',
      });
    }
    setSettingsLoading(false);
  };

  const loadPlans = async () => {
    const res = await api.getPlans(token).catch(() => ({ error: true }));
    if (!res.error && res.plans) {
      setPlans(res.plans);
      localStorage.setItem('invisia_plans', JSON.stringify(res.plans));
    }
    setPlansLoading(false);
  };

  const loadPaymentUsers = async () => {
    const res = await api.getPaymentUsers(token);
    if (!res.error) setPaymentUsers(Array.isArray(res) ? res : []);
  };

  const loadAlerts = async () => {
    const res = await api.getAdminAlerts(token);
    if (!res.error) setAlerts(Array.isArray(res) ? res : []);
  };

  const loadMaintenanceStatus = async () => {
    const res = await api.getMaintenanceStatus();
    if (!res.error) {
      setMaintenanceMode(res.maintenanceMode);
      setMaintenanceMessage(res.maintenanceMessage || '');
      setMaintenanceScheduledAt(res.maintenanceScheduledAt ? res.maintenanceScheduledAt.slice(0, 16) : '');
    }
  };

  const handleSaveAlert = async (e) => {
    e.preventDefault();
    const data = {
      title: alertForm.title,
      message: alertForm.message,
      type: alertForm.type,
      enabled: alertForm.enabled,
      showOnLanding: alertForm.showOnLanding,
    };
    if (editingAlert) data.alertId = editingAlert._id;
    const res = await api.saveAdminAlert(token, data);
    if (!res.error) { loadAlerts(); setShowAlertModal(false); setEditingAlert(null); setAlertForm({ title: '', message: '', type: 'info', enabled: true, showOnLanding: false }); }
  };

  const handleToggleAlert = async (alertId, enabled) => {
    await api.toggleAdminAlert(token, alertId, enabled);
    loadAlerts();
  };

  const handleDeleteAlert = async (alertId) => {
    if (!confirm('Delete this alert?')) return;
    const res = await api.deleteAdminAlert(token, alertId);
    if (!res.error) loadAlerts();
  };

  const handleToggleMaintenance = async () => {
    const newMode = !maintenanceMode;
    const res = await api.toggleMaintenance(token, { maintenanceMode: newMode, maintenanceMessage, maintenanceScheduledAt: maintenanceScheduledAt || null });
    if (!res.error) setMaintenanceMode(newMode);
  };

  const handleSaveMaintenance = async () => {
    const res = await api.toggleMaintenance(token, { maintenanceMode, maintenanceMessage, maintenanceScheduledAt: maintenanceScheduledAt || null });
    if (!res.error) loadMaintenanceStatus();
  };

  const loadAuditLogs = async (offset = 0) => {
    setLogsLoading(true);
    const filters = { limit: logLimit, offset, search: logSearch };
    if (logCompanyFilter) filters.companyName = logCompanyFilter;
    if (logActionFilter) filters.actionFilter = logActionFilter;
    if (logDateFrom) filters.startDate = logDateFrom;
    if (logDateTo) filters.endDate = logDateTo;
    const res = await api.getAuditLogsAdvanced(token, filters);
    if (!res.error) {
      setLogs(Array.isArray(res.logs) ? res.logs : []);
      setLogTotal(res.total || 0);
      setLogOffset(offset);
    }
    setLogsLoading(false);
  };

  useEffect(() => { if (activeTab === 'overview') { if (logs.length === 0) loadLogs(); } }, [activeTab]);
  useEffect(() => { if (activeTab === 'logs') loadAuditLogs(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'settings' && !settings.smtpHost && !settingsLoading) loadSettings(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'payments') loadPaymentUsers(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'incidents') { loadPaymentUsers(); loadTickets(); loadUsers(); } }, [activeTab]);
  useEffect(() => { if (activeTab === 'alerts') loadAlerts(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'alerts') loadMaintenanceStatus(); }, [activeTab]);


  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const res = await api.updateUser(token, editingUser._id, userForm.planType, userForm.isActive, userForm.aiRetention, userForm.role);
      if (!res.error) { loadUsers(); setShowUserModal(false); setEditingUser(null); setUserForm({ companyName: '', email: '', domain: '', password: '', planType: 'Free', isActive: true, aiRetention: 'never', role: 'user' }); }
    } else {
      const res = await api.adminCreateUser(token, userForm.companyName, userForm.email, userForm.domain, userForm.password, userForm.planType, userForm.role, userForm.isActive);
      if (!res.error) { loadUsers(); setShowUserModal(false); setUserForm({ companyName: '', email: '', domain: '', password: '', planType: 'Free', isActive: true, aiRetention: 'never', role: 'user' }); }
    }
  };

  const handleSuspendUser = () => {
    if (!suspendTarget) return;
    const reason = suspendReason === 'otro' ? suspendCustomReason : suspendReason;
    api.suspendUser(token, suspendTarget._id, reason).then(res => {
      if (!res.error) { loadUsers(); setShowSuspendModal(false); setSuspendTarget(null); setSuspendReason('impago'); setSuspendCustomReason(''); }
    });
  };

  const handleActivateUser = async (u) => {
    const res = await api.activateUser(token, u._id);
    if (!res.error) loadUsers();
  };

  const deleteUser = async (uid) => {
    if (!confirm('Delete this user?')) return;
    const res = await api.deleteUser(token, uid);
    if (!res.error) loadUsers();
  };

  const purgeAiData = async (u) => {
    if (!confirm(t('admin.purgeConfirm') + u.companyName + '?')) return;
    const res = await api.purgeUserAiData(token, u._id);
    if (!res.error) loadUsers();
  };

  const reset2FA = async (u) => {
    if (!confirm(`Reset 2FA for ${u.companyName}? This will disable their authenticator app.`)) return;
    const res = await api.resetUser2FA(token, u._id);
    if (!res.error) loadUsers();
  };

  const openUserDetail = async (u) => {
    setUserDetailModal(u);
    setUserDetailLoading(true);
    setUserDetailData(null);
    const res = await api.adminGetUserDetails(token, u._id);
    if (!res.error) setUserDetailData(res);
    setUserDetailLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetPwValue || resetPwValue.length < 4) { setResetPwMsg('La contraseña debe tener al menos 4 caracteres'); return; }
    setResetPwMsg('');
    const res = await api.adminResetUserPassword(token, resetPwModal._id, resetPwValue);
    if (!res.error) { setResetPwMsg('Contraseña actualizada correctamente'); setResetPwValue(''); setTimeout(() => setResetPwModal(null), 1500); }
    else { setResetPwMsg('Error: ' + (res.error || '')); }
  };

  const handleFullDeleteUser = async (u) => {
    if (!confirm(`¿ESTÁS SEGURO? Esta acción eliminará TODOS los datos de ${u.companyName} (usuarios, escaneos, bases de datos, reportes, alertas). No se puede deshacer.`)) return;
    if (!confirm(`Confirmación final: ¿Eliminar permanentemente a ${u.companyName} (${u.email})?`)) return;
    const res = await api.adminDeleteUserFull(token, u._id);
    if (!res.error) { setUserActionMsg('Usuario y todos sus datos eliminados'); loadUsers(); }
    else { setUserActionMsg('Error: ' + (res.error || '')); }
    setTimeout(() => setUserActionMsg(''), 3000);
  };

  const editUser = (u) => {
    setEditingUser(u);
    setUserForm({ companyName: u.companyName, email: u.email, domain: u.domain, password: '', planType: u.planType || 'Free', isActive: u.isActive !== false, aiRetention: u.aiRetention || 'never', role: u.role || 'user' });
    setShowUserModal(true);
  };

  const updateTicketStatus = async (ticketId, status) => {
    await api.updateSupportTicketStatus(token, ticketId, status);
    loadTickets();
  };

  const getTicketPriorityClass = (p) => {
    const map = { low: 'text-green-400 bg-green-900/20', medium: 'text-yellow-400 bg-yellow-900/20', high: 'text-red-400 bg-red-900/20', urgent: 'text-white bg-red-600/30' };
    return map[p] || 'text-text-muted bg-gray-900/20';
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '';

  const formatDateTime = (d) => d ? new Date(d).toLocaleString() : '';

  const handleEditPlan = (key) => {
    const p = plans[key];
    setEditingPlan(key);
    setPlanForm({ price: p.price, scans: p.scans, agents: p.agents, support: p.support, features: [...p.features] });
    setFeatureInput('');
  };

  const handleSavePlan = async () => {
    const updated = { ...plans, [editingPlan]: { ...plans[editingPlan], ...planForm } };
    setPlans(updated);
    localStorage.setItem('invisia_plans', JSON.stringify(updated));
    await api.savePlans(token, updated).catch(() => {});
    setEditingPlan(null);
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setPlanForm({ ...planForm, features: [...planForm.features, featureInput.trim()] });
    setFeatureInput('');
  };

  const removeFeature = (idx) => {
    setPlanForm({ ...planForm, features: planForm.features.filter((_, i) => i !== idx) });
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsMsg('');
    const res = await api.saveAdminSettings(token, settings);
    if (!res.error) setSettingsMsg('Settings saved successfully');
    else setSettingsMsg('Error: ' + (res.error || 'Unknown error'));
    setSettingsSaving(false);
    setTimeout(() => setSettingsMsg(''), 3000);
  };

  const [paymentUsers, setPaymentUsers] = useState([]);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentHistory, setPaymentHistory] = useState({});
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ paymentStatus: 'pending_approval', customPrice: 0, bankName: '', accountType: '', accountNumber: '', rut: '', email: '' });
  const [recordPaymentModal, setRecordPaymentModal] = useState(null);
  const [recordForm, setRecordForm] = useState({ amount: 0, concept: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'paid' });
  const [paymentLogModal, setPaymentLogModal] = useState(null);
  const [paymentLogUser, setPaymentLogUser] = useState(null);

  const role = user?.role || 'user';
  const incidentTickets = allTickets.filter(tk => (tk.status === 'open' || tk.status === 'in_progress') && ['high', 'urgent', 'critical'].includes(tk.priority || ''));
  const suspendedUsers = users.filter(u => u.isActive === false);
  const lowComplianceUsers = users.filter(u => u.isActive !== false && u.complianceScore != null && u.complianceScore < 40);
  const overduePaymentUsers = paymentUsers.filter(p => p.paymentStatus === 'suspended' || p.paymentStatus === 'overdue');
  const incidentCount = incidentTickets.length + suspendedUsers.length + lowComplianceUsers.length;
  const allSidebarItems = [
    { id: 'overview', label: t('admin.overview'), icon: 'overview', roles: ['admin', 'superadmin'] },
    { id: 'incidents', label: 'Incidentes', icon: 'incidents', roles: ['support', 'admin', 'superadmin'], count: incidentCount },
    { id: 'users', label: t('admin.users'), icon: 'users', roles: ['admin', 'superadmin'] },
    { id: 'alerts', label: 'Alertas', icon: 'alerts', roles: ['admin', 'superadmin'] },
    { id: 'payments', label: 'Pagos', icon: 'payments', roles: ['finance', 'admin', 'superadmin'] },
    { id: 'tickets', label: t('admin.tickets'), icon: 'tickets', roles: ['support', 'admin', 'superadmin'], count: allTickets.filter(t => t.status === 'open').length },
    { id: 'logs', label: t('admin.logs'), icon: 'logs', roles: ['admin', 'superadmin'] },
    { id: 'reports', label: 'Reportes', icon: 'logs', roles: ['admin', 'superadmin'] },
    { id: 'bulkemail', label: 'Email Marketing', icon: 'bulkemail', roles: ['admin', 'superadmin'] },
    { id: 'settings', label: t('admin.settings'), icon: 'settings', roles: ['admin', 'superadmin'] },
  ];
  const sidebarItems = allSidebarItems.filter(item => item.roles.includes(role));

  const getIcon = (name) => {
    const icons = {
      overview: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
      users: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
      tickets: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
      plans: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
      logs: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
      settings: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
      k8s2: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>,
      invisia2: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
      compliance: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
      enterprise: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
      payments: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
      alerts: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
      bulkemail: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
      incidents: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
    };
    return icons[name] || null;
  };

  const Tag = ({ label, color }) => (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${color}`}>{label}</span>
  );

  return (
    <div className="flex h-screen bg-bg-base text-[13px] text-text-body overflow-hidden">
      {/* Sidebar */}
      <>
      <aside className="w-56 bg-bg-base border-r border-border-theme flex flex-col">
        <div className="px-3 py-3 border-b border-border-theme flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-bg-panel flex items-center justify-center overflow-hidden">
            <img src="/logo-nuevo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-white truncate font-medium">{t('admin.panelAdmin')}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-4">
            <p className="text-[10px] font-medium text-text-subtle uppercase tracking-wider mb-1.5">{t('admin.management')}</p>
            {sidebarItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-[12px] transition-colors ${
                  activeTab === item.id
                    ? 'bg-bg-panel text-text-heading'
                    : 'text-text-muted hover:bg-bg-panel hover:text-text-heading'
                }`}>
                {getIcon(item.icon)}
                <span>{item.label}</span>
                {item.count > 0 && (
                  <span className="ml-auto bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 rounded">{item.count}</span>
                )}
              </button>
            ))}
          </div>
          
        </nav>

        <div className="px-3 py-3 border-t border-border-theme">
          <button onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center space-x-2 px-2 py-1.5 rounded text-[12px] text-text-muted hover:bg-bg-panel hover:text-text-heading transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>{t('admin.backToDashboard')}</span>
          </button>
          <button onClick={toggleLang}
            className="w-full flex items-center justify-center px-2 py-1.5 mt-1.5 rounded text-[11px] bg-bg-panel border border-border-theme text-text-muted hover:text-text-heading transition-colors">
            {lang === 'es' ? t('admin.switchToEnglish') : t('admin.switchToSpanish')}
          </button>
          <div className="relative mt-1.5 group">
            <div className="flex items-center justify-between px-2 py-1.5 rounded text-[11px] bg-bg-panel border border-border-theme text-text-muted cursor-pointer">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full border border-surface-600" style={{ backgroundColor: currentPreset.colors['--primary-500'] }}></div>
                <span>{currentPreset.label}</span>
              </div>
              <svg className="w-3 h-3 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
            <div className="absolute bottom-full left-0 right-0 mb-1 hidden group-hover:block z-50">
              <div className="bg-bg-panel border border-border-theme rounded-lg p-1.5 shadow-xl max-h-48 overflow-y-auto">
                {presets.map(p => (
                  <button key={p.name} onClick={() => setPreset(p.name)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] transition-colors ${
                      currentPreset.name === p.name ? 'bg-bg-elevated text-text-heading' : 'text-text-muted hover:bg-bg-elevated hover:text-text-heading'
                    }`}>
                    <div className="w-2.5 h-2.5 rounded-full border border-surface-600 flex-shrink-0" style={{ backgroundColor: p.colors['--primary-500'] }}></div>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border-theme flex-shrink-0">
              <h2 className="text-[14px] font-semibold text-text-heading">{t('admin.controlPanel')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const onlineAgents = liveAgents.filter(a => a.status === 'online' || a.online === true).length;
                  const threatAlerts = liveAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
                  return [
                  { label: t('admin.registeredUsers'), value: users.length, change: '+' + users.length, sub: t('admin.thisMonth') },
                  { label: t('admin.onlineAgents'), value: onlineAgents, total: liveAgents.length, sub: t('admin.ofTotal', { count: liveAgents.length }) },
                  { label: t('admin.openTickets'), value: allTickets.filter(t => t.status === 'open').length, change: allTickets.length > 0 ? '+' + allTickets.filter(t => t.status === 'open').length : '0', sub: t('admin.requireAttention') },
                  { label: t('admin.threatsToday'), value: String(threatAlerts), change: '-' + threatAlerts, sub: t('admin.vsYesterday'), danger: threatAlerts > 0 },
                ]})().map((stat, idx) => (
                  <div key={idx} className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-text-muted tracking-wide">{stat.label}</span>
                      {stat.total !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          <span className="text-[9px] text-green-400">{stat.value} {t('admin.agentsOnline')}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[22px] font-semibold text-white tracking-tight">
                      {stat.total ? `${stat.value}/${stat.total}` : stat.value}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-medium ${stat.change?.startsWith('-') ? 'text-green-400' : idx === 2 && stat.value > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{stat.change}</span>
                      <span className="text-[9px] text-text-subtle">{stat.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main content: System Status + Tickets + Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* System Status / Quick Actions */}
                <div className="lg:col-span-1 bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-semibold text-white tracking-wide">Estado del Sistema</h3>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${maintenanceMode ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></span>
                      <span className={`text-[9px] ${maintenanceMode ? 'text-amber-400' : 'text-green-400'}`}>
                        {maintenanceMode ? 'Mantenimiento activo' : 'Operativo'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {[
                      { label: 'Usuarios registrados', value: users.length, color: 'text-accent' },
                      { label: 'Agentes online', value: `${liveAgents.filter(a => a.status === 'online' || a.online === true).length}/${liveAgents.length}`, color: 'text-green-400' },
                      { label: 'Tickets abiertos', value: allTickets.filter(t => t.status === 'open').length, color: allTickets.filter(t => t.status === 'open').length > 0 ? 'text-yellow-400' : 'text-text-muted' },
                      { label: 'Alertas activas', value: liveAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length, color: 'text-red-400' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-bg-base/40 rounded-lg px-3 py-2 border border-border-theme/20">
                        <span className="text-[10px] text-text-muted">{s.label}</span>
                        <span className={`text-[13px] font-bold ${s.color}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setActiveTab('users'); setShowUserModal(true); }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-primary-500/30 bg-primary-500/5 hover:bg-primary-500/15 text-accent transition-all text-[11px]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                      <span className="font-medium">{t('admin.newUser')}</span>
                    </button>
                    <button onClick={() => { setActiveTab('alerts'); }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 text-amber-400 transition-all text-[11px]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                      <span className="font-medium">Gestionar Alertas</span>
                    </button>
                    <button onClick={() => { setActiveTab('logs'); loadAuditLogs(); }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/15 text-blue-400 transition-all text-[11px]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      <span className="font-medium">{t('admin.viewAudit')}</span>
                    </button>
                    <button onClick={() => { setActiveTab('settings'); loadSettings(); }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/15 text-yellow-400 transition-all text-[11px]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      <span className="font-medium">{t('admin.settings')}</span>
                    </button>
                  </div>
                </div>

                {/* Tickets Recientes */}
                <div className="lg:col-span-1 bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-semibold text-white tracking-wide">Tickets Recientes</h3>
                    <button onClick={() => setActiveTab('tickets')} className="text-[9px] text-primary-500 hover:text-accent font-medium">
                      Ver todos →
                    </button>
                  </div>
                  {allTickets.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-text-subtle bg-bg-base/20 rounded-lg border border-dashed border-border-theme/25">
                      No hay tickets todavía
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {allTickets.slice(0, 6).map(t => (
                        <button key={t.id} onClick={() => { setActiveTab('tickets'); setSelectedTicket(t); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-base/40 border border-border-theme/20 hover:border-border-theme/40 transition-all text-left">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            t.status === 'open' ? 'bg-blue-400' :
                            t.status === 'in_progress' ? 'bg-yellow-400' :
                            t.status === 'resolved' ? 'bg-emerald-400' : 'bg-gray-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-text-body truncate font-medium">{t.subject}</p>
                            <p className="text-[9px] text-text-subtle truncate">{t.companyName}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 text-[8px] font-semibold rounded-full border ${
                            t.priority === 'urgent' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                            t.priority === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                            t.priority === 'medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                            'text-text-muted bg-gray-500/10 border-gray-500/20'
                          }`}>{t.priority}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actividad Reciente */}
                <div className="lg:col-span-1 bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-semibold text-white tracking-wide">
                      {t('admin.recentActivity')}
                    </h3>
                    <button onClick={() => { loadAuditLogs(); setActiveTab('logs'); }} className="text-[9px] text-primary-500 hover:text-accent font-medium">
                      {t('admin.viewAll')} →
                    </button>
                  </div>
                  {logs.length === 0 ? (
                    <button onClick={loadLogs} disabled={logsLoading}
                      className="w-full text-center py-7 text-[11px] text-text-subtle hover:text-text-muted transition-colors bg-bg-base/20 rounded-lg border border-dashed border-border-theme/25">
                      {logsLoading ? (
                        <svg className="w-4 h-4 animate-spin mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                      ) : t('admin.loadRecentActivity')}
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      {logs.slice(0, 7).map((log, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-bg-base/40 border border-border-theme/20">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            log.action === 'login' ? 'bg-green-400' :
                            log.action === 'delete' ? 'bg-red-400' : 'bg-blue-400'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-text-muted truncate">
                              <span className="text-text-muted">{log.userId?.email || 'System'}</span>
                              <span className="text-text-subtle"> â€” </span>
                              <span>{log.action}</span>
                            </p>
                          </div>
                          <span className="text-[8px] text-text-subtle font-mono">{formatDateTime(log.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* System Health */}
              <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-semibold text-white tracking-wide">
                    {t('admin.systemHealth')}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${systemHealth && systemHealth.every(s => s.status === 'operational') ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                    <span className={`font-medium ${systemHealth && systemHealth.every(s => s.status === 'operational') ? 'text-green-400' : 'text-yellow-400'}`}>
                      {systemHealth ? (systemHealth.every(s => s.status === 'operational') ? t('admin.allSystemsOperational') : 'Degraded') : t('admin.loadingData')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {(systemHealth || [
                    { name: 'REST API', status: 'operational', latency: '-', uptime: '-' },
                    { name: 'WebSocket Server', status: 'operational', latency: '-', uptime: '-' },
                  ]).map((svc, idx) => (
                    <div key={idx} className="bg-bg-base/40 border border-border-theme/15 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-text-body">{svc.name}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${svc.status === 'operational' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-text-subtle font-mono">{svc.latency || '-'}</span>
                        <span className={`text-[8px] ${svc.status === 'operational' ? 'text-green-400/70' : 'text-yellow-400/70'}`}>{svc.uptime || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between flex-shrink-0">
              <h2 className="text-[14px] font-semibold text-text-heading">Gestión de Alertas y Mantenimiento</h2>
              <button onClick={() => { setEditingAlert(null); setAlertForm({ title: '', message: '', type: 'info', enabled: true, showOnLanding: false }); setShowAlertModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-[11px] rounded transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                Nueva Alerta
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Maintenance Section */}
              <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Modo Mantenimiento
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={handleToggleMaintenance}
                      className={`relative w-10 h-5 rounded-full transition-colors ${maintenanceMode ? 'bg-amber-500' : 'bg-bg-elevated'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-5' : ''}`}></span>
                    </button>
                    <span className={`text-[12px] font-medium ${maintenanceMode ? 'text-amber-400' : 'text-text-muted'}`}>
                      {maintenanceMode ? 'Mantenimiento activo — El dashboard está deshabilitado para usuarios no-admin' : 'Sistema operativo'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Mensaje de mantenimiento</label>
                    <input value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)}
                      placeholder="El sistema se encuentra en mantenimiento programado..."
                      className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Programar mantenimiento (fecha y hora)</label>
                      <input type="datetime-local" value={maintenanceScheduledAt} onChange={e => setMaintenanceScheduledAt(e.target.value)}
                        className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleSaveMaintenance}
                      className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-[11px] rounded transition-colors">
                      Guardar configuración
                    </button>
                  </div>
                </div>
              </div>

              {/* Alerts List */}
              <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                <h3 className="text-[13px] font-semibold text-white mb-4">Alertas del Sistema</h3>
                {alerts.length === 0 ? (
                  <p className="text-[12px] text-text-subtle text-center py-8">No hay alertas configuradas. Crea una nueva alerta para empezar.</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map(alert => {
                      const typeColors = {
                        maintenance: 'border-amber-500/30 bg-amber-500/5',
                        announcement: 'border-blue-500/30 bg-blue-500/5',
                        warning: 'border-red-500/30 bg-red-500/5',
                        info: 'border-primary-500/30 bg-primary-500/5',
                      };
                      const typeLabels = {
                        maintenance: 'Mantenimiento',
                        announcement: 'Aviso',
                        warning: 'Advertencia',
                        info: 'Información',
                      };
                      return (
                        <div key={alert._id} className={`flex items-center gap-3 p-3 rounded-lg border ${typeColors[alert.type] || typeColors.info}`}>
                          <button onClick={() => handleToggleAlert(alert._id, !alert.enabled)}
                            className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${alert.enabled ? 'bg-green-500' : 'bg-bg-elevated'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${alert.enabled ? 'translate-x-4' : ''}`}></span>
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-medium text-text-heading">{alert.title}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${typeColors[alert.type] || typeColors.info}`}>
                                {typeLabels[alert.type] || alert.type}
                              </span>
                              {alert.showOnLanding && <span className="text-[9px] text-text-muted">🌐 Landing</span>}
                            </div>
                            {alert.message && <p className="text-[11px] text-text-muted mt-0.5">{alert.message}</p>}
                          </div>
                          <button onClick={() => { setEditingAlert(alert); setAlertForm({ title: alert.title, message: alert.message || '', type: alert.type, enabled: alert.enabled, showOnLanding: alert.showOnLanding }); setShowAlertModal(true); }}
                            className="text-text-muted hover:text-text-heading transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button onClick={() => handleDeleteAlert(alert._id)}
                            className="text-text-muted hover:text-red-400 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              </div>
            </div>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === 'incidents' && (() => {
          const findUser = (email, companyName) => users.find(u => u.email === email || (companyName && u.companyName === companyName));
          const incidents = [
            ...incidentTickets.map(tk => ({
              id: `ticket-${tk.id}`, type: 'ticket',
              severity: tk.priority === 'critical' || tk.priority === 'urgent' ? 'critical' : 'high',
              title: tk.subject || 'Ticket sin asunto',
              detail: `Ticket ${tk.status === 'open' ? 'abierto' : 'en curso'} con prioridad ${tk.priority}`,
              company: tk.companyName || '-', email: tk.email || '',
              date: tk.updated_at || tk.created_at,
              user: findUser(tk.email, tk.companyName), ticket: tk,
            })),
            ...suspendedUsers.map(u => ({
              id: `susp-${u._id}`, type: 'suspension', severity: 'high',
              title: `Cuenta suspendida: ${u.companyName}`,
              detail: u.suspensionReason ? `Motivo: ${u.suspensionReason}` : 'Sin motivo registrado',
              company: u.companyName, email: u.email, date: u.updatedAt || u.createdAt, user: u,
            })),
            ...overduePaymentUsers.map(p => ({
              id: `pay-${p._id}`, type: 'payment', severity: 'high',
              title: `Pago vencido: ${p.companyName}`,
              detail: `Estado de pago: ${p.paymentStatus}`,
              company: p.companyName, email: p.email, date: p.updatedAt, user: findUser(p.email, p.companyName),
            })),
            ...lowComplianceUsers.map(u => ({
              id: `comp-${u._id}`, type: 'compliance', severity: 'medium',
              title: `Cumplimiento crítico: ${u.companyName}`,
              detail: `Score de cumplimiento ${u.complianceScore}% — riesgo legal Ley 21.719`,
              company: u.companyName, email: u.email, date: u.updatedAt || u.createdAt, user: u,
            })),
          ].filter(inc => {
            if (incidentTypeFilter !== 'all' && inc.type !== incidentTypeFilter) return false;
            if (!incidentSearch.trim()) return true;
            const q = incidentSearch.toLowerCase();
            return (inc.company || '').toLowerCase().includes(q) || (inc.email || '').toLowerCase().includes(q) || (inc.title || '').toLowerCase().includes(q);
          }).sort((a, b) => (a.severity === 'critical' ? 0 : a.severity === 'high' ? 1 : 2) - (b.severity === 'critical' ? 0 : b.severity === 'high' ? 1 : 2));

          const TYPE_META = {
            ticket: { label: 'Ticket urgente', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
            suspension: { label: 'Suspensión', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            payment: { label: 'Pago vencido', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            compliance: { label: 'Cumplimiento', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
          };
          const SEV_DOT = { critical: 'bg-red-500 animate-pulse', high: 'bg-orange-400', medium: 'bg-yellow-400' };
          const CONTACT_TEMPLATES = [
            { id: 'incident', label: 'Incidente de seguridad', subject: 'Incidente de seguridad detectado en tu cuenta', body: 'Hola {empresa},\n\nHemos detectado un incidente de seguridad relacionado con tu cuenta. Nuestro equipo ya está trabajando en ello.\n\nAcciones recomendadas:\n- Cambia tu contraseña de acceso\n- Revisa la actividad reciente en tu panel\n- Verifica tus agentes conectados\n\nQuedamos atentos a cualquier duda.\n\nEquipo Invisia' },
            { id: 'payment', label: 'Pago pendiente', subject: 'Recordatorio: pago pendiente en tu cuenta', body: 'Hola {empresa},\n\nDetectamos que tienes pagos pendientes en tu cuenta. Para evitar la suspensión del servicio, por favor regulariza tu situación desde la sección Pagos de tu panel.\n\nSi ya realizaste la transferencia, indícanos el comprobante.\n\nEquipo Invisia' },
            { id: 'suspension', label: 'Aviso de suspensión', subject: 'Tu cuenta ha sido suspendida', body: 'Hola {empresa},\n\nTu cuenta ha sido suspendida temporalmente. Para reactivarla, contáctanos respondiendo este correo o crea un ticket de soporte.\n\nEquipo Invisia' },
            { id: 'compliance', label: 'Riesgo de cumplimiento', subject: 'Alerta: nivel de cumplimiento crítico (Ley 21.719)', body: 'Hola {empresa},\n\nTu nivel de cumplimiento de la Ley 21.719 está en un nivel crítico. Te recomendamos completar el checklist de cumplimiento en tu panel para reducir el riesgo de sanciones.\n\nNuestro equipo puede ayudarte con la implementación.\n\nEquipo Invisia' },
          ];

          const openContact = (inc, templateId) => {
            const tpl = CONTACT_TEMPLATES.find(tp => tp.id === templateId) || CONTACT_TEMPLATES[0];
            setContactModal(inc);
            setContactSubject(tpl.subject);
            setContactBody(tpl.body.replace(/{empresa}/g, inc.company || ''));
            setContactMsg('');
          };
          const defaultTemplateFor = { ticket: 'incident', suspension: 'suspension', payment: 'payment', compliance: 'compliance' };

          return (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between gap-4 flex-shrink-0">
              <div>
                <h2 className="text-[14px] font-semibold text-text-heading">Centro de Incidentes</h2>
                <p className="text-[11px] text-text-muted mt-0.5">Detecta y responde incidentes que afectan a tus usuarios</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input value={incidentSearch} onChange={e => setIncidentSearch(e.target.value)} placeholder="Buscar empresa, email..."
                    className="w-52 bg-bg-base border border-border-theme rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                </div>
                <button onClick={() => { loadPaymentUsers(); loadTickets(); loadUsers(); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-elevated hover:bg-bg-panel text-text-body text-[11px] rounded-lg border border-border-theme transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Actualizar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Tickets urgentes', value: incidentTickets.length, color: '#f87171', filter: 'ticket' },
                  { label: 'Cuentas suspendidas', value: suspendedUsers.length, color: '#fb923c', filter: 'suspension' },
                  { label: 'Pagos vencidos', value: overduePaymentUsers.length, color: '#fbbf24', filter: 'payment' },
                  { label: 'Cumplimiento crítico', value: lowComplianceUsers.length, color: '#facc15', filter: 'compliance' },
                ].map((k, i) => (
                  <button key={i} onClick={() => setIncidentTypeFilter(incidentTypeFilter === k.filter ? 'all' : k.filter)}
                    className={`text-left rounded-xl border p-4 transition-all ${incidentTypeFilter === k.filter ? 'border-primary-500/40 bg-primary-500/5' : 'border-white/[0.04] bg-white/[0.015] hover:border-white/[0.08] hover:bg-white/[0.025]'}`}>
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest mb-2">{k.label}</p>
                    <p className="text-[26px] font-bold leading-none" style={{ color: k.value > 0 ? k.color : '#34d399' }}>{k.value}</p>
                    <p className="text-[10px] text-text-subtle mt-1.5">{incidentTypeFilter === k.filter ? 'Filtrando · click para quitar' : 'Click para filtrar'}</p>
                  </button>
                ))}
              </div>

              {/* Incident feed */}
              {incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-white/[0.04] bg-white/[0.015]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p className="text-[13px] font-semibold text-text-heading">Sin incidentes activos</p>
                  <p className="text-[11px] text-text-muted mt-1">Todos tus usuarios están operando con normalidad.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {incidents.map(inc => {
                    const meta = TYPE_META[inc.type];
                    return (
                      <div key={inc.id} className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-4 py-3 hover:bg-white/[0.025] hover:border-white/[0.08] transition-all">
                        <div className="flex items-start gap-3">
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${SEV_DOT[inc.severity] || 'bg-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                              <p className="text-[13px] font-medium text-text-heading truncate">{inc.title}</p>
                              <span className={`inline-flex self-start items-center px-2 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ${meta.color}`}>{meta.label}</span>
                            </div>
                            <p className="text-[11px] text-text-muted mt-0.5">{inc.detail}</p>
                            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                              <div className="flex items-center gap-2 text-[10px] text-text-subtle">
                                <span className="text-text-muted font-medium">{inc.company}</span>
                                {inc.email && <span>{inc.email}</span>}
                                {inc.date && <span>{new Date(inc.date).toLocaleString('es-CL')}</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {inc.email && (
                                  <button onClick={() => openContact(inc, defaultTemplateFor[inc.type])}
                                    className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
                                    Contactar
                                  </button>
                                )}
                                {inc.type === 'ticket' && (
                                  <button onClick={() => { setActiveTab('tickets'); setSelectedTicket(inc.ticket); }}
                                    className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                                    Responder ticket
                                  </button>
                                )}
                                {inc.type === 'suspension' && inc.user && (
                                  <button onClick={() => handleActivateUser(inc.user)}
                                    className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                                    Reactivar cuenta
                                  </button>
                                )}
                                {inc.type === 'payment' && (
                                  <button onClick={() => setActiveTab('payments')}
                                    className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                                    Gestionar pago
                                  </button>
                                )}
                                {inc.type === 'compliance' && inc.user && (
                                  <button onClick={() => openUserDetail(inc.user)}
                                    className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                                    Ver detalles
                                  </button>
                                )}
                                {inc.user && inc.user.isActive !== false && inc.type !== 'suspension' && (
                                  <button onClick={() => { setSuspendTarget(inc.user); setShowSuspendModal(true); setSuspendReason('otro'); setSuspendCustomReason(inc.title); }}
                                    className="px-2.5 py-1 rounded-md text-[10px] font-medium text-text-muted hover:text-orange-400 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 transition-colors">
                                    Suspender
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Contact modal */}
              {contactModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => !contactSending && setContactModal(null)}>
                  <div className="bg-bg-base border border-border-theme rounded-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                    <div className="px-5 py-4 border-b border-border-theme flex items-center justify-between">
                      <div>
                        <h3 className="text-[13px] font-semibold text-text-heading">Contactar a {contactModal.company}</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">{contactModal.email}</p>
                      </div>
                      <button onClick={() => setContactModal(null)} className="text-text-muted hover:text-text-heading">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Plantilla</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {CONTACT_TEMPLATES.map(tpl => (
                            <button key={tpl.id} onClick={() => { setContactSubject(tpl.subject); setContactBody(tpl.body.replace(/{empresa}/g, contactModal.company || '')); }}
                              className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme transition-colors">
                              {tpl.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Asunto</label>
                        <input value={contactSubject} onChange={e => setContactSubject(e.target.value)}
                          className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Mensaje</label>
                        <textarea value={contactBody} onChange={e => setContactBody(e.target.value)} rows={8}
                          className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 resize-none font-mono" />
                      </div>
                      {contactMsg && (
                        <p className={`text-[11px] ${contactMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{contactMsg}</p>
                      )}
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => setContactModal(null)} disabled={contactSending}
                          className="px-4 py-2 bg-bg-panel hover:bg-bg-elevated text-white text-[12px] rounded-lg transition-colors">
                          Cancelar
                        </button>
                        <button disabled={contactSending || !contactSubject.trim() || !contactBody.trim()} onClick={async () => {
                          setContactSending(true);
                          setContactMsg('');
                          const html = contactBody.split('\n').map(l => `<p style="margin:0 0 8px">${l || '&nbsp;'}</p>`).join('');
                          const res = await api.sendBulkEmail(token, contactSubject, html, [{ name: contactModal.company, email: contactModal.email }]);
                          if (res?.error) setContactMsg('Error: ' + res.error);
                          else { setContactMsg('Correo enviado correctamente'); setTimeout(() => setContactModal(null), 1500); }
                          setContactSending(false);
                        }}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[12px] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                          {contactSending && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          {contactSending ? 'Enviando...' : 'Enviar correo'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* USERS TAB */}
        {activeTab === 'users' && (() => {
          const filteredUsers = users.filter(u =>
            !userSearch || 
            (u.companyName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.domain || '').toLowerCase().includes(userSearch.toLowerCase())
          );
          return (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-semibold text-text-heading">{t('admin.userManagement')}</h2>
                <div className="relative">
                  <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder={t('admin.searchUsers')}
                    className="w-52 bg-bg-base border border-border-theme rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportCSV(filteredUsers, [
                  'companyName', 'email', 'domain',
                  (u) => u.isActive ? t('admin.active') : t('admin.inactive')
                ], 'users.csv')}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-bg-elevated hover:bg-bg-elevated text-text-body text-[11px] rounded transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <span>CSV</span>
                </button>
                <button onClick={() => { setShowUserModal(true); setEditingUser(null); setUserForm({ companyName: '', email: '', domain: '', password: '', planType: 'Free', isActive: true, aiRetention: 'never' }); }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-[12px] rounded transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span>{t('admin.addUser')}</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[640px] md:min-w-0">
                  <thead>
                    <tr className="bg-bg-base/60 border-b border-border-theme/40">
                        <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">{t('admin.company')}</th>
                        <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">Email</th>
                        <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">Domain</th>
                        <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">{t('admin.status')}</th>
                        <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">Cumplimiento</th>
                        <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u._id} className="border-b border-border-theme/30 hover:bg-bg-base/60 transition-colors">
                        <td className="px-4 py-2.5 text-[12px] text-text-heading">{u.companyName}</td>
                        <td className="px-4 py-2.5 text-[12px] text-text-muted">{u.email}</td>
                        <td className="px-4 py-2.5 text-[12px] text-text-muted font-mono">{u.domain}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[11px] ${u.isActive ? 'text-green-400' : 'text-red-400'}`}>{u.isActive ? t('admin.active') : t('admin.inactive')}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[11px] text-text-muted">{u.aiRetention === 'never' ? t('admin.retentionNever') : u.aiRetention === 'weekly' ? t('admin.retentionWeekly') : u.aiRetention === 'monthly' ? t('admin.retentionMonthly') : t('admin.retentionYearly')}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[11px] font-medium ${u.complianceScore >= 70 ? 'text-emerald-400' : u.complianceScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                            {u.complianceScore != null ? u.complianceScore + '%' : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openUserDetail(u)} className="p-1 text-text-muted hover:text-cyan-400" title="Ver detalles">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </button>
                            <button onClick={() => editUser(u)} className="p-1 text-text-muted hover:text-text-heading" title={t('admin.edit')}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            {u.isActive ? (
                              <button onClick={() => { setSuspendTarget(u); setShowSuspendModal(true); setSuspendReason('impago'); setSuspendCustomReason(''); }} className="p-1 text-text-muted hover:text-orange-400" title="Deshabilitar">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                              </button>
                            ) : (
                              <button onClick={() => handleActivateUser(u)} className="p-1 text-text-muted hover:text-green-400" title="Reactivar">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              </button>
                            )}
                            <button onClick={() => { setResetPwModal(u); setResetPwValue(''); setResetPwMsg(''); }} className="p-1 text-text-muted hover:text-yellow-400" title="Resetear contraseña">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                            </button>
                            <button onClick={() => reset2FA(u)} className="p-1 text-text-muted hover:text-purple-400" title="Reset 2FA">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                            </button>
                            <button onClick={() => handleFullDeleteUser(u)} className="p-1 text-text-muted hover:text-red-400" title="Eliminar todo">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="6" className="px-4 py-8 text-center text-[12px] text-text-muted">
                        {userSearch ? t('admin.noResultsFor') + userSearch + '"' : t('admin.noUsers')}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          );
        })()}

        {/* TICKETS TAB */}
        {activeTab === 'tickets' && (() => {
          const filteredTickets = allTickets.filter(t => {
            if (ticketFilter !== 'all' && t.status !== ticketFilter) return false;
            if (ticketPriorityFilter !== 'all' && (t.priority || 'medium') !== ticketPriorityFilter) return false;
            if (!ticketSearch.trim()) return true;
            const q = ticketSearch.toLowerCase();
            return (t.companyName || '').toLowerCase().includes(q)
              || (t.email || '').toLowerCase().includes(q)
              || (t.subject || '').toLowerCase().includes(q);
          });
          const handleSendReply = async () => {
            const msg = replyText.trim();
            if (!msg || !selectedTicket) return;
            setSendingReply(true);
            await api.respondSupportTicket(token, selectedTicket.id, msg, agentName);
            setReplyText('');
            const res = await api.getSupportTickets(token);
            if (!res.error) setAllTickets(Array.isArray(res) ? res : []);
            setSendingReply(false);
          };
          const handleStatusChange = async (ticketId, status) => {
            await api.updateSupportTicketStatus(token, ticketId, status);
            const res = await api.getSupportTickets(token);
            if (!res.error) {
              setAllTickets(Array.isArray(res) ? res : []);
              if (selectedTicket?.id === ticketId) {
                setSelectedTicket(prev => prev ? { ...prev, status } : null);
              }
            }
          };
          const statusColors = {
            open: 'border-l-blue-500 bg-blue-500/5',
            in_progress: 'border-l-yellow-500 bg-yellow-500/5',
            resolved: 'border-l-emerald-500 bg-emerald-500/5',
            closed: 'border-l-gray-500 bg-gray-500/5',
          };
          const priorityColors = {
            low: 'text-text-muted bg-gray-500/10 border-gray-500/20',
            medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
            high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
            urgent: 'text-red-400 bg-red-500/10 border-red-500/20',
          };
          return (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-semibold text-text-heading">Tickets de Soporte</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input value={ticketSearch} onChange={e => setTicketSearch(e.target.value)}
                    className="w-48 bg-bg-elevated border border-border-theme rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-text-subtle focus:outline-none focus:border-cyan-500/50 transition-colors"
                    placeholder="Buscar empresa, email o asunto..." />
                </div>
                <select value={ticketFilter} onChange={e => { setTicketFilter(e.target.value); setSelectedTicket(null); }}
                  className="bg-bg-elevated border border-border-theme text-[11px] text-text-muted rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/50">
                  <option value="all">Todos los estados</option>
                  <option value="open">Abierto</option>
                  <option value="in_progress">En progreso</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
                <select value={ticketPriorityFilter} onChange={e => setTicketPriorityFilter(e.target.value)}
                  className="bg-bg-elevated border border-border-theme text-[11px] text-text-muted rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/50">
                  <option value="all">Todas las prioridades</option>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
              {/* Left: Ticket list */}
              <div className="w-full md:w-[420px] md:min-w-[320px] border-b md:border-b-0 md:border-r border-border-theme flex flex-col">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-theme/50 bg-bg-panel/30">
                  {[
                    { label: 'Total', value: allTickets.length, color: 'text-text-muted' },
                    { label: 'Abiertos', value: allTickets.filter(t => t.status === 'open').length, color: 'text-blue-400' },
                    { label: 'Progreso', value: allTickets.filter(t => t.status === 'in_progress').length, color: 'text-yellow-400' },
                    { label: 'Resueltos', value: allTickets.filter(t => t.status === 'resolved').length, color: 'text-emerald-400' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-elevated/40 border border-border-theme/20">
                      <span className="text-[9px] text-text-muted">{s.label}</span>
                      <span className={`text-[11px] font-semibold ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredTickets.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[12px] text-text-subtle">
                      {ticketSearch || ticketFilter !== 'all' || ticketPriorityFilter !== 'all' ? 'Sin resultados con los filtros actuales' : 'No hay tickets'}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredTickets.map(ticket => (
                        <button key={ticket.id} onClick={() => { if (!agentName.trim()) setAgentNameModal(ticket); else setSelectedTicket(ticket); }}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                            selectedTicket?.id === ticket.id
                              ? 'bg-bg-elevated border-cyan-500/30 shadow-sm shadow-cyan-500/5'
                              : 'bg-bg-panel/40 border-border-theme/20 hover:bg-bg-elevated/60 hover:border-surface-600/40'
                          }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  ticket.status === 'open' ? 'bg-blue-400' :
                                  ticket.status === 'in_progress' ? 'bg-yellow-400' :
                                  ticket.status === 'resolved' ? 'bg-emerald-400' : 'bg-gray-500'
                                }`} />
                                <span className="text-[12px] font-medium text-white truncate">{ticket.subject}</span>
                              </div>
                              <p className="text-[10px] text-text-muted truncate">{ticket.companyName} — {ticket.email}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`px-1.5 py-0.5 text-[8px] font-semibold rounded-full border ${priorityColors[ticket.priority] || priorityColors.medium}`}>
                                  {ticket.priority}
                                </span>
                                <span className="text-[9px] text-text-subtle">{formatDate(ticket.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Conversation panel */}
              <div className="flex-1 flex flex-col bg-bg-base/30">
                {selectedTicket ? (
                  <>
                    <div className="px-6 py-4 border-b border-border-theme bg-bg-panel/50 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="text-[13px] font-semibold text-text-heading">{selectedTicket.subject}</h3>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            {selectedTicket.companyName} — {selectedTicket.email}
                            <span className="mx-2">·</span>
                            {formatDate(selectedTicket.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={selectedTicket.status} onChange={e => handleStatusChange(selectedTicket.id, e.target.value)}
                          className="bg-bg-elevated border border-border-theme text-[11px] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/50">
                          <option value="open">Abierto</option>
                          <option value="in_progress">En progreso</option>
                          <option value="resolved">Resuelto</option>
                          <option value="closed">Cerrado</option>
                        </select>
                        <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${priorityColors[selectedTicket.priority] || priorityColors.medium}`}>
                          {selectedTicket.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      {selectedTicket.description && (
                        <div className="mb-6 bg-bg-panel/60 border border-border-theme/25 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-text-heading">Descripción del ticket</p>
                              <p className="text-[9px] text-text-subtle">{selectedTicket.companyName}</p>
                            </div>
                          </div>
                          <p className="text-[12px] text-text-body leading-relaxed">{selectedTicket.description}</p>
                        </div>
                      )}
                      {(selectedTicket.replies || []).length > 0 && (
                        <div className="space-y-3">
                          {(selectedTicket.replies || []).map((r, idx) => (
                            <div key={idx} className={`flex ${r.role === 'agent' || r.role === 'system' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                                r.role === 'agent'
                                  ? 'bg-cyan-500/10 border border-cyan-500/20'
                                  : r.role === 'system'
                                  ? 'bg-gray-500/10 border border-gray-500/20'
                                  : 'bg-bg-elevated/60 border border-border-theme/25'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[9px] font-medium ${
                                    r.role === 'agent' ? 'text-cyan-400' : r.role === 'system' ? 'text-text-muted' : 'text-blue-400'
                                  }`}>
                                    {r.role === 'agent' ? (r.agentName || 'Admin') : r.role === 'system' ? 'Sistema' : selectedTicket.companyName}
                                  </span>
                                  <span className="text-[8px] text-text-subtle">{r.createdAt ? formatDate(r.createdAt) : ''}</span>
                                </div>
                                <p className="text-[11px] text-gray-200 leading-relaxed">{r.content || r.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="px-6 py-4 border-t border-border-theme bg-bg-panel/50 flex-shrink-0">
                      <div className="flex gap-3">
                        <input value={replyText} onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                          placeholder="Escribe tu respuesta..."
                          className="flex-1 bg-bg-elevated border border-border-theme rounded-xl px-4 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-cyan-500/50 transition-colors" />
                        <button onClick={handleSendReply} disabled={!replyText.trim() || sendingReply}
                          className="px-5 py-2.5 text-[12px] font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                          {sendingReply ? (
                            <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Enviando...</>
                          ) : (
                            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg> Enviar</>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-bg-elevated/50 border border-border-theme/25 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                      </div>
                      <h3 className="text-[14px] font-semibold text-white mb-1">Selecciona un ticket</h3>
                      <p className="text-[11px] text-text-muted">Elige un ticket de la lista para ver la conversación</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}

        {/* Agent Name Modal */}
        {agentNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setAgentNameModal(null)}>
            <div className="bg-bg-panel border border-border-theme rounded-lg w-full max-w-sm shadow-2xl p-5" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-white mb-1">Tu nombre como agente</h3>
              <p className="text-[11px] text-text-muted mb-4">Ingresa el nombre con el que aparecerás en el chat para que el cliente sepa quién le responde.</p>
              <input value={agentName} onChange={e => setAgentName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && agentName.trim()) { localStorage.setItem('adminAgentName', agentName.trim()); setSelectedTicket(agentNameModal); setAgentNameModal(null); } }}
                placeholder="Ej: Carlos Pérez"
                className="w-full bg-bg-base border border-border-theme rounded-lg px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-400/50 mb-4" autoFocus />
              <div className="flex justify-end gap-2">
                <button onClick={() => setAgentNameModal(null)} className="px-4 py-2 text-[11px] text-text-muted hover:text-text-heading transition-colors">Cancelar</button>
                <button onClick={() => { if (agentName.trim()) { localStorage.setItem('adminAgentName', agentName.trim()); setSelectedTicket(agentNameModal); setAgentNameModal(null); } }}
                  className="px-4 py-2 text-[11px] bg-primary-500/10 text-accent border border-accent-border rounded-lg hover:bg-accent-subtle transition-all font-medium">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-[14px] font-semibold text-text-heading">{t('admin.auditLogs')}</h2>
                <div className="relative">
                  <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input value={logSearch} onChange={e => setLogSearch(e.target.value)}
                    placeholder="Buscar por email..."
                    className="w-36 bg-bg-base border border-border-theme rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                </div>
                <input value={logCompanyFilter} onChange={e => setLogCompanyFilter(e.target.value)}
                  placeholder="Filtrar por empresa..."
                  className="w-36 bg-bg-base border border-border-theme rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                <select value={logActionFilter} onChange={e => setLogActionFilter(e.target.value)}
                  className="bg-bg-base border border-border-theme rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-primary-500">
                  <option value="">Todas las acciones</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="submitted_payment">Pagos</option>
                  <option value="updated_payment">Actualizar pago</option>
                  <option value="created_alert">Alertas</option>
                  <option value="toggled_maintenance">Mantenimiento</option>
                  <option value="delete">Eliminar</option>
                  <option value="update">Actualizar</option>
                </select>
                <input type="date" value={logDateFrom} onChange={e => setLogDateFrom(e.target.value)}
                  className="bg-bg-base border border-border-theme rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-primary-500" />
                <input type="date" value={logDateTo} onChange={e => setLogDateTo(e.target.value)}
                  className="bg-bg-base border border-border-theme rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-primary-500" />
                <button onClick={() => loadAuditLogs()}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-accent-subtle hover:bg-primary-500/30 text-accent text-[11px] rounded transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  Buscar
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => loadAuditLogs()} disabled={logsLoading}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-bg-elevated text-white text-[12px] rounded transition-colors disabled:opacity-50">
                  <svg className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  <span>{t('admin.reload')}</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {logs.length > 0 && !logsLoading && (() => {
                const actionCounts = logs.reduce((acc, l) => {
                  const a = l.action || 'unknown';
                  acc[a] = (acc[a] || 0) + 1;
                  return acc;
                }, {});
                const topActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
                return (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {topActions.map(([action, count]) => (
                      <div key={action} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-elevated/30 border border-border-theme/15">
                        <span className="text-[10px] text-text-muted capitalize">{action.replace(/_/g, ' ')}</span>
                        <span className="text-[12px] font-semibold text-text-body">{count}</span>
                      </div>
                    ))}
                    <span className="text-[10px] text-text-subtle ml-2">Total: {logTotal} registros</span>
                  </div>
                );
              })()}
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 text-primary-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[640px] md:min-w-0">
                      <thead>
                        <tr className="bg-bg-base/60 border-b border-border-theme/40">
                          <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">{t('admin.date')}</th>
                          <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">Empresa</th>
                          <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">{t('admin.user')}</th>
                          <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">{t('admin.action')}</th>
                          <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">{t('admin.detail')}</th>
                          <th className="text-[10px] uppercase tracking-wider text-text-muted text-left px-4 py-2">IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, idx) => (
                          <tr key={log._id || idx} className="border-b border-border-theme/30 hover:bg-bg-base/60 transition-colors">
                            <td className="px-4 py-2.5 text-[11px] text-text-muted whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                            <td className="px-4 py-2.5 text-[11px] text-text-heading">{log.userId?.companyName || '-'}</td>
                            <td className="px-4 py-2.5 text-[12px] text-text-heading">{log.userId?.email || t('admin.system')}</td>
                            <td className="px-4 py-2.5">
                              <Tag label={log.action} color={log.action === 'login' ? 'text-green-400 bg-green-900/20' : log.action === 'delete' ? 'text-red-400 bg-red-900/20' : 'text-blue-400 bg-blue-900/20'} />
                            </td>
                            <td className="px-4 py-2.5 text-[11px] text-text-muted max-w-xs truncate">{log.detail || (log.details ? JSON.stringify(log.details).slice(0, 60) : '-')}</td>
                            <td className="px-4 py-2.5 text-[11px] text-text-muted font-mono">{log.ip || log.ipAddress || '-'}</td>
                          </tr>
                        ))}
                        {logs.length === 0 && (
                          <tr><td colSpan="6" className="px-4 py-8 text-center text-[12px] text-text-muted">
                            {logSearch || logCompanyFilter || logActionFilter ? 'Sin resultados para los filtros aplicados' : t('admin.noLogs')}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {logTotal > logLimit && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button onClick={() => loadAuditLogs(Math.max(0, logOffset - logLimit))} disabled={logOffset === 0}
                        className="px-3 py-1.5 text-[11px] bg-bg-elevated hover:bg-bg-elevated text-white rounded disabled:opacity-40 transition-colors">
                        Anterior
                      </button>
                      <span className="text-[11px] text-text-muted">
                        {logOffset + 1}-{Math.min(logOffset + logLimit, logTotal)} de {logTotal}
                      </span>
                      <button onClick={() => loadAuditLogs(logOffset + logLimit)} disabled={logOffset + logLimit >= logTotal}
                        className="px-3 py-1.5 text-[11px] bg-bg-elevated hover:bg-bg-elevated text-white rounded disabled:opacity-40 transition-colors">
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between gap-4 flex-shrink-0">
              <h2 className="text-[14px] font-semibold text-white whitespace-nowrap">Gestión de Pagos</h2>
              <div className="relative flex-1 max-w-xs">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-theme rounded-lg pl-9 pr-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="Buscar por empresa, email o precio..." />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {paymentUsers.filter(u => {
                  if (!paymentSearch.trim()) return true;
                  const q = paymentSearch.toLowerCase();
                  return (u.companyName || '').toLowerCase().includes(q)
                    || (u.email || '').toLowerCase().includes(q)
                    || String(u.customPrice || '').includes(q);
                }).map(u => {
                  const statusColors = {
                    pending_approval: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
                    preapproved: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    suspended: 'text-red-400 bg-red-500/10 border-red-500/20',
                    cancelled: 'text-text-muted bg-gray-500/10 border-gray-500/20',
                  };
                  return (
                    <div key={u._id} className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-[13px] font-semibold text-text-heading">{u.companyName}</h4>
                          <p className="text-[11px] text-text-muted">{u.email}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusColors[u.paymentStatus] || 'text-text-muted bg-gray-500/10 border-gray-500/20'}`}>
                          {u.paymentStatus === 'pending_approval' ? 'Pendiente' :
                           u.paymentStatus === 'preapproved' ? 'Preaprobado' :
                           u.paymentStatus === 'active' ? 'Activo' :
                           u.paymentStatus === 'suspended' ? 'Suspendido' : 'Cancelado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-text-muted mb-3">
                        <span>Precio: <strong className="text-text-heading">${u.customPrice || 0}</strong></span>
                        {u.bankDetails?.bankName && <span>Banco: <strong className="text-text-heading">{u.bankDetails.bankName}</strong></span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          setPaymentModal(u);
                          setPaymentForm({
                            paymentStatus: u.paymentStatus || 'pending_approval',
                            customPrice: u.customPrice || 0,
                            bankName: u.bankDetails?.bankName || '',
                            accountType: u.bankDetails?.accountType || '',
                            accountNumber: u.bankDetails?.accountNumber || '',
                            rut: u.bankDetails?.rut || '',
                            email: u.bankDetails?.email || '',
                          });
                        }}
                          className="px-3 py-1.5 text-[10px] font-medium rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
                          Configurar
                        </button>
                        <button onClick={async () => {
                          const res = await api.getPaymentHistory(token, u._id);
                          if (!res.error) {
                            setPaymentLogUser(u);
                            setPaymentLogModal(true);
                            setPaymentHistory(prev => ({ ...prev, [u._id]: Array.isArray(res) ? res : [] }));
                          }
                        }}
                          className="px-3 py-1.5 text-[10px] font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                          Historial
                        </button>
                        <button onClick={() => {
                          setRecordPaymentModal(u);
                          setRecordForm({ amount: u.customPrice || 0, concept: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'paid' });
                        }}
                          className="px-3 py-1.5 text-[10px] font-medium rounded-lg bg-bg-elevated text-text-body border border-border-theme hover:bg-bg-elevated transition-colors">
                          Registrar Pago
                        </button>
                      </div>
                    </div>
                  );
                })}
                {paymentUsers.length === 0 && !paymentSearch && (
                  <p className="text-center py-8 text-[12px] text-text-subtle">No hay usuarios registrados</p>
                )}
                {paymentUsers.length > 0 && paymentUsers.filter(u => {
                  if (!paymentSearch.trim()) return true;
                  const q = paymentSearch.toLowerCase();
                  return (u.companyName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || String(u.customPrice || '').includes(q);
                }).length === 0 && (
                  <p className="text-center py-8 text-[12px] text-text-muted">Sin resultados para "<strong className="text-text-heading">{paymentSearch}</strong>"</p>
                )}
              </div>
            </div>

            {/* Payment Config Modal */}
            {paymentModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPaymentModal(null)} />
                <div className="relative bg-bg-panel/95 backdrop-blur-2xl border border-border-theme rounded-2xl shadow-2xl w-full max-w-[480px] mx-3 p-4 md:p-6">
                  <h3 className="text-[15px] font-semibold text-white mb-4">Configurar: {paymentModal.companyName}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Estado</label>
                      <select value={paymentForm.paymentStatus} onChange={e => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })}
                        className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500/50">
                        <option value="pending_approval">Pendiente de aprobación</option>
                        <option value="preapproved">Preaprobado</option>
                        <option value="active">Activo</option>
                        <option value="suspended">Suspendido</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Precio Personalizado (UF/mes)</label>
                      <input type="number" value={paymentForm.customPrice} onChange={e => setPaymentForm({ ...paymentForm, customPrice: e.target.value })}
                        className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <div className="border-t border-border-theme pt-4">
                      <p className="text-[11px] text-text-muted font-medium mb-3">Datos Bancarios para el Cliente</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-text-muted">Banco</label>
                          <input value={paymentForm.bankName} onChange={e => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                            className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500/50" placeholder="Banco Estado" />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted">Tipo Cuenta</label>
                          <select value={paymentForm.accountType} onChange={e => setPaymentForm({ ...paymentForm, accountType: e.target.value })}
                            className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500/50">
                            <option value="">Seleccionar</option>
                            <option value="corriente">Cuenta Corriente</option>
                            <option value="vista">Cuenta Vista</option>
                            <option value="ahorro">Cuenta de Ahorro</option>
                            <option value="rut">Cuenta RUT</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted">Número de Cuenta</label>
                          <input value={paymentForm.accountNumber} onChange={e => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })}
                            className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500/50" placeholder="12345678" />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted">RUT</label>
                          <input value={paymentForm.rut} onChange={e => setPaymentForm({ ...paymentForm, rut: e.target.value })}
                            className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500/50" placeholder="12.345.678-9" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-text-muted">Email (opcional)</label>
                          <input value={paymentForm.email} onChange={e => setPaymentForm({ ...paymentForm, email: e.target.value })}
                            className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500/50" placeholder="pagos@miempresa.cl" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setPaymentModal(null)}
                        className="px-4 py-1.5 text-[11px] text-text-muted hover:text-text-body transition-colors">Cancelar</button>
                      <button onClick={async () => {
                        await api.updateUserPayment(token, paymentModal._id, paymentForm.paymentStatus, paymentForm.customPrice, {
                          bankName: paymentForm.bankName,
                          accountType: paymentForm.accountType,
                          accountNumber: paymentForm.accountNumber,
                          rut: paymentForm.rut,
                          email: paymentForm.email,
                        });
                        setPaymentModal(null);
                        loadPaymentUsers();
                      }}
                        className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Record Payment Modal */}
            {recordPaymentModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRecordPaymentModal(null)} />
                <div className="relative bg-bg-panel/95 backdrop-blur-2xl border border-border-theme rounded-2xl shadow-2xl w-full max-w-[440px] mx-3 p-4 md:p-6">
                  <h3 className="text-[15px] font-semibold text-white mb-4">Registrar Pago: {recordPaymentModal.companyName}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Mes</label>
                        <input type="number" min="1" max="12" value={recordForm.month} onChange={e => setRecordForm({ ...recordForm, month: e.target.value })}
                          className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/50" />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Año</label>
                        <input type="number" value={recordForm.year} onChange={e => setRecordForm({ ...recordForm, year: e.target.value })}
                          className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Monto</label>
                      <input type="number" value={recordForm.amount} onChange={e => setRecordForm({ ...recordForm, amount: e.target.value })}
                        className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Concepto</label>
                      <input value={recordForm.concept} onChange={e => setRecordForm({ ...recordForm, concept: e.target.value })}
                        className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/50" placeholder="Pago mensual" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Estado</label>
                      <select value={recordForm.status} onChange={e => setRecordForm({ ...recordForm, status: e.target.value })}
                        className="w-full mt-1 bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/50">
                        <option value="paid">Pagado</option>
                        <option value="pending">Pendiente</option>
                        <option value="overdue">Vencido</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setRecordPaymentModal(null)}
                        className="px-4 py-1.5 text-[11px] text-text-muted hover:text-text-body transition-colors">Cancelar</button>
                      <button onClick={async () => {
                        await api.recordPayment(token, recordPaymentModal._id, recordForm.month, recordForm.year, recordForm.amount, recordForm.concept, recordForm.status);
                        setRecordPaymentModal(null);
                        loadPaymentUsers();
                      }}
                        className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                        Registrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History Modal */}
            {paymentLogModal && paymentLogUser && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPaymentLogModal(null)} />
                <div className="relative bg-bg-panel/95 backdrop-blur-2xl border border-border-theme rounded-2xl shadow-2xl w-full max-w-[600px] mx-3 max-h-[80vh] overflow-y-auto p-4 md:p-6">
                  <h3 className="text-[15px] font-semibold text-white mb-4">Historial de Pagos: {paymentLogUser.companyName}</h3>
                  {(paymentHistory[paymentLogUser._id] || []).length === 0 ? (
                    <p className="text-center py-8 text-[12px] text-text-subtle">Sin pagos registrados</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] md:min-w-0">
                      <thead>
                        <tr className="bg-bg-base/60 border-b border-border-theme/40">
                          <th className="text-[10px] uppercase text-text-muted font-semibold py-2 px-3 text-left">Período</th>
                          <th className="text-[10px] uppercase text-text-muted font-semibold py-2 px-3 text-left">Monto</th>
                          <th className="text-[10px] uppercase text-text-muted font-semibold py-2 px-3 text-left">Concepto</th>
                          <th className="text-[10px] uppercase text-text-muted font-semibold py-2 px-3 text-left">Estado</th>
                          <th className="text-[10px] uppercase text-text-muted font-semibold py-2 px-3 text-left">Fecha</th>
                          <th className="text-[10px] uppercase text-text-muted font-semibold py-2 px-3 text-left">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(paymentHistory[paymentLogUser._id] || []).map(p => (
                          <tr key={p._id} className="border-b border-border-theme/30 hover:bg-bg-base/40">
                            <td className="py-2.5 px-3 text-[12px] text-text-body">{p.month}/{p.year}</td>
                            <td className="py-2.5 px-3 text-[12px] text-text-heading">${p.amount}</td>
                            <td className="py-2.5 px-3 text-[12px] text-text-muted">{p.concept || '-'}</td>
                            <td className="py-2.5 px-3">
                              <span className={`text-[11px] ${p.status === 'paid' ? 'text-emerald-400' : p.status === 'pending' ? 'text-yellow-400' : p.status === 'overdue' ? 'text-red-400' : 'text-text-muted'}`}>
                                {p.status === 'paid' ? 'Pagado' : p.status === 'pending' ? 'Pendiente' : p.status === 'overdue' ? 'Vencido' : 'Cancelado'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[12px] text-text-muted">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('es-CL') : '-'}</td>
                            <td className="py-2.5 px-3">
                              {p.status !== 'paid' ? (
                                <button onClick={async () => {
                                  if (!confirm(`¿Marcar como pagado el período ${p.month}/${p.year} por $${p.amount}?`)) return;
                                  await api.verifyPayment(token, p._id, 'paid', '');
                                  const res = await api.getPaymentHistory(token, paymentLogUser._id);
                                  if (!res.error) setPaymentHistory(prev => ({ ...prev, [paymentLogUser._id]: Array.isArray(res) ? res : [] }));
                                }}
                                  className="px-2.5 py-1 text-[10px] font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                                  Marcar Pagado
                                </button>
                              ) : (
                                <span className="text-[10px] text-text-subtle">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  )}
                  <div className="flex justify-end mt-4">
                    <button onClick={() => setPaymentLogModal(null)}
                      className="px-4 py-1.5 text-[11px] text-text-muted hover:text-text-body transition-colors">Cerrar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-[14px] font-semibold text-text-heading">Reportes de Clientes</h2>
                <select value={reportCompanyFilter} onChange={e => { setReportCompanyFilter(e.target.value); }}
                  className="bg-bg-base border border-border-theme rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-primary-500 min-w-[180px]">
                  <option value="">Todas las empresas</option>
                  {users.filter(u => u.companyName).map(u => (
                    <option key={u._id} value={u._id}>{u.companyName}</option>
                  ))}
                </select>
                <div className="relative">
                  <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input value={reportSearch} onChange={e => setReportSearch(e.target.value)}
                    placeholder="Buscar reporte..."
                    className="w-40 bg-bg-base border border-border-theme rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                </div>
                <button onClick={loadReports}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-accent-subtle hover:bg-primary-500/30 text-accent text-[11px] rounded transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  Buscar
                </button>
              </div>
              <div className="flex items-center gap-2">
                {reportsMsg && <span className={`text-[11px] ${reportsMsg.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{reportsMsg}</span>}
                <span className="text-[11px] text-text-muted">{reports.length} reportes</span>
                <button onClick={loadReports} className="text-[11px] px-2.5 py-1 rounded bg-bg-elevated text-text-body hover:bg-bg-elevated transition-colors">Refrescar</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {reportsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 text-primary-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-[12px]">No hay reportes generados.</div>
              ) : (
                <div className="bg-bg-panel/60 border border-border-theme/40 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-[640px] md:min-w-0">
                    <thead>
                      <tr className="bg-bg-base/60 border-b border-border-theme/40">
                        <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-left">Empresa</th>
                        <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-left">Título</th>
                        <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-left">Fecha</th>
                        <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-right">Tamaño</th>
                        <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(r => (
                        <tr key={r._id} className="border-b border-border-theme/30 hover:bg-bg-base/60 transition-colors">
                          <td className="py-3 px-4">
                            <span className="text-[12px] text-white font-medium">{r.companyName || 'Desconocido'}</span>
                            <p className="text-[10px] text-text-muted">{r.userEmail}</p>
                          </td>
                          <td className="py-3 px-4 text-[12px] text-text-body">{r.title}</td>
                          <td className="py-3 px-4 text-[11px] text-text-muted">{new Date(r.createdAt).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-3 px-4 text-right text-[11px] text-text-muted">{formatReportSize(r.fileSize)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => downloadAdminReport(r._id, r.title)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-primary-500/10 text-accent border border-accent-border hover:bg-accent-subtle transition-all">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                PDF
                              </button>
                              <button onClick={() => deleteReport(r._id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all" title="Eliminar">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between flex-shrink-0">
              <h2 className="text-[14px] font-semibold text-text-heading">
                {t('admin.systemSettings')}
              </h2>
              {settingsMsg && (
                <span className={`text-[11px] ${settingsMsg.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{settingsMsg}</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {settingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 text-primary-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
              ) : (
                <div className="max-w-2xl space-y-6">
                  {/* Contact Info */}
              <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                <h3 className="text-[13px] font-semibold text-white mb-4">
                  {t('admin.planEditor')}
                </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
                          {t('admin.phone')}
                        </label>
                        <input value={settings.contactPhone} onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                          className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
                          {t('admin.contactEmail')}
                        </label>
                        <input value={settings.contactEmail} onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                          className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                      </div>
                    </div>
                  </div>

                  {/* SMTP Config */}
                  <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                    <h3 className="text-[13px] font-semibold text-white mb-4">{t('admin.smtpConfig')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">SMTP Host</label>
                        <input value={settings.smtpHost} onChange={e => setSettings({...settings, smtpHost: e.target.value})}
                          placeholder="smtp.gmail.com"
                          className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">SMTP Port</label>
                        <input value={settings.smtpPort} onChange={e => setSettings({...settings, smtpPort: e.target.value})}
                          placeholder="587"
                          className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('admin.smtpUser')}</label>
                        <input value={settings.smtpUser} onChange={e => setSettings({...settings, smtpUser: e.target.value})}
                          placeholder="user@gmail.com"
                          className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('admin.smtpPassword')}</label>
                        <input type="password" value={settings.smtpPassword} onChange={e => setSettings({...settings, smtpPassword: e.target.value})}
                          className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">From Email</label>
                        <input value={settings.smtpFromEmail} onChange={e => setSettings({...settings, smtpFromEmail: e.target.value})}
                          placeholder="noreply@tudominio.com"
                          className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                        <p className="text-[10px] text-text-subtle mt-1">Email remitente. Si se deja vacío, usa el usuario SMTP.</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                      <input type="email" placeholder="Email de prueba" id="testEmailInput"
                        className="flex-1 bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                      <button onClick={async () => {
                        const email = document.getElementById('testEmailInput').value;
                        if (!email) return;
                        const res = await api.sendTestEmail(token, email);
                        alert(res.error ? 'Error: ' + res.error : res.message || 'Email enviado');
                      }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[11px] rounded transition-colors whitespace-nowrap">
                        Enviar prueba
                      </button>
                    </div>
                  </div>

                  {/* PDF Email Notification */}
                  <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                    <h3 className="text-[13px] font-semibold text-white mb-4">
                      {t('admin.pdfNotification')}
                    </h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <input type="checkbox" id="pdfNotify" checked={settings.enablePdfEmailNotification}
                        onChange={e => setSettings({...settings, enablePdfEmailNotification: e.target.checked})}
                        className="rounded border-border-theme bg-bg-base text-primary-500" />
                      <label htmlFor="pdfNotify" className="text-[12px] text-text-body">
                        {t('admin.sendPdfAutomatically')}
                      </label>
                    </div>
                    {settings.enablePdfEmailNotification && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
                            {t('admin.emailSubject')}
                          </label>
                          <input value={settings.pdfEmailSubject} onChange={e => setSettings({...settings, pdfEmailSubject: e.target.value})}
                            placeholder="Report - {domain}"
                            className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
                            {t('admin.emailBody')}
                          </label>
                          <textarea value={settings.pdfEmailBody} onChange={e => setSettings({...settings, pdfEmailBody: e.target.value})}
                            rows={3}
                            placeholder="Attached is the PDF report for {domain}"
                            className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 resize-none" />
                        </div>
                      </div>
                    )}

                    <h3 className="text-[13px] font-semibold text-white mb-4">Notificaciones de Tickets</h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <input type="checkbox" id="ticketNotify" checked={settings.enableTicketNotification}
                        onChange={e => setSettings({...settings, enableTicketNotification: e.target.checked})}
                        className="rounded border-border-theme bg-bg-base text-primary-500" />
                      <label htmlFor="ticketNotify" className="text-[12px] text-text-body">
                        Notificar por email a admins/soporte cuando se cree un ticket nuevo
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleSaveSettings} disabled={settingsSaving}
                      className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white text-[12px] rounded transition-colors disabled:opacity-50 flex items-center space-x-2">
                      {settingsSaving && (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                      )}
                      <span>{t('admin.saveSettings')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BULK EMAIL TAB */}
        {activeTab === 'bulkemail' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border-theme flex-shrink-0">
              <h2 className="text-[14px] font-semibold text-text-heading">Email Marketing</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl space-y-6">
                  {/* Bulk Email Header */}
                  <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-[14px] font-semibold text-text-heading">Email Marketing Masivo</h3>
                        <p className="text-[11px] text-text-muted mt-1">Envía correos promocionales a tus contactos using SMTP configurado</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {settings.smtpHost ? (
                          <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] rounded-full border border-green-500/20">SMTP Activo</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] rounded-full border border-red-500/20">SMTP Inactivo</span>
                        )}
                      </div>
                    </div>
                    {!settings.smtpHost && (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-[12px] text-red-400">
                        Configura el SMTP en la sección de ajustes antes de enviar emails masivos.
                      </div>
                    )}
                  </div>

                  {/* Compose */}
                  <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                    <h3 className="text-[13px] font-semibold text-white mb-4">Componer Correo</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Asunto</label>
                        <input value={bulkSubject} onChange={e => setBulkSubject(e.target.value)}
                          placeholder="Ej: Consultoría gratuita en protección de datos"
                          className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                        <p className="text-[10px] text-text-subtle mt-1">Usa {'{{email}}'} o {'{{nombre}}'} para personalizar</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[10px] text-text-muted uppercase tracking-wider">Contenido HTML</label>
                          <button onClick={() => setBulkPreview(!bulkPreview)}
                            className="text-[10px] text-accent hover:text-primary-300">
                            {bulkPreview ? 'Editar' : 'Vista previa'}
                          </button>
                        </div>
                        {bulkPreview ? (
                          <div className="w-full bg-white rounded border border-border-theme p-4 min-h-[200px] text-[12px] text-gray-800"
                            dangerouslySetInnerHTML={{ __html: bulkHtml }} />
                        ) : (
                          <textarea value={bulkHtml} onChange={e => setBulkHtml(e.target.value)}
                            rows={10}
                            placeholder={"<div>\n  <h2>Titulo del correo</h2>\n  <p>Contenido promocional...</p>\n</div>"}
                            className="w-full bg-bg-base border border-border-theme rounded px-3 py-2 text-[12px] text-green-400 font-mono placeholder-text-subtle focus:outline-none focus:border-primary-500 resize-none" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                    <h3 className="text-[13px] font-semibold text-white mb-4">Lista de Contactos</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <label className="flex-1">
                          <div className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border-theme rounded-lg cursor-pointer hover:border-primary-500/50 transition-colors">
                            <div className="text-center">
                              <svg className="w-8 h-8 mx-auto text-text-subtle mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                              </svg>
                              <p className="text-[12px] text-text-muted">{bulkFileName || 'Subir archivo TXT o CSV'}</p>
                              <p className="text-[10px] text-text-subtle mt-1">Un email por línea o separado por coma/punto y coma</p>
                            </div>
                          </div>
                          <input type="file" accept=".txt,.csv" className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setBulkFileName(file.name);
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const text = ev.target.result;
                                const lines = text.split(/\r?\n/).filter(l => l.trim());
                                const contacts = lines.map(line => {
                                  const parts = line.split(/[,;]/).map(s => s.trim().replace(/^["']|["']$/g, ''));
                                  if (parts.length >= 2 && parts[1].includes('@')) {
                                    return { name: parts[0], email: parts[1] };
                                  }
                                  return { email: parts[0].replace(/^["']|["']$/g, '') };
                                }).filter(c => c.email && c.email.includes('@'));
                                setBulkContacts(contacts);
                              };
                              reader.readAsText(file);
                            }} />
                        </label>
                      </div>
                      {bulkContacts.length > 0 && (
                        <div className="bg-bg-base border border-border-theme rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[12px] text-white font-medium">{bulkContacts.length} contactos cargados</span>
                            <button onClick={() => { setBulkContacts([]); setBulkFileName(''); }}
                              className="text-[10px] text-red-400 hover:text-red-300">Limpiar</button>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {bulkContacts.slice(0, 20).map((c, i) => (
                              <div key={i} className="flex items-center text-[11px] text-text-muted">
                                <span className="w-5 text-text-subtle">{i+1}.</span>
                                <span className="text-text-muted">{c.name || '-'}</span>
                                <span className="mx-2 text-text-subtle">·</span>
                                <span className="text-text-heading">{c.email}</span>
                              </div>
                            ))}
                            {bulkContacts.length > 20 && (
                              <p className="text-[10px] text-text-subtle">... y {bulkContacts.length - 20} más</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Send Button */}
                  <div className="flex justify-end">
                    <button onClick={async () => {
                      if (!bulkSubject || !bulkHtml || !bulkContacts.length) {
                        alert('Completa el asunto, contenido y lista de contactos');
                        return;
                      }
                      if (!settings.smtpHost) {
                        alert('Configura el SMTP primero');
                        return;
                      }
                      if (!confirm(`Enviar correo a ${bulkContacts.length} contactos?`)) return;
                      setBulkSending(true);
                      setBulkResults(null);
                      const res = await api.sendBulkEmail(token, bulkSubject, bulkHtml, bulkContacts);
                      if (res.success && res.jobId) {
                        setBulkResults({ total: res.total, sent: 0, failed: 0, complete: false, details: [] });
                        const poll = async () => {
                          try {
                            const st = await api.getBulkStatus(token, res.jobId);
                            setBulkResults({ total: st.total, sent: st.sent, failed: st.failed, complete: st.complete, details: st.results || [] });
                            if (!st.complete) setTimeout(poll, 1500);
                            else setBulkSending(false);
                          } catch { setTimeout(poll, 3000); }
                        };
                        poll();
                      } else {
                        alert('Error: ' + (res.error || 'Unknown'));
                        setBulkSending(false);
                      }
                    }} disabled={bulkSending || !bulkSubject || !bulkHtml || !bulkContacts.length || !settings.smtpHost}
                      className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-[12px] rounded transition-colors disabled:opacity-40 flex items-center space-x-2 font-medium">
                      {bulkSending ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                          <span>Enviar a {bulkContacts.length || 0} contactos</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Results */}
                  {bulkResults && (
                    <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-border-theme/40 rounded-xl backdrop-blur-sm p-5">
                      <h3 className="text-[13px] font-semibold text-white mb-4">Resultado de la Campaña</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="bg-bg-base border border-border-theme rounded-lg p-4 text-center">
                          <div className="text-[24px] font-bold text-text-heading">{bulkResults.total}</div>
                          <div className="text-[10px] text-text-muted uppercase mt-1">Total</div>
                        </div>
                        <div className="bg-bg-base border border-green-500/20 rounded-lg p-4 text-center">
                          <div className="text-[24px] font-bold text-green-400">{bulkResults.sent}</div>
                          <div className="text-[10px] text-text-muted uppercase mt-1">Enviados</div>
                        </div>
                        <div className="bg-bg-base border border-red-500/20 rounded-lg p-4 text-center">
                          <div className="text-[24px] font-bold text-red-400">{bulkResults.failed}</div>
                          <div className="text-[10px] text-text-muted uppercase mt-1">Fallidos</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-bg-base rounded-full h-3 mb-4">
                        <div className="flex h-full rounded-full overflow-hidden">
                          <div className="bg-green-500 transition-all duration-500" style={{ width: `${bulkResults.total ? (bulkResults.sent / bulkResults.total * 100) : 0}%` }}></div>
                          <div className="bg-red-500 transition-all duration-500" style={{ width: `${bulkResults.total ? (bulkResults.failed / bulkResults.total * 100) : 0}%` }}></div>
                        </div>
                      </div>

                      {/* Chart */}
                      <div className="flex items-end justify-center space-x-8 mb-6 h-24">
                        <div className="flex flex-col items-center">
                          <div className="w-16 bg-green-500/20 rounded-t-lg relative" style={{ height: `${bulkResults.total ? Math.max(20, bulkResults.sent / bulkResults.total * 80) : 20}px` }}>
                            <div className="absolute inset-0 bg-green-500 rounded-t-lg" style={{ height: `${bulkResults.total ? (bulkResults.sent / bulkResults.total * 100) : 0}%`, bottom: 0, top: 'auto' }}></div>
                          </div>
                          <span className="text-[10px] text-green-400 mt-2 font-medium">Enviados</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-16 bg-red-500/20 rounded-t-lg relative" style={{ height: `${bulkResults.total ? Math.max(20, bulkResults.failed / bulkResults.total * 80) : 20}px` }}>
                            <div className="absolute inset-0 bg-red-500 rounded-t-lg" style={{ height: `${bulkResults.total ? (bulkResults.failed / bulkResults.total * 100) : 0}%`, bottom: 0, top: 'auto' }}></div>
                          </div>
                          <span className="text-[10px] text-red-400 mt-2 font-medium">Fallidos</span>
                        </div>
                      </div>

                      {/* Detail Table */}
                      {bulkResults.details?.length > 0 && (
                        <div className="max-h-48 overflow-y-auto overflow-x-auto">
                          <table className="w-full min-w-[640px] md:min-w-0">
                            <thead className="sticky top-0 bg-bg-panel">
                              <tr>
                                <th className="text-left text-[10px] text-text-muted uppercase tracking-wider py-2 px-3">#</th>
                                <th className="text-left text-[10px] text-text-muted uppercase tracking-wider py-2 px-3">Email</th>
                                <th className="text-left text-[10px] text-text-muted uppercase tracking-wider py-2 px-3">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkResults.details.map((r, i) => (
                                <tr key={i} className="border-t border-border-theme/50">
                                  <td className="py-1.5 px-3 text-[11px] text-text-subtle">{i+1}</td>
                                  <td className="py-1.5 px-3 text-[11px] text-text-heading">{r.email}</td>
                                  <td className="py-1.5 px-3">
                                    {r.status === 'sent' && <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Enviado</span>}
                                    {r.status === 'error' && <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Error</span>}
                                    {r.status === 'queued' && <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">En cola</span>}
                                    {r.status === 'sending' && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Enviando...</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
        )}



      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-base border border-border-theme rounded-lg w-full max-w-md">
            <div className="px-5 py-4 border-b border-border-theme flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-text-heading">{editingAlert ? 'Editar Alerta' : 'Nueva Alerta'}</h3>
              <button onClick={() => { setShowAlertModal(false); setEditingAlert(null); }} className="text-text-muted hover:text-text-heading">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveAlert} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Título</label>
                <input required value={alertForm.title} onChange={e => setAlertForm({...alertForm, title: e.target.value})}
                  placeholder="Ej: Mantenimiento programado"
                  className="w-full bg-bg-base border border-border-theme rounded px-3 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Mensaje</label>
                <textarea value={alertForm.message} onChange={e => setAlertForm({...alertForm, message: e.target.value})}
                  rows={3}
                  placeholder="Descripción detallada de la alerta..."
                  className="w-full bg-bg-base border border-border-theme rounded px-3 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Tipo</label>
                  <select value={alertForm.type} onChange={e => setAlertForm({...alertForm, type: e.target.value})}
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded px-3 py-2.5 focus:outline-none focus:border-primary-500">
                    <option value="info">Información</option>
                    <option value="announcement">Aviso</option>
                    <option value="warning">Advertencia</option>
                    <option value="maintenance">Mantenimiento</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={alertForm.enabled} onChange={e => setAlertForm({...alertForm, enabled: e.target.checked})}
                    className="rounded border-border-theme bg-bg-base text-primary-500" />
                  <span className="text-[12px] text-text-body">Activada</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={alertForm.showOnLanding} onChange={e => setAlertForm({...alertForm, showOnLanding: e.target.checked})}
                    className="rounded border-border-theme bg-bg-base text-primary-500" />
                  <span className="text-[12px] text-text-body">Mostrar en Landing</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => { setShowAlertModal(false); setEditingAlert(null); }}
                  className="px-4 py-2 bg-bg-panel hover:bg-bg-elevated text-white text-[12px] rounded transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-[12px] rounded transition-colors">
                  {editingAlert ? 'Guardar' : 'Crear Alerta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Reset Password Modal */}
      {resetPwModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-base border border-border-theme rounded-lg w-full max-w-sm">
            <div className="px-5 py-4 border-b border-border-theme flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-text-heading">Resetear Contraseña: {resetPwModal.companyName}</h3>
              <button onClick={() => setResetPwModal(null)} className="text-text-muted hover:text-text-heading">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Nueva contraseña</label>
                <input value={resetPwValue} onChange={e => setResetPwValue(e.target.value)} type="password"
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-bg-base border border-border-theme rounded px-3 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
              </div>
              {resetPwMsg && (
                <p className={`text-[11px] ${resetPwMsg.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{resetPwMsg}</p>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setResetPwModal(null)} className="px-4 py-2 bg-bg-panel hover:bg-bg-elevated text-white text-[12px] rounded transition-colors">Cancelar</button>
                <button onClick={handleResetPassword} disabled={!resetPwValue || resetPwValue.length < 4}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-[12px] rounded transition-colors disabled:opacity-50">
                  Actualizar Contraseña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {userDetailModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-base border border-border-theme rounded-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-border-theme flex items-center justify-between sticky top-0 bg-bg-base z-10">
              <h3 className="text-[13px] font-semibold text-text-heading">
                Detalles: {userDetailModal.companyName}
                <span className="text-text-muted font-normal ml-2">({userDetailModal.email})</span>
              </h3>
              <button onClick={() => { setUserDetailModal(null); setUserDetailData(null); }} className="text-text-muted hover:text-text-heading">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-5">
              {userDetailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 text-primary-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
              ) : userDetailData ? (
                <div className="space-y-5">
                  {/* Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Plan</p>
                      <p className="text-[13px] text-white font-semibold mt-1">{userDetailData.user?.planType || '-'}</p>
                    </div>
                    <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Estado</p>
                      <p className={`text-[13px] font-semibold mt-1 ${userDetailData.user?.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {userDetailData.user?.isActive ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                    <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Pago</p>
                      <p className="text-[13px] text-white font-semibold mt-1">{userDetailData.user?.paymentStatus || '-'}</p>
                    </div>
                    <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Rol</p>
                      <p className="text-[13px] text-white font-semibold mt-1">{userDetailData.user?.role || 'user'}</p>
                    </div>
                    <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Bases de Datos</p>
                      <p className="text-[13px] text-accent font-semibold mt-1">{userDetailData.databases?.length || 0}</p>
                    </div>
                    <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-3">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Escaneos</p>
                      <p className="text-[13px] text-accent font-semibold mt-1">{userDetailData.scans?.length || 0}</p>
                    </div>
                  </div>

                  {/* Compliance Ley 21.719 */}
                  {userDetailData.compliance && (
                    <div>
                      <h4 className="text-[12px] font-semibold text-white mb-2 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                        Cumplimiento Ley 21.719
                      </h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                        <div className="bg-bg-panel/40 border border-border-theme/20 rounded-lg p-3 text-center">
                          <p className="text-[18px] font-bold text-text-heading">{userDetailData.compliance.avgComplianceScore}%</p>
                          <p className="text-[9px] text-text-muted">Cumplimiento</p>
                        </div>
                        <div className="bg-bg-panel/40 border border-border-theme/20 rounded-lg p-3 text-center">
                          <p className="text-[18px] font-bold text-emerald-400">{userDetailData.compliance.compliantDbs}/{userDetailData.compliance.totalDbs}</p>
                          <p className="text-[9px] text-text-muted">BDs OK</p>
                        </div>
                        <div className="bg-bg-panel/40 border border-border-theme/20 rounded-lg p-3 text-center">
                          <p className="text-[18px] font-bold text-amber-400">{userDetailData.compliance.vulnerableUsersCount}</p>
                          <p className="text-[9px] text-text-muted">Usuarios Vulnerables</p>
                        </div>
                        <div className="bg-bg-panel/40 border border-border-theme/20 rounded-lg p-3 text-center">
                          <p className="text-[18px] font-bold text-blue-400">{userDetailData.compliance.dpdRequestsPending}</p>
                          <p className="text-[9px] text-text-muted">DPD Pendientes</p>
                        </div>
                      </div>
                      {userDetailData.compliance.dbCompliance?.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          <p className="text-[10px] text-text-muted uppercase tracking-wider">Bases de Datos</p>
                          {userDetailData.compliance.dbCompliance.map(db => (
                            <div key={db.dbId} className="flex items-center gap-2 bg-bg-panel/30 border border-border-theme/15 rounded-lg px-3 py-2">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${db.compliant ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                              <span className="text-[11px] text-white font-medium flex-1">{db.dbName}</span>
                              <span className="text-[9px] text-text-muted">{db.complianceScore}%</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-3 rounded-sm ${db.ssl ? 'bg-emerald-400' : 'bg-bg-elevated'}`} title="SSL/TLS"></span>
                                <span className={`w-1.5 h-3 rounded-sm ${db.encryption ? 'bg-emerald-400' : 'bg-bg-elevated'}`} title="Encryption"></span>
                                <span className={`w-1.5 h-3 rounded-sm ${db.accessControl ? 'bg-emerald-400' : 'bg-bg-elevated'}`} title="Access Control"></span>
                                <span className={`w-1.5 h-3 rounded-sm ${db.auditLogging ? 'bg-emerald-400' : 'bg-bg-elevated'}`} title="Audit Logging"></span>
                                <span className={`w-1.5 h-3 rounded-sm ${db.backupEncryption ? 'bg-emerald-400' : 'bg-bg-elevated'}`} title="Backup Encryption"></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Databases */}
                  {userDetailData.databases?.length > 0 && (
                    <div>
                      <h4 className="text-[12px] font-semibold text-white mb-2 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/></svg>
                        Bases de Datos Conectadas
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {userDetailData.databases.map(db => (
                          <div key={db._id} className="bg-bg-panel/40 border border-border-theme/20 rounded-lg p-3 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] text-white font-medium">{db.name}</p>
                              <p className="text-[9px] text-text-muted">{db.engine} · {db.host}:{db.port}/{db.database}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${db.status === 'connected' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-text-muted'}`}>
                              {db.status || 'unknown'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alerts */}
                  {userDetailData.alerts?.length > 0 && (
                    <div>
                      <h4 className="text-[12px] font-semibold text-white mb-2 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                        Alertas Recientes
                      </h4>
                      <div className="space-y-1">
                        {userDetailData.alerts.slice(0, 10).map(a => (
                          <div key={a._id} className="flex items-center gap-2 bg-bg-panel/40 border border-border-theme/20 rounded-lg px-3 py-2">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.severity === 'critical' ? 'bg-red-400' : a.severity === 'high' ? 'bg-orange-400' : a.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'}`}></span>
                            <p className="text-[11px] text-text-body flex-1 truncate">{a.title}</p>
                            <span className="text-[9px] text-text-subtle">{new Date(a.createdAt).toLocaleDateString('es')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scans */}
                  {userDetailData.scans?.length > 0 && (
                    <div>
                      <h4 className="text-[12px] font-semibold text-white mb-2 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                        Escaneos Recientes
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {userDetailData.scans.slice(0, 10).map(s => (
                          <div key={s._id} className="bg-bg-panel/40 border border-border-theme/20 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] text-white font-medium">{s.domain}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                s.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                s.status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                                s.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-text-muted'
                              }`}>{s.status}</span>
                            </div>
                            <p className="text-[9px] text-text-subtle mt-1">{s.scanType} · {new Date(s.startedAt).toLocaleDateString('es')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!userDetailData.databases?.length && !userDetailData.alerts?.length && !userDetailData.scans?.length) && (
                    <p className="text-center py-8 text-[12px] text-text-subtle">Sin datos adicionales para esta empresa</p>
                  )}
                </div>
              ) : (
                <p className="text-center py-8 text-[12px] text-text-subtle">Error al cargar detalles</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-base border border-border-theme rounded-lg w-full max-w-md">
            <div className="px-5 py-4 border-b border-border-theme flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-text-heading">{editingUser ? t('admin.editUser') : t('admin.addUser')}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-text-muted hover:text-text-heading">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('admin.company')}</label>
                  <input required value={userForm.companyName} onChange={e => setUserForm({...userForm, companyName: e.target.value})}
                    readOnly={!!editingUser}
                    className="w-full bg-bg-base border border-border-theme rounded px-3 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 read-only:opacity-60 read-only:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Email</label>
                  <input required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} type="email"
                    readOnly={!!editingUser}
                    className="w-full bg-bg-base border border-border-theme rounded px-3 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 read-only:opacity-60 read-only:cursor-not-allowed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Domain</label>
                  <input required value={userForm.domain} onChange={e => setUserForm({...userForm, domain: e.target.value})}
                    readOnly={!!editingUser}
                    className="w-full bg-bg-base border border-border-theme rounded px-3 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 read-only:opacity-60 read-only:cursor-not-allowed" />
                </div>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Password</label>
                  <input value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} type="password"
                    className="w-full bg-bg-base border border-border-theme rounded px-3 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500" />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isActive" checked={userForm.isActive} onChange={e => setUserForm({...userForm, isActive: e.target.checked})}
                  className="rounded border-border-theme bg-bg-base text-primary-500" />
                <label htmlFor="isActive" className="text-[12px] text-text-body">{t('admin.active')}</label>
              </div>
              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Rol</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}
                  className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded px-3 py-2.5 focus:outline-none focus:border-primary-500">
                  <option value="user">Usuario</option>
                  <option value="support">Soporte</option>
                  <option value="finance">Finanzas</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('admin.aiDataRetention')}</label>
                <select value={userForm.aiRetention} onChange={e => setUserForm({...userForm, aiRetention: e.target.value})}
                  className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded px-3 py-2.5 focus:outline-none focus:border-primary-500">
                  <option value="never">{t('admin.retentionNeverPurge')}</option>
                  <option value="weekly">{t('admin.retentionWeekly')}</option>
                  <option value="monthly">{t('admin.retentionMonthly')}</option>
                  <option value="yearly">{t('admin.retentionYearly')}</option>
                </select>
                <p className="text-[10px] text-text-subtle mt-1">{t('admin.autoPurgeDesc')}</p>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-bg-panel hover:bg-bg-elevated text-white text-[12px] rounded transition-colors">
                  {t('admin.cancel')}
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-[12px] rounded transition-colors">
                  {editingUser ? t('admin.save') : t('admin.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuspendModal && suspendTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-base border border-border-theme rounded-lg w-full max-w-md">
            <div className="px-5 py-4 border-b border-border-theme flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-text-heading">Deshabilitar usuario</h3>
              <button onClick={() => setShowSuspendModal(false)} className="text-text-muted hover:text-text-heading">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[12px] text-text-body">
                Vas a deshabilitar a <strong className="text-text-heading">{suspendTarget.companyName}</strong> ({suspendTarget.email}).
                El usuario no podr\u00E1 iniciar sesi\u00F3n hasta que sea reactivado.
              </p>
              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Motivo de suspensi\u00F3n</label>
                <select value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                  className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded px-3 py-2.5 focus:outline-none focus:border-primary-500">
                  <option value="impago">Impago</option>
                  <option value="violacion_terminos">Violaci\u00F3n de t\u00E9rminos</option>
                  <option value="solicitud_cliente">Solicitud del cliente</option>
                  <option value="inactividad">Inactividad prolongada</option>
                  <option value="migracion">Migraci\u00F3n de plataforma</option>
                  <option value="otro">Otro (especificar)</option>
                </select>
              </div>
              {suspendReason === 'otro' && (
                <div>
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Especificar motivo</label>
                  <textarea value={suspendCustomReason} onChange={e => setSuspendCustomReason(e.target.value)}
                    placeholder="Describa el motivo..."
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded px-3 py-2.5 focus:outline-none focus:border-primary-500 min-h-[80px] resize-none" />
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-2">
                <button onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 bg-bg-panel hover:bg-bg-elevated text-white text-[12px] rounded transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSuspendUser}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[12px] rounded transition-colors">
                  Deshabilitar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      </>
    </div>
  );
}
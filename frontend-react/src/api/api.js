import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});

api.interceptors.response.use(
  response => {
    const data = response.data;
    if (data && typeof data === 'object' && (data.error === 'token inválido' || data.error === 'token requerido')) {
      if (!window.__sessionExpiredFired) {
        window.__sessionExpiredFired = true;
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }
    return data;
  },
  error => {
    if (error.response?.status === 401) {
      if (!window.__sessionExpiredFired) {
        window.__sessionExpiredFired = true;
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }
    return { error: error.message };
  }
);

function toFormData(params) {
  const form = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) form.append(key, String(val));
  });
  return form;
}

// Auth
export function login(email, password, captchaToken) {
  return api.post('/login', toFormData({ email, password, captchaToken }));
}
export function register(companyName, domain, email, password, captchaToken) {
  return api.post('/register', toFormData({ companyName, domain, email, password, captchaToken }));
}
export function changePassword(token, newPassword) {
  return api.post('/changePassword', toFormData({ token, newPassword }));
}

// CAPTCHA
export function verifyCaptcha(captchaToken) {
  return api.post('/captcha/verify', toFormData({ captchaToken }));
}

// Passkey / WebAuthn
export function passkeyBeginLogin(email) {
  return api.post('/passkey/beginLogin', toFormData({ email }));
}
export function passkeyFinishLogin(email) {
  return api.post('/passkey/finishLogin', toFormData({ email }));
}
export function passkeyBeginRegistration(email) {
  return api.post('/passkey/beginRegistration', toFormData({ email }));
}
export function passkeyFinishRegistration(email) {
  return api.post('/passkey/finishRegistration', toFormData({ email }));
}

// OTP / SMTP
export function sendOTP(email, purpose) {
  return api.post('/smtp/sendOTP', toFormData({ email, purpose }));
}
export function verifyOTP(email, code, purpose) {
  return api.post('/smtp/verifyOTP', toFormData({ email, code, purpose }));
}
export function configureSMTP(host, port, username, password, from) {
  return api.post('/smtp/configure', toFormData({ host, port, username, password, from }));
}

// User info & admin
export function getUserInfo(token) {
  return api.post('/info', toFormData({ token }));
}
export function listUsers(token) {
  return api.post('/list', toFormData({ token }));
}
export function updateUser(token, userId, planType, isActive, aiRetention, role, suspensionReason) {
  return api.post('/update', toFormData({ token, userId, planType, isActive, aiRetention, role, suspensionReason }));
}
export function suspendUser(token, userId, suspensionReason) {
  return api.post('/update', toFormData({ token, userId, isActive: false, suspensionReason }));
}
export function activateUser(token, userId) {
  return api.post('/update', toFormData({ token, userId, isActive: true, suspensionReason: '' }));
}
export function purgeUserAiData(token, userId) {
  return api.post('/purge-ai', toFormData({ token, userId }));
}
export function deleteUser(token, userId) {
  return api.delete(`/auth/users/${userId}`, { params: { token } });
}
export function adminCreateUser(token, companyName, email, domain, password, planType, role, isActive) {
  return api.post('/admin/create-user', toFormData({ token, companyName, email, domain, password, planType, role, isActive }));
}
export function getPlans(token) {
  return api.post('/plans', toFormData({ token }));
}
export function savePlans(token, plans) {
  return api.post('/plans/save', toFormData({ token, plans: JSON.stringify(plans) }));
}
export function loadAdminSettings(token) {
  return api.post('/smtp/adminSettings', toFormData({ token }));
}
export function saveAdminSettings(token, settings) {
  return api.post('/smtp/saveAdminSettings', toFormData({ token, ...settings }));
}
export function sendTestEmail(token, email) {
  return api.post('/smtp/testEmail', toFormData({ token, email }));
}
export function sendBulkEmail(token, subject, html, contacts) {
  return api.post('/smtp/bulkSend', toFormData({ token, subject, html, contacts: JSON.stringify(contacts) }));
}
export function getBulkStatus(token, jobId) {
  return api.get(`/smtp/bulkStatus/${jobId}?token=${token}`);
}

// Support tickets
export function getSupportTickets(token) {
  return api.post('/tickets/all', toFormData({ token }));
}
export function respondSupportTicket(token, ticketId, message, agentName) {
  return api.post('/tickets/respond', toFormData({ token, ticketId, message, agentName }));
}
export function updateSupportTicketStatus(token, ticketId, status) {
  return api.post('/tickets/status', toFormData({ token, ticketId, status }));
}
export function createTicket(token, subject, description, priority) {
  return api.post('/tickets/create', toFormData({ token, subject, description, priority }));
}
export function closeTicket(token, ticketId) {
  return api.post('/tickets/close', toFormData({ token, ticketId }));
}

// Ticket system (assistant-based)
export function getTickets(token, status) {
  const params = { token };
  if (status) params.status = status;
  return api.get('/tickets', { params });
}
export function createSupportTicket(token, subject, description, priority) {
  return api.post('/tickets', toFormData({ token, subject, description, priority }));
}
export function getTicketDetail(token, ticketId) {
  return api.get(`/tickets/${ticketId}`, { params: { token } });
}
export function replyTicket(token, ticketId, content, role = 'user') {
  return api.post(`/tickets/${ticketId}/reply`, toFormData({ token, content, role }));
}
export function updateTicketStatus(token, ticketId, status) {
  return api.put(`/tickets/${ticketId}/status`, toFormData({ token, status }));
}

// Admin: reset user 2FA
export function resetUser2FA(token, userId) {
  return api.post('/admin/reset-2fa', toFormData({ token, userId }));
}

// Admin - Audit Logs
export function getAuditLogs(token, limit = 200) {
  return api.post('/logs', toFormData({ token, limit }));
}

// ---- Compliance Ley 21.719 ----
export function getComplianceOverview(token) {
  return api.get('/invisia/compliance/overview', { params: { token } });
}
export function getComplianceStats(token) {
  return api.get('/invisia/compliance/stats', { params: { token } });
}
export function getComplianceConfig(token) {
  return api.get('/invisia/compliance/config', { params: { token } });
}
export function saveComplianceConfig(token, data) {
  return api.post('/invisia/compliance/config', toFormData({ token, ...data }));
}
export function getComplianceConsents(token, search, active) {
  const params = { token };
  if (search) params.search = search;
  if (active !== undefined) params.active = active;
  return api.get('/invisia/compliance/consents', { params });
}
export function createComplianceConsent(token, data) {
  return api.post('/invisia/compliance/consents', toFormData({ token, ...data }));
}
export function revokeComplianceConsent(token, id) {
  return api.post(`/invisia/compliance/consents/${id}/revoke`, toFormData({ token }));
}
export function updateComplianceConsent(token, id, data) {
  return api.put(`/invisia/compliance/consents/${id}`, toFormData({ token, ...data }));
}
export function getComplianceInventory(token) {
  return api.get('/invisia/compliance/inventory', { params: { token } });
}
export function createComplianceInventory(token, data) {
  return api.post('/invisia/compliance/inventory', toFormData({ token, ...data }));
}
export function updateComplianceInventory(token, id, data) {
  return api.put(`/invisia/compliance/inventory/${id}`, toFormData({ token, ...data }));
}
export function deleteComplianceInventory(token, id) {
  return api.delete(`/invisia/compliance/inventory/${id}`, { params: { token } });
}
export function deleteAllComplianceInventory(token) {
  return api.delete('/invisia/compliance/inventory', { params: { token } });
}
export function getComplianceBreaches(token) {
  return api.get('/invisia/compliance/breaches', { params: { token } });
}
export function reportComplianceBreach(token, data) {
  return api.post('/invisia/compliance/breaches', toFormData({ token, ...data }));
}
export function resolveComplianceBreach(token, id, data) {
  return api.post(`/invisia/compliance/breaches/${id}/resolve`, toFormData({ token, ...data }));
}
export function getComplianceTemplates(token) {
  return api.get('/invisia/compliance/templates', { params: { token } });
}
export function createComplianceTemplate(token, data) {
  return api.post('/invisia/compliance/templates', toFormData({ token, ...data }));
}
export function deleteComplianceTemplate(token, id) {
  return api.delete(`/invisia/compliance/templates/${id}`, { params: { token } });
}

// ---- ARCO Requests ----
export function getArcoRequests(token, params = {}) {
  const qp = { token, ...params };
  const searchParams = new URLSearchParams();
  Object.entries(qp).forEach(([k, v]) => { if (v !== undefined && v !== null) searchParams.append(k, v); });
  return api.get('/invisia/compliance/arco-requests', { params: searchParams });
}
export function createArcoRequest(token, data) {
  return api.post('/invisia/compliance/arco-requests', toFormData({ token, ...data }));
}
export function respondArcoRequest(token, id, response) {
  return api.post(`/invisia/compliance/arco-requests/${id}/respond`, toFormData({ token, response }));
}
export function rejectArcoRequest(token, id, response) {
  return api.post(`/invisia/compliance/arco-requests/${id}/reject`, toFormData({ token, response }));
}

// ---- ARCO Portal (new routes) ----
export function arcoListRequests(token) {
  return api.post('/arco/requests/list', toFormData({ token }));
}
export function arcoUpdateRequest(token, requestId, estado, respuesta) {
  return api.post('/arco/requests/update', toFormData({ token, requestId, estado, respuesta }));
}
export function arcoGenerateResponse(token, requestId) {
  return api.post('/arco/requests/generate-response', toFormData({ token, requestId }));
}

// Legacy compliance wrappers
export function getConsents(token) {
  return getComplianceConsents(token);
}
export function getInventory(token) {
  return getComplianceInventory(token);
}
export function getBreaches(token) {
  return getComplianceBreaches(token);
}
export function toggleConsent(token, id) {
  return revokeComplianceConsent(token, id);
}
export function getComplianceTrainings(token) {
  return api.get(`/invisia/compliance/trainings?token=${encodeURIComponent(token)}`);
}
export function createComplianceTraining(token, data) {
  return api.post('/invisia/compliance/trainings', toFormData({ token, ...data }));
}
export function completeComplianceTraining(token, id, data) {
  return api.post(`/invisia/compliance/trainings/${id}/complete`, toFormData({ token, ...data }));
}
export function deleteComplianceTraining(token, id) {
  return api.delete(`/invisia/compliance/trainings/${id}`, { params: { token } });
}
export function unsignComplianceTraining(token, id) {
  return api.post(`/invisia/compliance/trainings/${id}/unsign`, toFormData({ token }));
}

// Compliance Invites (consentimiento / capacitación vía email, link o QR de un solo uso)
export function createComplianceInvite(token, data) {
  return api.post('/invisia/compliance/invites', toFormData({ token, ...data }));
}
export function bulkComplianceInvites(token, data) {
  return api.post('/invisia/compliance/invites/bulk', toFormData({ token, ...data }));
}
export function listComplianceInvites(token) {
  return api.get('/invisia/compliance/invites', { params: { token } });
}
export function deleteComplianceInvite(token, id) {
  return api.delete(`/invisia/compliance/invites/${id}`, { params: { token } });
}
export function getPublicInvite(inviteToken) {
  return api.get(`/invisia/compliance/public/invites/${inviteToken}`);
}
export function submitPublicInvite(inviteToken, data) {
  return api.post(`/invisia/compliance/public/invites/${inviteToken}/submit`, toFormData(data));
}

// Pseudonymization
export function getPseudonymizationRules(token) {
  return api.get('/invisia/compliance/pseudonymization', { params: { token } });
}
export function createPseudonymizationRule(token, data) {
  return api.post('/invisia/compliance/pseudonymization', toFormData({ token, ...data }));
}
export function updatePseudonymizationRule(token, id, data) {
  return api.put(`/invisia/compliance/pseudonymization/${id}`, toFormData({ token, ...data }));
}
export function deletePseudonymizationRule(token, id) {
  return api.delete(`/invisia/compliance/pseudonymization/${id}`, { data: toFormData({ token }) });
}
export function executePseudonymizationRule(token, id) {
  return api.post(`/invisia/compliance/pseudonymization/${id}/execute`, toFormData({ token }));
}
export function revertPseudonymizationRule(token, id) {
  return api.post(`/invisia/compliance/pseudonymization/${id}/revert`, toFormData({ token }));
}

// DPIA — Evaluación de Impacto (Art. 14 quater / Art. 16)
export function getComplianceDPIAs(token) {
  return api.get('/invisia/compliance/dpia', { params: { token } });
}
export function createComplianceDPIA(token, data) {
  return api.post('/invisia/compliance/dpia', toFormData({ token, ...data }));
}
export function updateComplianceDPIA(token, id, data) {
  return api.put(`/invisia/compliance/dpia/${id}`, toFormData({ token, ...data }));
}
export function deleteComplianceDPIA(token, id) {
  return api.delete(`/invisia/compliance/dpia/${id}`, { params: { token } });
}
export function approveComplianceDPIA(token, id, data) {
  return api.post(`/invisia/compliance/dpia/${id}/approve`, toFormData({ token, ...data }));
}

// DPA — Acuerdos de Tratamiento con Encargados (Art. 9)
export function getComplianceDPAs(token) {
  return api.get('/invisia/compliance/dpa', { params: { token } });
}
export function createComplianceDPA(token, data) {
  return api.post('/invisia/compliance/dpa', toFormData({ token, ...data }));
}
export function updateComplianceDPA(token, id, data) {
  return api.put(`/invisia/compliance/dpa/${id}`, toFormData({ token, ...data }));
}
export function deleteComplianceDPA(token, id) {
  return api.delete(`/invisia/compliance/dpa/${id}`, { params: { token } });
}

// ROPA Export (Registro de Actividades de Tratamiento)
export function exportComplianceROPA(token) {
  return `${API_BASE}/invisia/compliance/ropa-export?token=${encodeURIComponent(token)}`;
}

// DPIA PDF Export
export function exportDPIA(token, dpiaId) {
  return `${API_BASE}/invisia/compliance/dpia/${dpiaId}/pdf?token=${encodeURIComponent(token)}`;
}

// DPA PDF Export
export function exportDPA(token, dpaId) {
  return `${API_BASE}/invisia/compliance/dpa/${dpaId}/pdf?token=${encodeURIComponent(token)}`;
}

// Labor Clause PDF
export function exportLaborClause(token) {
  return `${API_BASE}/invisia/compliance/labor-clause?token=${encodeURIComponent(token)}`;
}

// Portability export CSV/JSON
export function exportPortability(token, email, format = 'json') {
  return api.post('/compliance/portability/export', toFormData({ token, titularEmail: email, format }));
}

// Transfer validation
export function validateTransfer(token, data) {
  return api.post('/compliance/transfer-validation', toFormData({ token, ...data }));
}

// Agents
export function listAgents(token) {
  return api.post('/agents/list', toFormData({ token }));
}
export function deleteAgent(token, agentId) {
  return api.post(`/agents/${agentId}/delete`, toFormData({ token }));
}
export function sendAgentCommand(token, agentId, command) {
  return api.post(`/agents/${agentId}/command`, toFormData({ token, command: JSON.stringify(command) }));
}

// Alerts
export function getAlerts(token, params = {}) {
  return api.post('/alerts/list', toFormData({ token, ...params }));
}
export function resolveAlert(token, alertId, extra = {}) {
  return api.post('/alerts/resolve', toFormData({ token, alertId, ...extra }));
}
export function resolveBulkAlerts(token, alertIds) {
  return api.post('/alerts/resolve-bulk', toFormData({ token, alertIds: JSON.stringify(alertIds) }));
}
export function dismissAlert(token, alertId) {
  return api.post('/alerts/dismiss', toFormData({ token, alertId }));
}
export function deleteAllAlerts(token) {
  return api.post('/alerts/delete-all', toFormData({ token }));
}

export function getAlertStats(token) {
  return api.post('/alerts/stats', toFormData({ token }));
}

// Host Monitor
export function getHostEvents(token, params = {}) {
  return api.post('/host-monitor/events', toFormData({ token, ...params }));
}
export function getHostMonitorStats(token) {
  return api.post('/host-monitor/stats', toFormData({ token }));
}

// Reports
export function getReports(token) {
  return api.post('/reports/list', toFormData({ token }));
}
export function generateReport(token, title) {
  return api.post('/reports/generate', toFormData({ token, title }));
}
export function generateTrainingReport(token) {
  return api.post('/reports/training', toFormData({ token }));
}

// Databases
export function listDatabases(token) {
  return api.post('/databases/list', toFormData({ token }));
}
export function connectDatabase(token, data) {
  return api.post('/databases/connect', toFormData({ token, ...data }));
}
export function updateDatabase(token, id, data) {
  return api.post(`/databases/${id}`, toFormData({ token, ...data }));
}
export function deleteDatabase(token, id) {
  return api.post(`/databases/${id}/delete`, toFormData({ token }));
}
export function testDatabaseConnection(token, id) {
  return api.post(`/databases/${id}/test`, toFormData({ token }));
}
export function scanDatabase(token, id) {
  return api.post(`/databases/${id}/scan`, toFormData({ token }));
}
export function generateDatabaseReport(token, id) {
  return api.post(`/databases/${id}/report`, toFormData({ token }));
}
export function queryDatabase(token, id, query) {
  return api.post(`/databases/${id}/query`, toFormData({ token, query }));
}
export function syncDatabaseAgent(token, id) {
  return api.post(`/databases/${id}/sync-agent`, toFormData({ token }));
}
export function localConnectDatabase(token, data) {
  return api.post('/databases/local-connect', toFormData({ token, ...data }));
}

// User monitor (admin)
export function getUserMonitorData(token, userId) {
  return api.post(`/user-monitor/${userId}`, toFormData({ token }));
}

// Notifications
export function listNotifications(token, limit = 50, unreadOnly = false) {
  return api.post('/notifications/list', toFormData({ token, limit, unreadOnly }));
}
export function unreadNotificationCount(token) {
  return api.post('/notifications/unread-count', toFormData({ token }));
}
export function markNotificationRead(token, id) {
  return api.post(`/notifications/${id}/read`, toFormData({ token }));
}
export function markAllNotificationsRead(token) {
  return api.post('/notifications/read-all', toFormData({ token }));
}
export function deleteNotification(token, id) {
  return api.post(`/notifications/${id}/delete`, toFormData({ token }));
}
export function createNotification(token, type, title, message) {
  return api.post('/notifications/create', toFormData({ token, type, title, message }));
}
export function clearAllNotifications(token) {
  return api.post('/notifications/clear-all', toFormData({ token }));
}

// ─── Payments ───
export function getPaymentUsers(token) {
  return api.post('/payments/users', toFormData({ token }));
}
export function updateUserPayment(token, userId, paymentStatus, customPrice, bankDetails) {
  return api.post('/payments/user-update', toFormData({ token, userId, paymentStatus, customPrice, bankName: bankDetails.bankName, accountType: bankDetails.accountType, accountNumber: bankDetails.accountNumber, rut: bankDetails.rut, email: bankDetails.email }));
}
export function recordPayment(token, userId, month, year, amount, concept, status) {
  return api.post('/payments/record', toFormData({ token, userId, month, year, amount, concept, status }));
}
export function getPaymentHistory(token, userId) {
  return api.post(`/payments/history/${userId}`, toFormData({ token }));
}
export function getMyPaymentInfo(token) {
  return api.post('/payments/my-info', toFormData({ token }));
}
export function submitPayment(token, month, year, amount, concept) {
  return api.post('/payments/submit', toFormData({ token, month, year, amount, concept }));
}
export function verifyPayment(token, paymentId, status, notes) {
  return api.post('/payments/verify', toFormData({ token, paymentId, status, notes }));
}
export function getPendingPayments(token) {
  return api.post('/payments/pending', toFormData({ token }));
}

// ─── 2FA ───
export function setup2FA(token) {
  return api.post('/2fa/setup', toFormData({ token }));
}
export function verify2FA(token, code) {
  return api.post('/2fa/verify', toFormData({ token, code }));
}
export function disable2FA(token, password) {
  return api.post('/2fa/disable', toFormData({ token, password }));
}
export function complete2FALogin(tempToken, code) {
  return api.post('/2fa/complete-login', toFormData({ tempToken, code }));
}

// ─── Account Settings ───
export function changeAccountPassword(token, currentPassword, newPassword) {
  return api.post('/account/change-password', toFormData({ token, currentPassword, newPassword }));
}
export function changeAccountEmail(token, newEmail, password) {
  return api.post('/account/change-email', toFormData({ token, newEmail, password }));
}

// ─── Admin Alerts & Maintenance ───
export function getAdminAlerts(token) {
  return api.post('/admin/alerts/list', toFormData({ token }));
}
export function saveAdminAlert(token, data) {
  return api.post('/admin/alerts/save', toFormData({ token, ...data }));
}
export function toggleAdminAlert(token, alertId, enabled) {
  return api.post('/admin/alerts/toggle', toFormData({ token, alertId, enabled }));
}
export function deleteAdminAlert(token, alertId) {
  return api.post('/admin/alerts/delete', toFormData({ token, alertId }));
}
export function getPublicAlerts() {
  return api.post('/admin/alerts/public', toFormData({}));
}
export function getMaintenanceStatus() {
  return api.post('/admin/maintenance/status', toFormData({}));
}
export function toggleMaintenance(token, data) {
  return api.post('/admin/maintenance/toggle', toFormData({ token, ...data }));
}
export function getDashboardStatus(token) {
  return api.post('/admin/dashboard-status', toFormData({ token }));
}
export function getAuditLogsAdvanced(token, filters = {}) {
  return api.post('/admin/audit-logs', toFormData({ token, ...filters }));
}
export function getAdminReports(token, userId, search) {
  return api.post('/admin/reports/list', toFormData({ token, userId, search }));
}
export function deleteAdminReport(token, reportId) {
  return api.post('/admin/reports/delete', toFormData({ token, reportId }));
}

export function adminResetUserPassword(token, userId, newPassword) {
  return api.post('/admin/reset-password', toFormData({ token, userId, newPassword }));
}
export function adminUpdateUserFull(token, userId, data) {
  return api.post('/admin/update-user', toFormData({ token, userId, ...data }));
}
export function adminGetUserDetails(token, userId) {
  return api.post('/admin/user-details', toFormData({ token, userId }));
}
export function adminDeleteUserFull(token, userId) {
  return api.post('/admin/delete-user-full', toFormData({ token, userId }));
}

export function getActivityLogs(token) {
  return api.post('/activity/logs', toFormData({ token }));
}

export function getDbLogs(token, filters = {}) {
  return api.post('/databases/logs/list', toFormData({ token, ...filters }));
}
export function getDbLogStats(token) {
  return api.post('/databases/logs/stats', toFormData({ token }));
}
export function skipDbLogQuery(token, query) {
  return api.post('/databases/logs/skip-query', toFormData({ token, query }));
}
export function getSkippedDbLogQueries(token) {
  return api.get('/databases/logs/skipped-queries?token=' + encodeURIComponent(token));
}
export function revokeSkippedDbLogQuery(token, query) {
  return api.post('/databases/logs/revoke-skip', toFormData({ token, query }));
}
export function deleteDbLogsByQuery(token, query) {
  return api.post('/databases/logs/delete-by-query', toFormData({ token, query }));
}

// ─── Client Actions (Ajustar Cliente) ───
export function clientUninstallAgent(token, dbId) {
  return api.post(`/databases/${dbId}/client/uninstall`, toFormData({ token }));
}
export function clientReconnectDB(token, dbId) {
  return api.post(`/databases/${dbId}/client/reconnect-db`, toFormData({ token }));
}
export function clientReconnectAgent(token, dbId) {
  return api.post(`/databases/${dbId}/client/reconnect-agent`, toFormData({ token }));
}
export function clientRestartAgent(token, dbId) {
  return api.post(`/databases/${dbId}/client/restart`, toFormData({ token }));
}

export default api;

// AI Assistant chat stubs
export function assistantAsk(text, token, history, pageContext) {
  return api.post('/assistant/ask', toFormData({ question: text, token, history, pageContext }));
}
export function assistantFeedback(message, helpful, token) {
  return api.post('/assistant/feedback', toFormData({ message, helpful, token }));
}

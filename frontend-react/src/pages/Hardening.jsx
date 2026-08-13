import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/context';
import { useAuth } from '../context/AuthContext';
import InfoTooltip from '../components/InfoTooltip';

function fireSessionExpired() {
  if (!window.__sessionExpiredFired) {
    window.__sessionExpiredFired = true;
    window.dispatchEvent(new CustomEvent('session-expired'));
  }
}

function checkTokenError(data, status) {
  if (status === 401 || data?.error === 'token inválido' || data?.error === 'token requerido') {
    fireSessionExpired();
    return true;
  }
  return false;
}

const I = {
  shield: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  users: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  check: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  xmark: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  search: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  info: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  lock: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  alert: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
  database: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>,
  fileText: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  settings: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  globe: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>,
  pen: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>,
};

const breachTimeline = [
  { time: '0-3 horas', action: 'Alerta temprana al CSIRT (Ley 21.663)', severity: 'critical' },
  { time: 'Inmediato', action: 'Contener la brecha (aislar sistemas, revocar accesos)', severity: 'critical' },
  { time: '24 horas', action: 'Notificar a la APDP por medios expeditos (Art. 26)', severity: 'high' },
  { time: '48 horas', action: 'Informar a los titulares si hay datos sensibles, niños o datos económicos', severity: 'high' },
  { time: '72 horas', action: 'Reporte completo al CSIRT con análisis forense', severity: 'medium' },
  { time: '10 días', action: 'Documentar completamente el incidente y las acciones tomadas', severity: 'medium' },
  { time: '30 días', action: 'Implementar medidas correctivas y actualizar el plan de respuesta', severity: 'low' },
];

const HARDENING_DEFS = [
  { id: 'encryption', label: 'Cifrado de Datos', desc: 'Cifrado en reposo y en transito para todos los datos personales (AES-256 / TLS 1.3)', icon: I.lock,
    fields: [
      { key: 'algorithm', type: 'select', label: 'Algoritmo de cifrado', options: ['AES-256', 'AES-128', 'ChaCha20', 'Otro'] },
      { key: 'tlsVersion', type: 'select', label: 'Version TLS', options: ['TLS 1.3', 'TLS 1.2', 'TLS 1.1'] },
      { key: 'scope', type: 'select', label: 'Alcance', options: ['Todos los datos', 'Solo datos sensibles', 'Solo bases de datos'] },
      { key: 'evidenceUrl', type: 'url', label: 'URL de evidencia (politica de cifrado)' },
    ] },
  { id: 'access_control', label: 'Control de Acceso', desc: 'Politica de minimo privilegio, autenticacion multifactor y revision periodica de accesos', icon: I.users,
    fields: [
      { key: 'mfaEnabled', type: 'select', label: 'Autenticacion multifactor', options: ['Si - Todos los usuarios', 'Si - Solo administradores', 'No implementado'] },
      { key: 'accessReviewFreq', type: 'select', label: 'Frecuencia de revision de accesos', options: ['Mensual', 'Trimestral', 'Semestral', 'Anual'] },
      { key: 'policyUrl', type: 'url', label: 'URL de politica de control de acceso' },
    ] },
  { id: 'backup', label: 'Backups Cifrados', desc: 'Copias de seguridad cifradas con prueba de restauracion al menos cada 3 meses', icon: I.database,
    fields: [
      { key: 'backupFreq', type: 'select', label: 'Frecuencia de backup', options: ['Diario', 'Semanal', 'Mensual'] },
      { key: 'encryption', type: 'select', label: 'Cifrado de backups', options: ['Si - AES-256', 'Si - Otro', 'No'] },
      { key: 'lastRestoreTest', type: 'date', label: 'Fecha ultima prueba de restauracion' },
      { key: 'evidenceUrl', type: 'url', label: 'URL de evidencia (log de restauracion)' },
    ] },
  { id: 'logging', label: 'Registro de Auditoria', desc: 'Logs de acceso a datos personales con registro de quien, cuando y que dato fue accedido', icon: I.fileText,
    fields: [
      { key: 'logScope', type: 'select', label: 'Alcance del logging', options: ['Todos los accesos a datos personales', 'Solo accesos a datos sensibles', 'Solo accesos administrativos'] },
      { key: 'retentionDays', type: 'select', label: 'Retencion de logs', options: ['30 dias', '90 dias', '180 dias', '365 dias', 'Mas de 1 ano'] },
      { key: 'siemIntegrated', type: 'select', label: 'Integracion SIEM', options: ['Si', 'No'] },
      { key: 'evidenceUrl', type: 'url', label: 'URL del sistema de logs o evidencia' },
    ] },
  { id: 'patching', label: 'Gestion de Parches', desc: 'Actualizacion de seguridad en menos de 30 dias para vulnerabilidades criticas', icon: I.settings,
    fields: [
      { key: 'patchPolicy', type: 'select', label: 'Politica de parches', options: ['Menos de 7 dias (criticas)', 'Menos de 30 dias (criticas)', 'Menos de 90 dias', 'Sin politica formal'] },
      { key: 'autoPatch', type: 'select', label: 'Parches automaticos', options: ['Habilitados', 'Solo en staging', 'Deshabilitados'] },
      { key: 'lastPatchDate', type: 'date', label: 'Fecha ultimo parche critico aplicado' },
      { key: 'evidenceUrl', type: 'url', label: 'URL de politica de parches' },
    ] },
  { id: 'ids_ips', label: 'IDS/IPS', desc: 'Sistema de deteccion y prevencion de intrusiones en la red interna', icon: I.alert,
    fields: [
      { key: 'solution', type: 'select', label: 'Solucion implementada', options: ['Snort', 'Suricata', 'Zeek (Bro)', 'Fortinet', 'Palo Alto', 'Cisco IPS', 'Otro'] },
      { key: 'mode', type: 'select', label: 'Modo de operacion', options: ['Deteccion (IDS)', 'Prevencion (IPS)', 'Ambos'] },
      { key: 'coverage', type: 'select', label: 'Cobertura', options: ['Toda la red', 'Solo segmento de datos', 'Solo perimetro'] },
      { key: 'evidenceUrl', type: 'url', label: 'URL de evidencia (configuracion SIEM/IDS)' },
    ] },
  { id: 'dlp', label: 'DLP (Data Loss Prevention)', desc: 'Prevencion de fuga de datos sensibles mediante monitoreo de salida de informacion', icon: I.shield,
    fields: [
      { key: 'solution', type: 'select', label: 'Solucion DLP', options: ['Symantec DLP', 'McAfee DLP', 'Forcepoint DLP', 'Microsoft Purview', 'Zscaler', 'Custom/Propio', 'Otro'] },
      { key: 'channels', type: 'select', label: 'Canales monitoreados', options: ['Email + Web + Endpoint', 'Solo Email', 'Solo Web', 'Solo Endpoint'] },
      { key: 'alertMode', type: 'select', label: 'Modo de alerta', options: ['Bloqueo automatico', 'Alerta + revision manual', 'Solo logging'] },
      { key: 'evidenceUrl', type: 'url', label: 'URL de evidencia (politica DLP)' },
    ] },
  { id: 'waf', label: 'WAF (Web Application Firewall)', desc: 'Firewall de aplicaciones web para proteger APIs y formularios que capturan datos', icon: I.globe,
    fields: [
      { key: 'provider', type: 'select', label: 'Proveedor WAF', options: ['Cloudflare', 'AWS WAF', 'Akamai', 'Imperva', 'F5 ASM', 'ModSecurity', 'Sucuri', 'Otro'] },
      { key: 'deployment', type: 'select', label: 'Despliegue', options: ['Cloud (SaaS)', 'On-premise', 'Hibrido'] },
      { key: 'ruleset', type: 'select', label: 'Ruleset', options: ['OWASP Core Rule Set', 'Personalizado', 'Default del proveedor'] },
      { key: 'domainProtected', type: 'text', label: 'Dominio protegido' },
      { key: 'evidenceUrl', type: 'url', label: 'URL de evidencia (config WAF)' },
    ] },
  { id: 'pseudonymization', label: 'Seudonimizacion', desc: 'Tecnica de reemplazo de identificadores directos por seudonimos en bases de datos', icon: I.search,
    fields: [
      { key: 'technique', type: 'select', label: 'Tecnica utilizada', options: ['Tokenizacion', 'Hashing (SHA-256)', 'Cifrado reversible', 'Masking', 'Otro'] },
      { key: 'scope', type: 'select', label: 'Alcance', options: ['Todos los identificadores directos', 'Solo RUT/DNI', 'Solo emails', 'Solo datos sensibles'] },
      { key: 'keyManagement', type: 'select', label: 'Gestion de claves', options: ['KMS dedicado', 'HSM', 'Vault', 'Manual'] },
      { key: 'evidenceUrl', type: 'url', label: 'URL de evidencia (reglas de seudonimizacion)' },
    ] },
  { id: 'incident_response', label: 'Plan de Respuesta a Incidentes', desc: 'Procedimiento documentado para contener, erradicar y recuperarse de brechas de seguridad', icon: I.alert,
    fields: [
      { key: 'planStatus', type: 'select', label: 'Estado del plan', options: ['Documentado y probado', 'Documentado sin probar', 'En desarrollo', 'No existe'] },
      { key: 'lastDrill', type: 'date', label: 'Fecha ultimo simulacro (drill)' },
      { key: 'teamSize', type: 'select', label: 'Tamano del equipo de respuesta', options: ['1-3 personas', '4-10 personas', 'Mas de 10'] },
      { key: 'evidenceUrl', type: 'url', label: 'URL del plan de respuesta a incidentes' },
    ] },
];

export default function Hardening() {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('measures');
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dbCompliance, setDbCompliance] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [config, setConfig] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showDpdModal, setShowDpdModal] = useState(false);
  const [dpdForm, setDpdForm] = useState({ dpdName: '', dpdEmail: '', dpdPhone: '' });
  const [savingDpd, setSavingDpd] = useState(false);
  const [pseudoRules, setPseudoRules] = useState([]);
  const [hasWaf, setHasWaf] = useState(false);
  const [showMeasureModal, setShowMeasureModal] = useState(null);
  const [measureForm, setMeasureForm] = useState({});
  const [savingMeasure, setSavingMeasure] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const opts = { signal: controller.signal };
    const safeFetch = (url, init) => fetch(url, { ...opts, ...init }).then(r => r.json().then(d => ({ data: d, status: r.status }))).catch(() => ({ data: null, status: 0 }));

    Promise.all([
      safeFetch('/api/dashboard/stats?token=' + token),
      safeFetch('/api/invisia/compliance/inventory', { headers: { Authorization: `Bearer ${token}` } }),
      safeFetch('/api/invisia/compliance/breaches', { headers: { Authorization: `Bearer ${token}` } }),
      safeFetch('/api/invisia/compliance/config', { headers: { Authorization: `Bearer ${token}` } }),
      safeFetch('/api/alerts/list', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token, limit: '50' }) }),
      safeFetch('/api/invisia/compliance/pseudonymization', { headers: { Authorization: `Bearer ${token}` } }),
      user?.domain ? safeFetch(`/api/hardening/check-waf?domain=${encodeURIComponent(user.domain)}`) : Promise.resolve({ data: { waf: false }, status: 200 }),
    ]).then(([{ data: ds, status: dsS }, { data: inv, status: invS }, { data: br, status: brS }, { data: cfg, status: cfgS }, { data: al, status: alS }, { data: pseudo, status: pseudoS }, { data: wafResult, status: wafS }]) => {
      clearTimeout(timeout);
      if (checkTokenError(ds, dsS) || checkTokenError(inv, invS) || checkTokenError(br, brS) || checkTokenError(cfg, cfgS) || checkTokenError(al, alS) || checkTokenError(pseudo, pseudoS)) return;
      if (ds && ds.stats) setDashboardStats(ds.stats);
      if (ds && ds.dbCompliance) setDbCompliance(ds.dbCompliance);
      setInventory(Array.isArray(inv) ? inv : []);
      setBreaches(Array.isArray(br) ? br : []);
      if (cfg && !cfg.error) setConfig(cfg);
      if (al && al.alerts) setAlerts(al.alerts);
      if (Array.isArray(pseudo)) setPseudoRules(pseudo);
      if (wafResult) setHasWaf(wafResult.waf);
    }).catch(() => {}).finally(() => { clearTimeout(timeout); setLoading(false); });
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [user]);

  const saveDpd = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSavingDpd(true);
    try {
      const res = await fetch('/api/invisia/compliance/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token, ...dpdForm }),
      });
      const data = await res.json();
      if (checkTokenError(data)) return;
      if (data && !data.error) {
        setConfig(data);
        setShowDpdModal(false);
      }
    } catch {}
    setSavingDpd(false);
  };

  const saveMeasure = async (e) => {
    e.preventDefault();
    if (!token || !showMeasureModal) return;
    setSavingMeasure(true);
    try {
      const existing = (config?.measureOverrides || []).filter(o => o.measureId !== showMeasureModal.id);
      const fieldData = {};
      (showMeasureModal.fields || []).forEach(f => {
        if (measureForm[f.key] !== undefined && measureForm[f.key] !== '') {
          fieldData[f.key] = measureForm[f.key];
        }
      });
      const newOverrides = [...existing, {
        measureId: showMeasureModal.id,
        completed: true,
        notes: measureForm.notes || '',
        evidence: measureForm.evidenceUrl || measureForm.evidence || '',
        fieldData: JSON.stringify(fieldData),
        completedAt: new Date().toISOString(),
      }];
      const res = await fetch('/api/invisia/compliance/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token, measureOverrides: JSON.stringify(newOverrides) }),
      });
      const data = await res.json();
      if (checkTokenError(data)) return;
      if (data && !data.error) {
        setConfig(data);
        setShowMeasureModal(null);
        setMeasureForm({});
      }
    } catch {}
    setSavingMeasure(false);
  };

  const revokeMeasure = async (measureId) => {
    if (!token) return;
    try {
      const existing = (config?.measureOverrides || []).filter(o => o.measureId !== measureId);
      const res = await fetch('/api/invisia/compliance/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token, measureOverrides: JSON.stringify(existing) }),
      });
      const data = await res.json();
      if (checkTokenError(data)) return;
      if (data && !data.error) setConfig(data);
    } catch {}
  };

  const hasSslDbs = dbCompliance.some(db => db.tables && db.tables.length > 0);
  const hasPersonalData = dbCompliance.some(db => db.tables && db.tables.some(t => (t.personalDataColumns || t.columns || []).length > 0));
  const hasScannedRecently = dbCompliance.some(db => db.lastScanned && new Date(db.lastScanned) > new Date(Date.now() - 7 * 86400000));
  const hasAlertsForEncryption = alerts.some(a => a.category === 'encryption');
  const hasAlertsForDataDiscovery = alerts.some(a => a.category === 'data_discovery');

  const overrides = config?.measureOverrides || [];
  const getOverride = (id) => overrides.find(o => o.measureId === id && o.completed);

  const measures = HARDENING_DEFS.map(def => {
    let done = false;
    let override = getOverride(def.id);
    switch (def.id) {
      case 'encryption':
        done = hasSslDbs || (dashboardStats?.totalDatabases || 0) > 0;
        break;
      case 'access_control':
        done = (dashboardStats?.onlineAgents || 0) > 0;
        break;
      case 'backup':
        done = hasScannedRecently || dashboardStats?.totalDatabases > 1;
        break;
      case 'logging':
        done = (dashboardStats?.onlineAgents || 0) > 0 || hasAlertsForDataDiscovery;
        break;
      case 'patching':
        done = (dashboardStats?.onlineAgents || 0) > 0 && hasScannedRecently;
        break;
      case 'ids_ips':
        done = (dashboardStats?.onlineAgents || 0) > 0;
        break;
      case 'dlp':
        done = hasPersonalData || inventory.some(i => (i.securityMeasures || []).length > 0);
        break;
      case 'waf':
        done = hasWaf;
        break;
      case 'pseudonymization':
        done = pseudoRules.some(r => r.status === 'executed') || inventory.some(i => (i.securityMeasures || []).some(m =>
          m.toLowerCase().includes('seudonim') || m.toLowerCase().includes('pseudonym')
        ));
        break;
      case 'incident_response':
        done = breaches.some(b => b.status === 'resolved');
        break;
    }
    return { ...def, done: done || !!override, override };
  });

  const doneCount = measures.filter(m => m.done).length;
  const pct = Math.round(doneCount / measures.length * 100);

  const dpdObligations = [
    { label: 'Supervisar el cumplimiento normativo', done: !!config?.dpdEmail },
    { label: 'Asesorar en evaluaciones de impacto', done: !!config?.companyName },
    { label: 'Atender solicitudes de titulares', done: breaches.length > 0 },
    { label: 'Coordinar con la APDP', done: !!config?.apdpRegistered },
    { label: 'Capacitar al personal', done: inventory.length > 0 },
    { label: 'Mantener registro de actividades', done: (dashboardStats?.totalDatabases || 0) > 0 },
    { label: 'Reportar brechas a la APDP', done: breaches.some(b => b.notifiedAPDP) },
    { label: 'Realizar auditorías periódicas', done: (dashboardStats?.totalAgents || 0) > 0 },
  ];

  const tabs = [
    { id: 'measures', label: 'Medidas Técnicas', icon: I.shield, tip: 'Medidas de seguridad organizativas y técnicas.' },
    { id: 'dpd', label: 'DPD', icon: I.users, tip: 'Delegado de Protección de Datos (Art. 28).' },
    { id: 'breach', label: 'Protocolo Brechas', icon: I.alert, tip: 'Protocolo de notificación de brechas (Art. 26).' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="text-sm text-text-muted">Cargando datos de hardening...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="sticky top-0 z-30 bg-bg-base border-b border-white/[0.04] flex-shrink-0">
        <div className="w-full px-4 md:px-8 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Endurecimiento de seguridad</p>
              <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">Hardening</h1>
            </div>
          </div>
        </div>
        <div className="w-full px-4 md:px-8 pb-0">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive ? 'border-indigo-400 text-text-heading' : 'border-transparent text-text-muted hover:text-text-body hover:border-white/[0.1]'
                  }`}>
                  <span className={isActive ? 'text-indigo-400' : 'text-text-subtle'}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto theme-scrollbar">
        {activeTab === 'measures' && (
          <div className="p-4 md:p-8 w-full space-y-4 md:space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 tour-detail-1">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-200">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-indigo-400 " />
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-indigo-400">{I.shield}</span>
                  <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Medidas Implementadas <InfoTooltip text="Número de medidas de seguridad técnicas configuradas" placement="right" /></span>
                </div>
                <p className="text-[26px] font-bold leading-none tracking-tight text-text-heading">{doneCount}/{measures.length}</p>
                <p className="text-[10px] text-text-subtle mt-2">{pct}% completado</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-200">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-emerald-400 " />
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-emerald-400">{I.check}</span>
                  <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Cumplidas <InfoTooltip text="Medidas de seguridad correctamente configuradas" placement="right" /></span>
                </div>
                <p className="text-[26px] font-bold leading-none tracking-tight text-emerald-400">{doneCount}</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-200">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-yellow-400 " />
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-yellow-400">{I.xmark}</span>
                  <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Pendientes <InfoTooltip text="Medidas que aún no han sido implementadas" placement="right" /></span>
                </div>
                <p className="text-[26px] font-bold leading-none tracking-tight text-yellow-400">{measures.length - doneCount}</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-200">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-cyan-400 " />
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-cyan-400">{I.info}</span>
                  <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Riesgo Residual <InfoTooltip text="Nivel de riesgo después de aplicar las medidas de seguridad" placement="right" /></span>
                </div>
                <p className="text-[26px] font-bold leading-none tracking-tight text-cyan-400">{pct >= 70 ? 'Bajo' : pct >= 40 ? 'Medio' : 'Alto'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[12px] font-semibold text-white flex items-center gap-2">
                  <span className="text-indigo-400">{I.shield}</span>
                  <span>Progreso por Medida <InfoTooltip text="Vista visual del estado de cada medida de seguridad" placement="right" /></span>
                </h4>
                <span className="text-[10px] text-text-subtle">{doneCount}/{measures.length} completadas <InfoTooltip text="Indicador del progreso actual de implementación" placement="left" /></span>
              </div>
              <div className="flex gap-1.5">
                {measures.map((m, i) => (
                  <div key={m.id} className="group/bar relative flex-1 min-w-0">
                    <div className={`h-9 rounded-md transition-all duration-300 flex items-center justify-center cursor-default ${
                      m.done
                        ? 'bg-emerald-500/15 border border-emerald-500/25'
                        : 'bg-bg-elevated/60 border border-border-theme/50 hover:border-surface-600/50'
                    }`}>
                      {m.done
                        ? <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        : <span className="text-text-subtle text-[9px] font-mono font-semibold">{i + 1}</span>
                      }
                    </div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-elevated text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 border border-border-theme/50 shadow-lg">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[15px] font-semibold text-text-heading">Medidas de Seguridad Técnicas y Organizativas <InfoTooltip text="Evaluación completa de las medidas de seguridad según Art. 25" placement="right" /></h3>
                  <p className="text-[12px] text-text-muted mt-1">Art. 25 Ley 21.719 — Datos reales: {dashboardStats?.totalAgents || 0} agente(s) ({dashboardStats?.onlineAgents || 0} online), {dashboardStats?.totalDatabases || 0} base(s) de datos ({dashboardStats?.totalTables || 0} tablas, {dashboardStats?.totalRecords || 0} registros), {dashboardStats?.totalBreaches || 0} brecha(s), {inventory.length} item(s) inventario.</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={`text-[32px] font-bold leading-none ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{pct}%</span>
                    <InfoTooltip text="Puntaje global calculado automáticamente con 200+ reglas" placement="left" />
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">Implementado <InfoTooltip text="Porcentaje de medidas de seguridad implementadas" placement="left" /></p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 w-full bg-bg-elevated/50 rounded-full h-2.5">
                  <div className={`h-full rounded-full transition-all duration-700 ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <InfoTooltip text="Barra visual del nivel de cumplimiento general" placement="right" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 tour-detail-2">
                {measures.map(item => (
                  <div key={item.id} className={`flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 ${
                    item.done ? 'bg-emerald-500/[0.04] border-emerald-500/20' : 'bg-bg-base/40 border-border-theme/25 hover:border-surface-600/40 hover:bg-bg-panel/30'
                  }`}>
                    <span className={`mt-0.5 ${item.done ? 'text-emerald-400' : 'text-text-subtle'}`}>{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[12px] font-medium ${item.done ? 'text-emerald-300' : 'text-text-muted'}`}>{item.label}</span>
                        {item.done
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{I.check} Implementado<InfoTooltip text="Medida activa y configurada." placement="left" /></span>
                          : <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">{I.xmark} Pendiente<InfoTooltip text="Medida no implementada aún." placement="left" /></span>
                        }
                      </div>
                      <p className="text-[11px] text-text-subtle mt-1">{item.desc}</p>
                    </div>
                    <div className="flex-shrink-0 relative ml-2 self-center flex flex-col items-center gap-1.5">
                      {item.done ? (
                        <>
                          <svg className="w-9 h-9" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" className="stroke-emerald-500/15" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15" fill="none" className="stroke-emerald-400" strokeWidth="3" strokeDasharray="94.25" strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 18 18)" />
                            <path d="M12 18l4 4 8-8" fill="none" className="stroke-emerald-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {item.override && (
                            <div className="flex flex-col items-center gap-1">
                              <button onClick={() => revokeMeasure(item.id)} className="text-[9px] text-text-subtle hover:text-red-400 font-medium transition-colors">Desactivar</button>
                              {item.override.completedAt && <span className="text-[8px] text-text-subtle">{new Date(item.override.completedAt).toLocaleDateString('es')}</span>}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <svg className="w-9 h-9" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" className="stroke-surface-700" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15" fill="none" className="stroke-gray-600" strokeWidth="3" strokeDasharray="94.25" strokeDashoffset="70.69" strokeLinecap="round" transform="rotate(-90 18 18)" />
                          </svg>
                          <button onClick={() => { setMeasureForm({}); setShowMeasureModal(item); }}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all font-medium whitespace-nowrap">
                            Completar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-indigo-400">{I.info}</span>
                  <h4 className="text-[12px] font-semibold text-text-heading">Recomendaciones para Cumplir Art. 25 <InfoTooltip text="Pasos sugeridos para alcanzar el cumplimiento del Art. 25" placement="right" /></h4>
                </div>
                <ul className="space-y-2">
                  {[
                    'Realizar evaluaciones de impacto (EIPD) antes de nuevos tratamientos',
                    'Documentar todas las medidas de seguridad implementadas',
                    'Revisar y actualizar medidas al menos anualmente',
                    'Contratar auditorías externas de seguridad periódicas',
                    'Mantener un registro de incidentes y lecciones aprendidas',
                  ].map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-text-muted hover:text-text-muted transition-colors duration-150">
                      <span className="text-indigo-400 mt-0.5 flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5">›</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-cyan-400">{I.fileText}</span>
                  <h4 className="text-[12px] font-semibold text-text-heading">Estándares de Referencia <InfoTooltip text="Marcos de seguridad internacionales de referencia" placement="right" /></h4>
                </div>
                <div className="space-y-2 group">
                  {[
                    { std: 'ISO 27001', desc: 'Sistema de Gestión de Seguridad de la Información' },
                    { std: 'NIST CSF', desc: 'Framework de Ciberseguridad (identificar, proteger, detectar, responder, recuperar)' },
                    { std: 'OWASP Top 10', desc: 'Riesgos de seguridad en aplicaciones web' },
                    { std: 'ENS Chile', desc: 'Estándar Nacional de Seguridad (próximamente)' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-base/40 border border-border-theme/25 hover:border-cyan-500/20 hover:bg-bg-panel/30 transition-all duration-200">
                      <span className="text-[12px] font-semibold text-cyan-400 font-mono">{s.std}</span>
                      <span className="text-[10px] text-text-subtle group-hover:text-text-muted transition-colors">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dpd' && (
          <div className="p-4 md:p-8 w-full space-y-4 md:space-y-6">
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3 md:p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-bg-elevated/60 border border-border-theme/40 flex items-center justify-center text-indigo-400 flex-shrink-0">{I.users}</div>
                <div>
                  <h3 className="text-[15px] font-semibold text-text-heading">Delegado de Protección de Datos (DPD) <InfoTooltip text="Información y obligaciones del DPD según Art. 28" placement="right" /></h3>
                  <p className="text-[12px] text-text-muted mt-1">Art. 28 Ley 21.719 — El DPD es la figura responsable de supervisar el cumplimiento normativo, asesorar en evaluaciones de impacto y actuar como punto de contacto con la APDP.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="bg-bg-base/40 border border-border-theme/25 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[12px] font-semibold text-text-heading">Información del DPD <InfoTooltip text="Datos de contacto del Delegado de Protección" placement="right" /></h4>
                    <button onClick={() => { setDpdForm({ dpdName: config?.dpdName || '', dpdEmail: config?.dpdEmail || '', dpdPhone: config?.dpdPhone || '' }); setShowDpdModal(true); }}
                      className="flex items-center gap-1 text-[10px] text-accent hover:text-primary-300 font-medium">
                      {I.pen} Registrar / Editar <InfoTooltip text="Actualizar los datos de contacto del DPD." placement="left" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-elevated/40 border border-border-theme/25">
                      <span className="text-[11px] text-text-muted flex items-center gap-1">Nombre <InfoTooltip text="Nombre completo del Delegado de Protección." /></span>
                      <span className="text-[11px] text-white font-medium">{config?.dpdName || 'No designado'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-elevated/40 border border-border-theme/25">
                      <span className="text-[11px] text-text-muted flex items-center gap-1">Email <InfoTooltip text="Correo de contacto del DPD." /></span>
                      <span className="text-[11px] text-white font-mono">{config?.dpdEmail || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-elevated/40 border border-border-theme/25">
                      <span className="text-[11px] text-text-muted flex items-center gap-1">Teléfono <InfoTooltip text="Teléfono de contacto del DPD." /></span>
                      <span className="text-[11px] text-white font-medium">{config?.dpdPhone || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-elevated/40 border border-border-theme/25">
                      <span className="text-[11px] text-text-muted flex items-center gap-1">Nivel Cumplimiento <InfoTooltip text="Nivel de certificación actual." /></span>
                      <span className="text-[11px] text-white font-medium">{config?.complianceLevel || 'básico'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-elevated/40 border border-border-theme/25">
                      <span className="text-[11px] text-text-muted flex items-center gap-1">Registro APDP <InfoTooltip text="Estado de inscripción ante la Agencia." /></span>
                      <span className={`text-[11px] font-medium ${config?.apdpRegistered ? 'text-emerald-400' : 'text-red-400'}`}>{config?.apdpRegistered ? '✓ Registrado' : '✗ No registrado'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-bg-base/40 border border-border-theme/25 rounded-lg p-5">
                  <h4 className="text-[12px] font-semibold text-white mb-3">Obligaciones del DPD <InfoTooltip text="Funciones y responsabilidades del Delegado" placement="right" /></h4>
                  <div className="space-y-1.5">
                    {dpdObligations.map((obl, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated/40 border border-border-theme/25">
                        {obl.done
                          ? <span className="text-emerald-400 flex-shrink-0">{I.check}<InfoTooltip text="Obligación cumplida." placement="left" /></span>
                          : <span className="text-text-subtle flex-shrink-0">{I.xmark}<InfoTooltip text="Obligación pendiente." placement="left" /></span>
                        }
                        <span className={`text-[11px] ${obl.done ? 'text-text-muted' : 'text-text-muted'}`}>{obl.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-bg-base/40 border border-border-theme/25 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">{I.info}</div>
                  <div>
                    <p className="text-[12px] text-text-body font-medium mb-1">Modelo de Prevención de Infracciones <InfoTooltip text="Modelo voluntario que funciona como atenuante ante fiscalizaciones" placement="right" /></p>
                    <p className="text-[11px] text-text-subtle leading-relaxed">El Art. 28 permite adoptar voluntariamente un modelo de prevención de infracciones, que incluye la designación del DPD, la implementación de un sistema de prevención y su certificación ante la APDP. Este modelo funciona como atenuante en caso de fiscalización, pudiendo reducir significativamente las multas aplicables. En empresas pequeñas, el dueño o una jefatura puede asumir el rol de DPD.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'breach' && (
          <div className="p-4 md:p-8 w-full space-y-4 md:space-y-6">
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3 md:p-6">
              <h3 className="text-[15px] font-semibold text-white mb-1">Protocolo de Notificación de Brechas <InfoTooltip text="Plazos y procedimientos de notificación obligatoria" placement="right" /></h3>
              <p className="text-[12px] text-text-muted mb-5">Art. 26 Ley 21.719 + Ley 21.663 Marco de Ciberseguridad. Las brechas de datos personales deben notificarse a la APDP por los medios más expeditos posibles y sin dilaciones indebidas. Tienes <span className="text-white font-medium">{dashboardStats?.totalBreaches || 0}</span> brecha(s) registrada(s), <span className="text-red-400">{dashboardStats?.openBreaches || 0}</span> abierta(s). {alerts.length > 0 && <span className="text-cyan-400">· {alerts.filter(a => a.status === 'active').length} alerta(s) activa(s) de seguridad</span>} <InfoTooltip text="Resumen de brechas registradas y alertas activas" placement="right" /></p>

              <div className="relative mb-6">
                <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-red-500/50 via-yellow-500/40 via-cyan-500/40 to-gray-500/30 rounded-full" />
                <div className="space-y-5">
                  {breachTimeline.map((step, i) => (
                    <div key={i} className="relative flex items-start gap-4 pl-0">
                      <div className="relative flex-shrink-0 z-10">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                          step.severity === 'critical' ? 'border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.25)]' :
                          step.severity === 'high' ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400 ' :
                          step.severity === 'medium' ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' :
                          'border-gray-600 bg-gray-600/20 text-text-muted'
                        }`}>
                          {step.severity === 'critical' ? (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          ) : step.severity === 'high' ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01" /></svg>
                          ) : (
                            <span>{i + 1}</span>
                          )}
                        </div>
                        {step.severity === 'critical' && (
                          <div className="absolute -inset-1.5 rounded-full border border-red-500/30 animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5 bg-bg-base/30 rounded-lg p-3 border border-transparent hover:border-border-theme/40 hover:bg-bg-panel/25 transition-all duration-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[11px] font-bold ${
                            step.severity === 'critical' ? 'text-red-400' :
                            step.severity === 'high' ? 'text-yellow-400' :
                            step.severity === 'medium' ? 'text-cyan-400' : 'text-text-muted'
                          }`}>{step.time}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-semibold rounded uppercase ${
                            step.severity === 'critical' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                            step.severity === 'high' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
                            step.severity === 'medium' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' :
                            'bg-gray-500/15 text-text-muted border border-gray-500/20'
                          }`}>{step.severity}</span><InfoTooltip text="Urgencia de esta acción." placement="right" />
                        </div>
                        <p className="text-[12px] text-text-body">{step.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bg-base/40 border border-border-theme/25 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-400">{I.alert}</span>
                    <h4 className="text-[12px] font-semibold text-text-heading">Ley 21.719 - APDP <InfoTooltip text="Obligaciones de notificación ante la autoridad" placement="right" /></h4>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">Notificar a la Agencia de Protección de Datos Personales "por los medios más expeditos posibles y sin dilaciones indebidas". Si la brecha afecta datos sensibles, de niños o económicos, también debes informar a los titulares.</p>
                </div>
                <div className="bg-bg-base/40 border border-border-theme/25 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-cyan-400">{I.fileText}</span>
                    <h4 className="text-[12px] font-semibold text-text-heading">Ley 21.663 - CSIRT <InfoTooltip text="Obligaciones ante el Centro de Respuesta a Incidentes" placement="right" /></h4>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">Ciertas empresas deben reportar al CSIRT Nacional: alerta temprana en 3 horas, reporte completo en 72 horas. Son dos leyes distintas con dos organismos distintos. Una misma brecha puede activar dos relojes en paralelo.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDpdModal && (
          <div className="fixed inset-0 bg-bg-overlay flex items-center justify-center z-50 p-3 md:p-4">
            <div className="w-full max-w-md mx-auto bg-bg-panel border border-border-theme rounded-xl shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                <h3 className="text-[13px] font-semibold text-text-heading">Registrar DPD <InfoTooltip text="Registra los datos de contacto del Delegado de Protección" placement="right" /></h3>
                <button onClick={() => setShowDpdModal(false)} className="text-text-muted hover:text-text-heading transition-colors p-1 hover:bg-bg-elevated rounded-lg">{I.xmark}</button>
              </div>
              <form onSubmit={saveDpd} className="p-5 space-y-3">
                <div>
                  <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Nombre del DPD <InfoTooltip text="Nombre completo del Delegado designado" placement="right" /></label>
                  <input value={dpdForm.dpdName} onChange={e => setDpdForm(f => ({...f, dpdName: e.target.value}))} placeholder="Nombre completo"
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Email del DPD * <InfoTooltip text="Correo electrónico de contacto del DPD" placement="right" /></label>
                  <input value={dpdForm.dpdEmail} onChange={e => setDpdForm(f => ({...f, dpdEmail: e.target.value}))} placeholder="dpd@tuempresa.cl" type="email" required
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Teléfono del DPD <InfoTooltip text="Número de teléfono de contacto del DPD" placement="right" /></label>
                  <input value={dpdForm.dpdPhone} onChange={e => setDpdForm(f => ({...f, dpdPhone: e.target.value}))} placeholder="+56 9 XXXX XXXX"
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowDpdModal(false)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-bg-elevated hover:bg-bg-elevated text-text-body border border-border-theme transition-all">Cancelar <InfoTooltip text="Cierra el formulario sin guardar cambios" placement="top" /></button>
                  <button type="submit" disabled={savingDpd}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-all disabled:opacity-30 disabled:pointer-events-none">
                    {savingDpd ? 'Guardando...' : 'Guardar DPD'} <InfoTooltip text="Guarda los datos de contacto del Delegado" placement="top" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showMeasureModal && (
          <div className="fixed inset-0 bg-bg-overlay flex items-center justify-center z-50 p-3 md:p-4">
            <div className="w-full max-w-lg mx-auto bg-bg-panel border border-border-theme rounded-xl shadow-xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] sticky top-0 bg-bg-panel z-10">
                <div className="flex items-center gap-2.5">
                  <span className="text-indigo-400 flex-shrink-0">{showMeasureModal.icon}</span>
                  <div>
                    <h3 className="text-[13px] font-semibold text-text-heading">{showMeasureModal.label}</h3>
                    <p className="text-[10px] text-text-muted mt-0.5">Completar medida de seguridad</p>
                  </div>
                </div>
                <button onClick={() => setShowMeasureModal(null)} className="text-text-muted hover:text-text-heading transition-colors p-1 hover:bg-bg-elevated rounded-lg flex-shrink-0">{I.xmark}</button>
              </div>
              <form onSubmit={saveMeasure} className="p-5 space-y-4">
                <div className="rounded-lg bg-indigo-500/[0.04] border border-indigo-500/15 px-3 py-2.5">
                  <p className="text-[11px] text-text-muted leading-relaxed">{showMeasureModal.desc}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest">Detalles de la implementacion</p>
                  {(showMeasureModal.fields || []).map((field, fi) => (
                    <div key={fi}>
                      <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">{field.label}</label>
                      {field.type === 'select' && (
                        <select value={measureForm[field.key] || ''} onChange={e => setMeasureForm(f => ({...f, [field.key]: e.target.value}))}
                          className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all">
                          <option value="">Seleccionar...</option>
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                      {field.type === 'text' && (
                        <input value={measureForm[field.key] || ''} onChange={e => setMeasureForm(f => ({...f, [field.key]: e.target.value}))} placeholder={field.placeholder || ''}
                          className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
                      )}
                      {field.type === 'url' && (
                        <input type="url" value={measureForm[field.key] || ''} onChange={e => setMeasureForm(f => ({...f, [field.key]: e.target.value}))} placeholder="https://..."
                          className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle" />
                      )}
                      {field.type === 'date' && (
                        <input type="date" value={measureForm[field.key] || ''} onChange={e => setMeasureForm(f => ({...f, [field.key]: e.target.value}))}
                          className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/[0.04] pt-3">
                  <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Notas adicionales</label>
                  <textarea value={measureForm.notes || ''} onChange={e => setMeasureForm(f => ({...f, notes: e.target.value}))} placeholder="Comentarios o detalles extra..." rows={2}
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-subtle transition-all placeholder-text-subtle resize-none" />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowMeasureModal(null)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-bg-elevated hover:bg-bg-elevated text-text-body border border-border-theme transition-all">Cancelar</button>
                  <button type="submit" disabled={savingMeasure}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-all disabled:opacity-30 disabled:pointer-events-none">
                    {savingMeasure ? 'Guardando...' : 'Marcar como Completado'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

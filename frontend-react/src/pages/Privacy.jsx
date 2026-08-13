import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataCache';
import { useI18n } from '../i18n/context';

const I = {
  shield: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  users: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  eye: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  edit: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  trash: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  check: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  xmark: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  download: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  search: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  info: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  lock: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  clock: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  plus: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
};

const arcoRights = [
  { id: 'acceso', icon: I.eye, title: 'Acceso', desc: 'El titular puede solicitar conocer qué datos personales tuyos están siendo tratados, con qué finalidad, el origen de los datos y si han sido comunicados a terceros.', art: 'Art. 8', formFields: ['specificData'] },
  { id: 'rectificacion', icon: I.edit, title: 'Rectificación', desc: 'El titular puede solicitar la corrección de datos inexactos, incompletos o desactualizados que consten en las bases del responsable.', art: 'Art. 9', formFields: ['specificData', 'newData'] },
  { id: 'supresion', icon: I.trash, title: 'Supresión', desc: 'El titular puede solicitar la eliminación de sus datos cuando ya no sean necesarios para los fines que justificaron su tratamiento, salvo obligación legal de conservación.', art: 'Art. 10', formFields: ['specificData'] },
  { id: 'oposicion', icon: I.xmark, title: 'Oposición', desc: 'El titular puede oponerse al tratamiento de sus datos para fines específicos, como marketing directo o elaboración de perfiles.', art: 'Art. 11', formFields: ['purpose'] },
  { id: 'portabilidad', icon: I.download, title: 'Portabilidad', desc: 'El titular puede solicitar recibir sus datos en un formato estructurado y de uso común, y transmitirlos a otro responsable.', art: 'Art. 13', formFields: ['specificData', 'thirdPartyRecipients'] },
];

export default function Privacy() {
  const { t } = useI18n();
  const cache = useDataCache();
  const [activeTab, setActiveTab] = useState('arco');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [consents, setConsents] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [arcoReqs, setArcoReqs] = useState([]);
  const [config, setConfig] = useState(null);
  const [editingUrl, setEditingUrl] = useState(null);
  const [urlValue, setUrlValue] = useState('');
  const [msg, setMsg] = useState(null);
  const [respondId, setRespondId] = useState(null);
  const [respondText, setRespondText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ tipo: 'acceso', titularName: '', titularEmail: '', specificData: '' });

  const { token } = useAuth();

  function populateFromData(data) {
    setStats(data.stats);
    setConsents(Array.isArray(data.consents) ? data.consents : []);
    setInventory(Array.isArray(data.inventory) ? data.inventory : []);
    if (data.config) setConfig(data.config);
    setArcoReqs(Array.isArray(data.arcoRequests) ? data.arcoRequests : []);
    setLoading(false);
  }

  function fetchAll() {
    if (!token) { setLoading(false); return; }
    fetch('/api/invisia/compliance/overview?token=' + token).then(r => r.json()).then(data => {
      if (data?.error === 'token inválido' || data?.error === 'token requerido') {
        if (!window.__sessionExpiredFired) { window.__sessionExpiredFired = true; window.dispatchEvent(new CustomEvent('session-expired')); }
        return;
      }
      if (data && !data.error) {
        cache.set('compliance_overview', data);
        try { localStorage.setItem('cache_compliance_overview', JSON.stringify(data)); } catch {}
        populateFromData(data);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }

  useEffect(() => {
    let restored = false;
    const cached = cache.get('compliance_overview');
    if (cached) { populateFromData(cached); restored = true; }
    else {
      try {
        const ls = localStorage.getItem('cache_compliance_overview');
        if (ls) { const p = JSON.parse(ls); if (p) { populateFromData(p); restored = true; } }
      } catch {}
    }
    fetchAll();
  }, []);

  const totalRequests = arcoReqs.length;
  const totalCompleted = arcoReqs.filter(r => r.status === 'completed').length;
  const totalPending = arcoReqs.filter(r => r.status === 'pending' || r.status === 'in_progress').length;
  const avgDays = totalCompleted > 0 ? arcoReqs.filter(r => r.status === 'completed' && r.completedAt && r.submittedAt).reduce((sum, r) => {
    return sum + Math.round((new Date(r.completedAt) - new Date(r.submittedAt)) / 86400000);
  }, 0) / totalCompleted : 0;

  const consentPurposes = consents.reduce((acc, c) => {
    const p = c.purpose || 'Sin finalidad';
    if (!acc[p]) acc[p] = { active: 0, revoked: 0 };
    if (c.revokedAt) acc[p].revoked++;
    else acc[p].active++;
    return acc;
  }, {});

  const rightsStatus = arcoRights.map(right => {
    const related = arcoReqs.filter(r => r.tipo === right.id);
    const completed = related.filter(r => r.status === 'completed').length;
    const pending = related.filter(r => r.status === 'pending' || r.status === 'in_progress').length;
    const avg = completed > 0 ? related.filter(r => r.status === 'completed' && r.completedAt && r.submittedAt).reduce((s, r) => {
      return s + Math.round((new Date(r.completedAt) - new Date(r.submittedAt)) / 86400000);
    }, 0) / completed : 0;
    return { right: right.id, requests: related.length, completed, pending, avgDays: Math.round(avg) || 0 };
  });

  function saveArcoUrl(rightId) {
    if (!token) return;
    const body = new URLSearchParams({ token, [`arcoUrls.${rightId}`]: urlValue });
    fetch('/api/invisia/compliance/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }).then(r => r.json()).then(data => {
      if (data.error) { setMsg({ type: 'error', text: data.error }); return; }
      setMsg({ type: 'success', text: `URL de ${rightId} actualizada` });
      setEditingUrl(null);
      setUrlValue('');
      fetchAll();
    }).catch(() => setMsg({ type: 'error', text: 'Error al guardar' }));
  }

  function handleRespond(id, status) {
    if (!token || !respondText.trim()) return;
    const endpoint = status === 'completed' ? 'respond' : 'reject';
    const body = new URLSearchParams({ token, response: respondText });
    fetch(`/api/invisia/compliance/arco-requests/${id}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }).then(r => r.json()).then(data => {
      if (data.error) { setMsg({ type: 'error', text: data.error }); return; }
      setMsg({ type: 'success', text: 'Solicitud actualizada' });
      setRespondId(null);
      setRespondText('');
      fetchAll();
    }).catch(() => setMsg({ type: 'error', text: 'Error al actualizar' }));
  }

  const tabs = [
    { id: 'arco', label: 'Derechos ARCO', icon: I.shield },
    { id: 'consents', label: 'Consentimientos', icon: I.check },
    { id: 'requests', label: 'Solicitudes', icon: I.edit },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="text-sm text-text-muted">Cargando datos de privacidad...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="sticky top-0 z-30 bg-bg-base border-b border-border-theme flex-shrink-0">
        <div className="flex items-center justify-between px-3 md:px-6 py-3">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-bg-panel border border-border-theme flex items-center justify-center text-emerald-400 flex-shrink-0">
                {I.lock}
              </div>
              <div className="min-w-0">
                <h1 className="text-[12px] md:text-[13px] font-semibold text-white tracking-wide truncate">PRIVACIDAD</h1>
                <p className="text-[9px] md:text-[10px] text-text-muted truncate">Portal de derechos ARCO y gestión de privacidad</p>
              </div>
            </div>
            <div className="h-7 w-px bg-bg-elevated hidden md:block" />
            <nav className="hidden md:flex gap-0.5">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                      isActive ? 'bg-bg-panel text-text-heading' : 'text-text-muted hover:text-text-body hover:bg-bg-panel'
                    }`}>
                    <span className={isActive ? 'text-emerald-400' : 'text-text-subtle'}>{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto theme-scrollbar">
        {msg && (
          <div className={`px-6 py-2 text-[11px] ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-b border-red-500/20'}`}>
            {msg.text}
            <button onClick={() => setMsg(null)} className="ml-3 opacity-60 hover:opacity-100">{I.xmark}</button>
          </div>
        )}

        {activeTab === 'arco' && (
          <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-200">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.3)]" />
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-cyan-400">{I.eye}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Solicitudes Totales</span>
                </div>
                <p className="text-[26px] font-bold leading-none tracking-tight text-text-heading">{totalRequests}</p>
                <p className="text-[10px] text-text-subtle mt-2">{totalCompleted} completadas · {totalPending} pendientes</p>
              </div>
              <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-200">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.3)]" />
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-emerald-400">{I.check}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Completadas</span>
                </div>
                <p className="text-[26px] font-bold leading-none tracking-tight text-emerald-400">{totalCompleted}</p>
                <p className="text-[10px] text-text-subtle mt-2">{totalRequests > 0 ? Math.round(totalCompleted / totalRequests * 100) : 0}% tasa de resolución</p>
              </div>
              <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-5 relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-200">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.3)]" />
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-yellow-400">{I.clock}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Tiempo Promedio</span>
                </div>
                <p className="text-[26px] font-bold leading-none tracking-tight text-yellow-400">{Math.round(avgDays)} días</p>
                <p className="text-[10px] text-text-subtle mt-2">Plazo legal: 10 días hábiles</p>
              </div>
              <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-5 relative overflow-hidden group hover:border-red-500/30 transition-all duration-200">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.3)]" />
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-red-400">{I.xmark}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Pendientes</span>
                </div>
                <p className="text-[26px] font-bold leading-none tracking-tight text-red-400">{totalPending}</p>
                <p className="text-[10px] text-text-subtle mt-2">Requieren atención inmediata</p>
              </div>
            </div>

            <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[15px] font-semibold text-text-heading">Derechos ARCO + Portabilidad</h3>
                  <p className="text-[12px] text-text-muted mt-1">Ley 21.719 establece 5 derechos fundamentales que los titulares pueden ejercer. Selecciona un derecho para enviar una solicitud.</p>
                </div>
                <p className="text-[10px] text-text-subtle font-medium">Configura las URLs externas para cada derecho ARCO</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                {arcoRights.map(right => {
                  const url = config?.arcoUrls?.[right.id] || '';
                  return (
                    <div key={right.id} className="bg-bg-base/40 border border-border-theme/25 rounded-lg p-5 hover:border-emerald-500/30 hover:bg-bg-panel/60 transition-all duration-200 group">
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">{right.icon}</div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-[13px] font-semibold text-text-heading">{right.title}</h4>
                        <span className="text-[9px] text-emerald-500 font-mono">{right.art}</span>
                      </div>
                      <p className="text-[12px] text-text-muted leading-relaxed mb-3">{right.desc}</p>
                      {editingUrl === right.id ? (
                        <div className="space-y-2">
                          <input value={urlValue} onChange={e => setUrlValue(e.target.value)}
                            className="w-full bg-bg-base border border-border-theme text-[10px] text-white rounded px-2 py-1 focus:outline-none focus:border-emerald-500/50 placeholder-text-subtle" placeholder="https://ejemplo.cl/supresion" />
                          <div className="flex gap-1">
                            <button onClick={() => saveArcoUrl(right.id)}
                              className="px-2 py-0.5 text-[9px] font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20">Guardar</button>
                            <button onClick={() => { setEditingUrl(null); setUrlValue(''); }}
                              className="px-2 py-0.5 text-[9px] text-text-muted hover:text-text-body">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer"
                              className="block text-[10px] text-cyan-400 hover:text-cyan-300 truncate">{url}</a>
                          ) : (
                            <p className="text-[10px] text-text-subtle italic">Sin URL configurada</p>
                          )}
                          <button onClick={() => { setEditingUrl(right.id); setUrlValue(url); }}
                            className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
                            {url ? 'Editar URL →' : 'Configurar URL →'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rightsStatus.map(rs => {
                const right = arcoRights.find(r => r.id === rs.right);
                const pct = rs.requests > 0 ? Math.round(rs.completed / rs.requests * 100) : 0;
                return (
                  <div key={rs.right} className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-5 hover:border-emerald-500/30 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-bg-elevated/60 border border-border-theme/40 flex items-center justify-center text-text-muted">{right?.icon}</div>
                      <div>
                        <h4 className="text-[12px] font-semibold text-text-heading">{right?.title}</h4>
                        <p className="text-[10px] text-text-subtle">{right?.art}</p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <span className="text-[22px] font-bold text-text-heading">{rs.requests}</span>
                        <span className="text-[11px] text-text-muted ml-1">solicitudes</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-text-muted">Promedio: </span>
                        <span className="text-[13px] font-semibold text-yellow-400">{rs.avgDays} días</span>
                      </div>
                    </div>
                    <div className="w-full bg-bg-elevated/50 rounded-full h-1.5 mb-3">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-medium">{rs.completed} completadas</span>
                      <span className="text-text-subtle">{rs.pending} pendientes</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'consents' && (
          <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
            <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-3 md:p-6">
              <h3 className="text-[15px] font-semibold text-white mb-1">Gestión de Consentimientos</h3>
              <p className="text-[12px] text-text-muted mb-5">El consentimiento debe ser libre, específico, informado e inequívoco (Art. 12). Cada finalidad requiere un consentimiento separado.</p>
              {Object.keys(consentPurposes).length === 0 ? (
                <p className="text-[12px] text-text-subtle text-center py-8">No hay consentimientos registrados. Los consentimientos se generan al escanear bases de datos con el agente.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(consentPurposes).map(([purpose, counts]) => (
                    <div key={purpose} className="flex items-center justify-between px-4 py-3 rounded-lg bg-bg-base/40 border border-border-theme/25 hover:border-emerald-500/30 hover:bg-bg-panel/60 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${counts.active > 0 ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                        <span className="text-[12px] text-text-body font-medium">{purpose}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[13px] font-semibold text-emerald-400">{counts.active}</span>
                          <span className="text-[10px] text-text-subtle ml-1">activos</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-semibold text-red-400">{counts.revoked}</span>
                          <span className="text-[10px] text-text-subtle ml-1">revocados</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-6">
              <h4 className="text-[13px] font-semibold text-white mb-4">Requisitos del Consentimiento según Ley 21.719</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Libre', desc: 'Sin coerción ni condicionamiento para acceder al servicio principal', icon: I.shield },
                  { label: 'Específico', desc: 'Finalidad determinada, explícita y legítima. No se puede usar para fines distintos', icon: I.search },
                  { label: 'Informado', desc: 'El titular debe conocer qué datos, para qué, por cuánto tiempo y con quién se compartirán', icon: I.eye },
                  { label: 'Inequívoco', desc: 'Acción positiva clara (checked, firma). No válido el silencio o inacción', icon: I.check },
                  { label: 'Revocable', desc: 'El titular puede revocar en cualquier momento, con las mismas facilidades que lo otorgó', icon: I.clock },
                  { label: 'Separado por Finalidad', desc: 'Cada finalidad requiere su propio consentimiento, no se pueden agrupar', icon: I.lock },
                ].map((req, i) => (
                  <div key={i} className="bg-bg-base/40 border border-border-theme/25 rounded-lg p-4 hover:border-emerald-500/30 hover:bg-bg-panel/60 transition-all duration-200 group">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-emerald-400 group-hover:text-emerald-300 transition-colors">{req.icon}</span>
                      <h5 className="text-[12px] font-semibold text-text-heading">{req.label}</h5>
                    </div>
                    <p className="text-[11px] text-text-muted">{req.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
            <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-text-heading">Solicitudes de Titulares</h3>
                <p className="text-[12px] text-text-muted mt-1">Registro y gestión de solicitudes de derechos ARCO — basado en datos reales del portal</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                  <span>{I.plus}</span>
                  Nueva Solicitud
                </button>
                <div className="relative">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                    className="w-52 bg-bg-base border border-border-theme/25 text-[12px] text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500/50 placeholder-text-subtle" />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle">{I.search}</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-bg-base/60 border-b border-border-theme/50">
                      <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-left">Tipo</th>
                      <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-left">Titular</th>
                      <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-left">Email</th>
                      <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-left">Fecha</th>
                      <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-left">Estado</th>
                      <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-left">Vencimiento</th>
                      <th className="text-[10px] uppercase tracking-wider text-text-muted font-semibold py-3 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arcoReqs.filter(r => !search ||
                      r.titularName?.toLowerCase().includes(search.toLowerCase()) ||
                      r.titularEmail?.toLowerCase().includes(search.toLowerCase()) ||
                      r.tipo?.toLowerCase().includes(search.toLowerCase())
                    ).map((req, i) => {
                      const right = arcoRights.find(r => r.id === req.tipo);
                      const isOverdue = req.deadline && new Date(req.deadline) < new Date() && req.status !== 'completed' && req.status !== 'rejected';
                      return (
                        <tr key={req._id || i} className="border-t border-border-theme/30 hover:bg-bg-base/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{right?.title || req.tipo}</span>
                          </td>
                          <td className="py-3.5 px-4 text-text-body text-[12px]">{req.titularName || '-'}</td>
                          <td className="py-3.5 px-4 text-text-muted text-[12px] font-mono">{req.titularEmail || '-'}</td>
                          <td className="py-3.5 px-4 text-text-muted text-[12px]">{req.submittedAt ? new Date(req.submittedAt).toLocaleDateString('es-CL') : '-'}</td>
                          <td className="py-3.5 px-4">
                            {req.status === 'completed'
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{I.check} Completada</span>
                              : req.status === 'rejected'
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border bg-red-500/10 text-red-400 border-red-500/20">{I.xmark} Rechazada</span>
                              : req.status === 'in_progress'
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border bg-blue-500/10 text-blue-400 border-blue-500/20">En Progreso</span>
                              : <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">{I.clock} Pendiente</span>
                            }
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[12px] ${isOverdue ? 'text-red-400 font-medium' : 'text-text-muted'}`}>
                              {req.deadline ? new Date(req.deadline).toLocaleDateString('es-CL') : '-'}
                              {isOverdue ? ' ⚠ Vencido' : ''}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {respondId === req._id ? (
                              <div className="flex items-center gap-2">
                                <input value={respondText} onChange={e => setRespondText(e.target.value)} placeholder="Respuesta..."
                                  className="w-28 bg-bg-base border border-border-theme/25 text-[10px] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500/50 placeholder-text-subtle" />
                                <button onClick={() => handleRespond(req._id, 'completed')}
                                  className="px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20">Aprobar</button>
                                <button onClick={() => handleRespond(req._id, 'rejected')}
                                  className="px-2 py-1 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">Rechazar</button>
                                <button onClick={() => { setRespondId(null); setRespondText(''); }}
                                  className="text-text-subtle hover:text-text-muted">{I.xmark}</button>
                              </div>
                            ) : req.status !== 'completed' && req.status !== 'rejected' ? (
                              <button onClick={() => setRespondId(req._id)}
                                className="px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                                Gestionar
                              </button>
                            ) : (
                              <span className="text-[10px] text-text-subtle">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {arcoReqs.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-8 text-[12px] text-text-subtle">No hay solicitudes ARCO registradas. Los titulares pueden enviar solicitudes desde el panel de Derechos ARCO.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-bg-panel/60 border border-border-theme/25 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg-elevated/60 border border-border-theme/40 flex items-center justify-center text-emerald-400 flex-shrink-0">{I.info}</div>
                <div>
                  <p className="text-[12px] text-text-body font-medium mb-2">Plazos Legales para Responder Solicitudes</p>
                  <p className="text-[11px] text-text-subtle leading-relaxed">La Ley 21.719 establece que debes responder las solicitudes de derechos ARCO en un plazo máximo de <span className="text-text-body font-medium">10 días hábiles</span>, prorrogables por 10 días adicionales en caso de complejidad justificada. La falta de respuesta dentro del plazo constituye una infracción gravísima sancionable por la APDP.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <div className="bg-bg-panel border border-border-theme rounded-xl p-4 md:p-6 w-full max-w-[420px] mx-3 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-[14px] font-semibold text-white mb-4">Nueva Solicitud ARCO</h3>
              <div className="space-y-3">
                <select value={formData.tipo} onChange={e => setFormData(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500/50">
                  {arcoRights.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
                <input value={formData.titularName} onChange={e => setFormData(f => ({ ...f, titularName: e.target.value }))} placeholder="Nombre del titular"
                  className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500/50 placeholder-text-subtle" />
                <input value={formData.titularEmail} onChange={e => setFormData(f => ({ ...f, titularEmail: e.target.value }))} placeholder="Email del titular"
                  className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500/50 placeholder-text-subtle" />
                <textarea value={formData.specificData} onChange={e => setFormData(f => ({ ...f, specificData: e.target.value }))} placeholder="Datos específicos de la solicitud"
                  className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500/50 placeholder-text-subtle min-h-[80px]" />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-lg text-text-muted hover:text-text-heading border border-border-theme hover:bg-bg-elevated transition-colors">Cancelar</button>
                <button onClick={() => {
                  const body = new URLSearchParams({ token, ...formData });
                  fetch('/api/invisia/compliance/arco-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body,
                  }).then(r => r.json()).then(data => {
                    if (data.error) { setMsg({ type: 'error', text: data.error }); return; }
                    setMsg({ type: 'success', text: 'Solicitud creada correctamente' });
                    setShowForm(false);
                    fetchAll();
                  }).catch(() => setMsg({ type: 'error', text: 'Error al crear solicitud' }));
                }}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">Crear Solicitud</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

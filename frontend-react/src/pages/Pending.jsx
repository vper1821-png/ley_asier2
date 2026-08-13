import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';

const I = {
  check: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  clock: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  xmark: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  alert: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
  bank: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3"/></svg>,
  send: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>,
  coin: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  ticket: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>,
  document: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  eye: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
};

const STATUS_CONFIG = {
  pending_approval: {
    bg: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20',
    icon: I.clock,
    iconBg: 'bg-yellow-500/20 text-yellow-400',
    title: 'Cuenta Pendiente de Aprobación',
    desc: 'Tu solicitud de registro está siendo revisada por el administrador. Una vez aprobada, podrás acceder al panel de control.',
  },
  preapproved: {
    bg: 'from-blue-500/10 to-cyan-500/5 border-blue-500/20',
    icon: I.bank,
    iconBg: 'bg-blue-500/20 text-blue-400',
    title: 'Cuenta Preaprobada',
    desc: 'Realiza el pago mensual para activar tu cuenta. Revisa los datos bancarios e ingresa el concepto de transferencia.',
  },
  active: {
    bg: 'from-emerald-500/10 to-green-500/5 border-emerald-500/20',
    icon: I.check,
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    title: 'Cuenta Activa',
    desc: 'Tu cuenta está activa. Redirigiendo al panel de control...',
  },
  suspended: {
    bg: 'from-red-500/10 to-red-600/5 border-red-500/20',
    icon: I.alert,
    iconBg: 'bg-red-500/20 text-red-400',
    title: 'Cuenta Suspendida',
    desc: 'Tu cuenta ha sido suspendida. Contacta al administrador para regularizar tu situación.',
  },
  cancelled: {
    bg: 'from-gray-500/10 to-gray-600/5 border-gray-500/20',
    icon: I.xmark,
    iconBg: 'bg-gray-500/20 text-text-muted',
    title: 'Cuenta Cancelada',
    desc: 'Tu cuenta ha sido cancelada. Contacta al administrador para más información.',
  },
};

export default function Pending() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [concept, setConcept] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [survey, setSurvey] = useState({
    billingRange: '',
    employeeCount: '',
    lawKnown: '',
    dataTypes: [],
    hasConsentDocs: '',
    receivedArco: '',
  });
  const [surveySaved, setSurveySaved] = useState(false);
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [surveyMsg, setSurveyMsg] = useState('');

  // Ticket form
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketMsg, setTicketMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    loadInfo();
    const interval = setInterval(loadInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data?.user?.paymentStatus === 'active') {
      const t = setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
      return () => clearTimeout(t);
    }
  }, [data?.user?.paymentStatus]);

  useEffect(() => {
    if (showPayModal && data?.user) {
      const now = new Date();
      const _d = `Pago mensual ${now.getMonth()+1}/${now.getFullYear()} - ${data.user.companyName || ''}${data.user.bankDetails?.rut ? ' - RUT '+data.user.bankDetails.rut : ''}`;
      setConcept(_d);
    }
  }, [showPayModal]);

  async function loadInfo() {
    const res = await api.getMyPaymentInfo(token);
    if (!res.error) setData(res);
    setLoading(false);
  }

  async function handleSubmitPayment() {
    if (!concept.trim()) { setMsg('Debes ingresar un concepto'); return; }
    setSubmitting(true);
    setMsg('');
    const now = new Date();
    const res = await api.submitPayment(token, now.getMonth() + 1, now.getFullYear(), data?.user?.customPrice || 0, concept.trim());
    if (res.error) setMsg(res.error);
    else {
      setMsg('Pago registrado correctamente. El administrador verificará el pago.');
      setShowPayModal(false);
      setConcept('');
      loadInfo();
    }
    setSubmitting(false);
  }

  async function handleCreateTicket() {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) return;
    setTicketSending(true);
    setTicketMsg('');
    const res = await api.createSupportTicket(token, ticketForm.subject, ticketForm.description, ticketForm.priority);
    if (res.error) setTicketMsg(res.error);
    else {
      setTicketMsg('Ticket creado correctamente. Te responderemos a la brevedad.');
      setTicketForm({ subject: '', description: '', priority: 'medium' });
      setShowTicketForm(false);
    }
    setTicketSending(false);
  }

  const handleSurveyChange = (key, value) => setSurvey(prev => ({ ...prev, [key]: value }));
  const toggleDataType = (type) => {
    setSurvey(prev => {
      const current = prev.dataTypes || [];
      if (current.includes(type)) return { ...prev, dataTypes: current.filter(t => t !== type) };
      return { ...prev, dataTypes: [...current, type] };
    });
  };
  const submitSurvey = async () => {
    setSavingSurvey(true);
    setSurveyMsg('');
    try {
      const res = await fetch('/api/onboarding/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, step: 5, data: survey }) });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSurveyMsg('Respuestas guardadas correctamente.');
      setSurveySaved(true);
    } catch (e) { setSurveyMsg(e.message || 'Error al guardar'); }
    setSavingSurvey(false);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <span className="text-[12px] text-text-muted">Cargando...</span>
        </div>
      </div>
    );
  }

  const userData = data?.user || user;
  const st = STATUS_CONFIG[userData?.paymentStatus] || STATUS_CONFIG.pending_approval;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <header className="border-b border-border-theme">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-bg-panel">
              <img src="/logo-nuevo.png" alt="SecureLab" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-text-heading">SecureLab</h1>
              <p className="text-[10px] text-text-subtle">Cumplimiento ley 21.719</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-text-muted hidden sm:inline">{userData?.email}</span>
            <button onClick={handleLogout}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-red-900/10 border border-red-800/20 text-red-400 hover:bg-red-900/20 transition-all">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">

          {/* Status Card */}
          <div className={`relative overflow-hidden rounded-2xl border p-6 bg-gradient-to-br ${st.bg}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-bg-panel rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-bg-panel rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${st.iconBg}`}>
                {st.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-bold text-text-heading">{st.title}</h2>
                <p className="text-[12px] text-text-muted mt-1 leading-relaxed">{st.desc}</p>
                {userData?.companyName && (
                  <p className="text-[11px] text-text-muted mt-2">
                    {userData.companyName}{userData.bankDetails?.rut ? ` • RUT ${userData.bankDetails.rut}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Onboarding Survey */}
          {!surveySaved && (
            <div className="bg-bg-panel/60 border border-border-theme/25 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border-b border-border-theme/25 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">?</div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-text-heading">Ayúdanos a conocer tu empresa</h3>
                    <p className="text-[11px] text-text-muted">Completa este breve cuestionario sobre tu negocio y la Ley 21.719</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[11px] text-text-muted font-medium mb-1.5 block">¿Facturación aproximada mensual?</label>
                  <select value={survey.billingRange} onChange={e => handleSurveyChange('billingRange', e.target.value)}
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500/50">
                    <option value="">Selecciona...</option>
                    <option value="<10m">Menos de 10 millones CLP</option>
                    <option value="10m-50m">10 - 50 millones CLP</option>
                    <option value="50m-200m">50 - 200 millones CLP</option>
                    <option value="200m+">Más de 200 millones CLP</option>
                    <option value="no_answer">Prefiero no decirlo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-text-muted font-medium mb-1.5 block">¿Cuántos empleados tienes?</label>
                  <select value={survey.employeeCount} onChange={e => handleSurveyChange('employeeCount', e.target.value)}
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500/50">
                    <option value="">Selecciona...</option>
                    <option value="1-10">1 - 10</option>
                    <option value="11-50">11 - 50</option>
                    <option value="51-200">51 - 200</option>
                    <option value="201-1000">201 - 1000</option>
                    <option value="1000+">Más de 1000</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-text-muted font-medium mb-1.5 block">¿Conocías la Ley 21.719 de Protección de Datos Personales?</label>
                  <select value={survey.lawKnown} onChange={e => handleSurveyChange('lawKnown', e.target.value)}
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500/50">
                    <option value="">Selecciona...</option>
                    <option value="yes">Sí, la conozco</option>
                    <option value="heard">He escuchado de ella</option>
                    <option value="no">No la conocía</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-text-muted font-medium mb-1.5 block">¿Qué tipos de datos personales manejas?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Clientes', 'Empleados', 'Proveedores', 'Menores de edad', 'Datos sensibles', 'Otros'].map(t => (
                      <label key={t} className="flex items-center gap-2 text-[12px] text-text-body">
                        <input type="checkbox" checked={survey.dataTypes.includes(t)} onChange={() => toggleDataType(t)}
                          className="rounded border-border-theme bg-bg-base text-cyan-500 focus:ring-cyan-500/20" />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-text-muted font-medium mb-1.5 block">¿Ya tienes consentimientos o documentación de protección de datos?</label>
                  <select value={survey.hasConsentDocs} onChange={e => handleSurveyChange('hasConsentDocs', e.target.value)}
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500/50">
                    <option value="">Selecciona...</option>
                    <option value="yes">Sí</option>
                    <option value="partial">Parcialmente</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-text-muted font-medium mb-1.5 block">¿Has recibido solicitudes ARCO (acceso, rectificación, cancelación u oposición)?</label>
                  <select value={survey.receivedArco} onChange={e => handleSurveyChange('receivedArco', e.target.value)}
                    className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500/50">
                    <option value="">Selecciona...</option>
                    <option value="yes">Sí</option>
                    <option value="no">No</option>
                    <option value="unknown">No estoy seguro</option>
                  </select>
                </div>
                {surveyMsg && (
                  <div className={`flex items-center gap-2 px-4 py-3 text-[12px] rounded-xl ${surveyMsg.includes('correctamente') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <span>{surveyMsg.includes('correctamente') ? I.check : I.alert}</span>
                    <span className="flex-1">{surveyMsg}</span>
                  </div>
                )}
                <button onClick={submitSurvey} disabled={savingSurvey}
                  className="w-full py-3 text-[13px] font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  {savingSurvey ? 'Guardando...' : 'Guardar respuestas'}
                </button>
              </div>
            </div>
          )}

                    {data?.user?.paymentStatus === 'preapproved' && data?.user?.bankDetails?.bankName && (
            <>
              {/* Bank Details */}
              <div className="bg-bg-panel/60 border border-border-theme/25 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border-theme/25 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">{I.bank}</div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-text-heading">Datos Bancarios</h3>
                      <p className="text-[11px] text-text-muted">Realiza la transferencia a la siguiente cuenta</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Banco', value: data.user.bankDetails.bankName },
                      { label: 'Tipo Cuenta', value: data.user.bankDetails.accountType === 'corriente' ? 'Cuenta Corriente' : data.user.bankDetails.accountType === 'vista' ? 'Cuenta Vista' : data.user.bankDetails.accountType === 'ahorro' ? 'Cuenta de Ahorro' : data.user.bankDetails.accountType === 'rut' ? 'Cuenta RUT' : data.user.bankDetails.accountType },
                      { label: 'N° Cuenta', value: data.user.bankDetails.accountNumber, mono: true },
                      { label: 'RUT', value: data.user.bankDetails.rut, mono: true },
                    ].map((item, i) => (
                      <div key={i} className="bg-bg-base/60 border border-border-theme/25 rounded-xl p-4">
                        <p className="text-[9px] text-text-subtle uppercase tracking-wider font-semibold mb-1.5">{item.label}</p>
                        <p className={`text-[14px] ${item.mono ? 'font-mono' : 'font-semibold'} text-white`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {data?.adminBankDetails?.email && (
                    <div className="bg-bg-base/60 border border-border-theme/25 rounded-xl p-4 mb-4">
                      <p className="text-[9px] text-text-subtle uppercase tracking-wider font-semibold mb-1.5">Correo</p>
                      <p className="text-[14px] font-semibold text-text-heading">{data.adminBankDetails.email}</p>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Monto Mensual</p>
                      <p className="text-[24px] font-bold text-white tracking-tight">${data.user.customPrice > 0 ? data.user.customPrice : (data.user.planType === 'Free' ? 'Gratuito' : data.user.planType || 'Free')} <span className="text-[14px] text-text-muted font-normal">{data.user.customPrice > 0 ? 'UF' : ''}</span></p>
                    </div>
                    <button onClick={() => setShowPayModal(true)}
                      className="px-6 py-3 text-[13px] font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/20 transition-all duration-200 flex items-center gap-2.5">
                      {I.send}
                      Marcar como Pagado
                    </button>
                  </div>
                  <div className="mt-4 bg-bg-base/60 border border-border-theme/25 rounded-xl p-4">
                    <p className="text-[9px] text-text-subtle uppercase tracking-wider font-semibold mb-1.5">Concepto sugerido</p>
                    <p className="text-[13px] font-mono text-cyan-400 break-all">
                      {`Pago mensual ${new Date().getMonth()+1}/${new Date().getFullYear()} - ${data.user.companyName || ''}${data.user.bankDetails?.rut ? ' - RUT '+data.user.bankDetails.rut : ''}`}
                    </p>
                  </div>
                </div>
              </div>

              {msg && (
                <div className={`flex items-center gap-2 px-4 py-3 text-[12px] rounded-xl ${
                  msg.includes('correctamente') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  <span>{msg.includes('correctamente') ? I.check : I.alert}</span>
                  <span className="flex-1">{msg}</span>
                  <button onClick={() => setMsg('')} className="opacity-60 hover:opacity-100">{I.xmark}</button>
                </div>
              )}
            </>
          )}

          {/* Pending Payments */}
          {data?.pendingPayments?.length > 0 && (
            <div className="bg-bg-panel/40 border border-border-theme rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border-b border-border-theme px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">{I.clock}</div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-text-heading">Pagos Pendientes</h3>
                    <p className="text-[11px] text-yellow-400/70">{data.pendingPayments.length} pago{data.pendingPayments.length > 1 ? 's' : ''} por regularizar</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {data.pendingPayments.map(p => (
                  <div key={p._id} className="flex items-center justify-between bg-bg-base/40 border border-border-theme rounded-xl px-5 py-4 hover:border-yellow-500/20 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/15 text-yellow-400 flex items-center justify-center">{I.clock}</div>
                      <div>
                        <span className="text-[13px] font-semibold text-text-heading">{p.month}/{p.year}</span>
                        {p.concept && <p className="text-[11px] text-text-muted mt-0.5">{p.concept}</p>}
                      </div>
                    </div>
                    <span className="text-[16px] font-bold text-text-heading">${p.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support Section */}
          <div className="bg-bg-panel/60 border border-border-theme/25 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/5 border-b border-border-theme/25 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">{I.ticket}</div>
                <div>
                  <h3 className="text-[14px] font-semibold text-text-heading">Soporte</h3>
                  <p className="text-[11px] text-text-muted">¿Tienes dudas? Crea un ticket de soporte</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {!showTicketForm ? (
                <button onClick={() => setShowTicketForm(true)}
                  className="w-full py-3 px-4 text-[12px] font-medium rounded-xl bg-bg-elevated/50 border border-dashed border-surface-600 text-text-muted hover:text-text-heading hover:border-surface-500 hover:bg-bg-elevated transition-all flex items-center justify-center gap-2">
                  {I.document}
                  Crear Ticket de Soporte
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-text-muted font-medium mb-1.5 block">Asunto</label>
                    <input type="text" value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500/50 placeholder-text-subtle"
                      placeholder="Ej: Problema con el pago" />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-muted font-medium mb-1.5 block">Descripción</label>
                    <textarea value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} rows={3}
                      className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500/50 placeholder-text-subtle resize-none"
                      placeholder="Describe tu problema en detalle..." />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-text-muted font-medium">Prioridad:</label>
                    <select value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))}
                      className="bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500/50">
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>
                  {ticketMsg && (
                    <div className={`flex items-center gap-2 px-4 py-2.5 text-[12px] rounded-xl ${
                      ticketMsg.includes('correctamente') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      <span>{ticketMsg.includes('correctamente') ? I.check : I.alert}</span>
                      <span className="flex-1">{ticketMsg}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setShowTicketForm(false); setTicketMsg(''); }}
                      className="px-4 py-2 text-[11px] text-text-muted hover:text-text-body transition-colors rounded-lg hover:bg-bg-elevated">
                      Cancelar
                    </button>
                    <button onClick={handleCreateTicket} disabled={ticketSending || !ticketForm.subject.trim() || !ticketForm.description.trim()}
                      className="px-5 py-2 text-[11px] font-semibold rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
                      {ticketSending ? 'Enviando...' : <><span>{I.send}</span> Enviar Ticket</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPayModal(false)} />
          <div className="relative bg-bg-panel border border-border-theme rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border-theme/25 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">{I.send}</div>
                <div>
                  <h3 className="text-[15px] font-semibold text-text-heading">Confirmar Pago</h3>
                  <p className="text-[11px] text-text-muted">Registra tu transferencia realizada</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-bg-base/60 border border-border-theme/25 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Monto</p>
                  <p className="text-[22px] font-bold text-text-heading">{(data?.user?.customPrice > 0 ? data?.user?.customPrice : (data?.user?.planType === 'Free' ? 'Gratuito' : data?.user?.planType || 'Free'))}{data?.user?.customPrice > 0 ? ' UF' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Período</p>
                  <p className="text-[13px] font-semibold text-text-heading">
                    {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[11px] text-text-muted font-medium mb-2">
                  <span className="text-cyan-400">{I.document}</span>
                  Concepto del Pago <span className="text-red-400">*</span>
                </label>
                <textarea value={concept} onChange={e => setConcept(e.target.value)} rows={2}
                  className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 placeholder-text-subtle resize-none"
                  placeholder="Ej: Pago mensual junio 2026 - SecureLab SpA - RUT 12.345.678-9" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowPayModal(false)}
                  className="px-5 py-2.5 text-[12px] text-text-muted hover:text-text-body transition-colors rounded-lg hover:bg-bg-elevated">
                  Cancelar
                </button>
                <button onClick={handleSubmitPayment} disabled={submitting || !concept.trim()}
                  className="px-6 py-2.5 text-[12px] font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {submitting ? (
                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Enviando...</>
                  ) : (
                    <><span>{I.check}</span> Confirmar Pago</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

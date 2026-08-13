import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import InfoTooltip from '../components/InfoTooltip';

const STATUS_STYLES = {
  pending_approval: {
    label: 'Pendiente de Aprobación',
    desc: 'El administrador está revisando tu solicitud.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  preapproved: {
    label: 'Preaprobado',
    desc: 'Revisa los datos bancarios y realiza el pago mensual.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-400',
    icon: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3',
  },
  active: {
    label: 'Cuenta Activa',
    desc: 'Todo al día. Realiza el pago mensual antes del vencimiento.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    icon: 'M5 13l4 4L19 7',
  },
  suspended: {
    label: 'Cuenta Suspendida',
    desc: 'Contacta al administrador para regularizar tu situación.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
  },
  cancelled: {
    label: 'Cuenta Cancelada',
    desc: 'Contacta al administrador para regularizar tu situación.',
    color: 'text-text-muted',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    dot: 'bg-gray-400',
    icon: 'M6 18L18 6M6 6l12 12',
  },
};

const PAYMENT_STATUS = {
  paid: { label: 'Pagado', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  pending: { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
  overdue: { label: 'Vencido', color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400' },
  cancelled: { label: 'Cancelado', color: 'text-text-muted', bg: 'bg-gray-500/10', dot: 'bg-gray-400' },
};

function StatusDot({ className = '' }) {
  return <span className={`w-1.5 h-1.5 rounded-full inline-block ${className}`} />;
}

function StatCard({ label, value, sub, color = '#e4e4e7' }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] px-4 py-3.5">
      <p className="text-[10px] text-text-subtle uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-[20px] font-bold leading-none tracking-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-text-subtle mt-1">{sub}</p>}
    </div>
  );
}

export default function PaymentsUser() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [concept, setConcept] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [ufValue, setUfValue] = useState(null);

  useEffect(() => {
    if (showPayModal && data?.user) {
      const now = new Date();
      setConcept(
        `Pago mensual ${now.getMonth() + 1}/${now.getFullYear()} - ${data.user.companyName || ''}${data.user.bankDetails?.rut ? ' - RUT ' + data.user.bankDetails.rut : ''}`
      );
    }
  }, [showPayModal]);

  const fetchUF = useCallback(async () => {
    try {
      const r = await fetch('https://mindicador.cl/api/uf');
      if (r.ok) { const d = await r.json(); if (d?.serie?.[0]?.valor) setUfValue(d.serie[0].valor); }
    } catch {}
  }, []);

  useEffect(() => {
    if (!token) return;
    api.getMyPaymentInfo(token).then((res) => {
      if (!res.error) setData(res);
    }).catch(() => {}).finally(() => setLoading(false));
    fetchUF();
  }, []);

  const handleSubmitPayment = async () => {
    if (!concept.trim()) { setMsg({ text: 'Debes ingresar un concepto', type: 'error' }); return; }
    setSubmitting(true);
    setMsg({ text: '', type: '' });
    const now = new Date();
    const res = await api.submitPayment(token, now.getMonth() + 1, now.getFullYear(), data?.user?.customPrice || 0, concept.trim());
    if (res.error) {
      setMsg({ text: res.error, type: 'error' });
    } else {
      setMsg({ text: 'Pago registrado correctamente. El administrador verificará el pago.', type: 'success' });
      setShowPayModal(false);
      setConcept('');
      const refreshed = await api.getMyPaymentInfo(token);
      if (!refreshed.error) setData(refreshed);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] text-text-muted">Cargando información de pagos...</p>
        </div>
      </div>
    );
  }

  const user = data?.user;
  const pendingPayments = data?.pendingPayments || [];
  const history = data?.history || [];
  if (!user) return null;

  const status = STATUS_STYLES[user.paymentStatus] || STATUS_STYLES.pending_approval;
  const totalPending = pendingPayments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="h-full overflow-y-auto theme-scrollbar">
      <div className="sticky top-0 z-30 bg-bg-base border-b border-white/[0.04]">
        <div className="w-full px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <div>
              <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Facturación</p>
              <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">Pagos</h1>
            </div>
          </div>
          <p className="text-[11px] text-text-muted md:ml-auto">Gestiona tus pagos mensuales y consulta tu historial</p>
        </div>
      </div>
      <div className="p-4 md:p-8 w-full space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Saldo Pendiente', value: `${totalPending.toLocaleString()} UF`, color: totalPending > 0 ? '#fbbf24' : '#34d399', sub: totalPending > 0 ? 'Por regularizar' : 'Al día' },
            { label: 'UF Hoy', value: ufValue ? `$${Number(ufValue).toLocaleString('es-CL', { maximumFractionDigits: 0 })}` : '—', color: '#94a3b8', sub: 'Valor de conversión' },
            { label: 'Tu Plan', value: user.customPrice > 0 ? `${user.customPrice} UF` : (user.planType || 'Free'), color: '#818cf8', sub: user.customPrice > 0 && ufValue ? `≈ $${(user.customPrice * ufValue).toLocaleString('es-CL', { maximumFractionDigits: 0 })} CLP/mes` : 'Mensual' },
            { label: 'Historial', value: history.length, color: '#34d399', sub: `${history.filter(h => h.status === 'paid').length} pagados` },
          ].map((card, i) => (
            <div key={i} className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 hover:border-white/[0.08] hover:bg-white/[0.025] transition-all duration-200">
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest mb-2">{card.label}</p>
              <p className="text-[22px] font-bold leading-none" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[10px] text-text-subtle mt-1.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {msg.text && (
          <div className={`flex items-center gap-3 px-4 py-3 text-[12px] rounded-lg border ${
            msg.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={msg.type === 'error' ? 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M5 13l4 4L19 7'} />
            </svg>
            <span className="flex-1">{msg.text}</span>
            <button onClick={() => setMsg({ text: '', type: '' })} className="opacity-60 hover:opacity-100">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <div className={`${status.bg} ${status.border} border rounded-xl p-5 tour-detail-1`}>
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl ${status.bg} border ${status.border} flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-5 h-5 ${status.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={status.icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-[15px] font-bold ${status.color}`}>{status.label} <InfoTooltip text={status.desc} /></h2>
                <StatusDot className={status.dot} />
              </div>
              <p className="text-[12px] text-text-muted mt-1">{status.desc}</p>
              {user.paymentStatus === 'active' && (
                <div className="flex items-center gap-4 mt-3 text-[11px] text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <StatusDot className="bg-emerald-400" />
                    Sin pagos vencidos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {ufValue && (
          <div className="bg-bg-panel/60 border border-amber-500/20 rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">UF Hoy <InfoTooltip text="Valor de la Unidad de Fomento del día para conversión a CLP." /></p>
                <p className="text-[20px] font-bold text-text-heading">${Number(ufValue).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="text-right">
              {user.customPrice > 0 ? (
                <>
                  <p className="text-[10px] text-text-subtle">Tu plan: <span className="text-white font-semibold">{user.customPrice} UF</span></p>
                  <p className="text-[13px] text-emerald-400 font-semibold">≈ ${(user.customPrice * ufValue).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CLP/mes</p>
                </>
              ) : (
                <p className="text-[10px] text-text-subtle">Plan: <span className="text-white font-semibold">{user.planType || 'Free'}</span></p>
              )}
              {totalPending > 0 && (
                <p className="text-[10px] text-amber-400">Total pendiente: {(totalPending * ufValue).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CLP</p>
              )}
            </div>
          </div>
        )}

        {user.paymentStatus === 'preapproved' && user.bankDetails?.bankName && (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border-theme/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg border border-white/[0.04] bg-white/[0.01]/30 flex items-center justify-center text-text-muted">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" /></svg>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-text-heading">Datos Bancarios <InfoTooltip text="Información bancaria para realizar la transferencia." placement="right" /></h3>
                <p className="text-[10px] text-text-subtle">Realiza la transferencia a la siguiente cuenta</p>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                {[
                  { label: 'Banco', value: user.bankDetails.bankName },
                  { label: 'Tipo Cuenta', value: user.bankDetails.accountType === 'corriente' ? 'Cuenta Corriente' : user.bankDetails.accountType === 'vista' ? 'Cuenta Vista' : user.bankDetails.accountType === 'ahorro' ? 'Cuenta de Ahorro' : user.bankDetails.accountType === 'rut' ? 'Cuenta RUT' : user.bankDetails.accountType, cap: true },
                  { label: 'N° Cuenta', value: user.bankDetails.accountNumber, mono: true },
                  { label: 'RUT', value: user.bankDetails.rut, mono: true },
                ].map((item, i) => (
                  <div key={i} className="bg-bg-base/40 border border-border-theme/20 rounded-lg px-3 py-3">
                    <p className="text-[9px] text-text-subtle uppercase tracking-wider font-semibold mb-1">{item.label}</p>
                    <p className={`text-[14px] ${item.mono ? 'font-mono tracking-wider' : item.cap ? 'capitalize' : ''} font-semibold text-white truncate`}>{item.value || '-'}</p>
                  </div>
                ))}
              </div>
              <div className="bg-bg-base/40 border border-border-theme/20 rounded-lg p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] text-text-subtle uppercase tracking-wider font-semibold flex items-center gap-1">Monto Mensual <InfoTooltip text="Costo mensual de tu plan en UF o valor personalizado." /></p>
                  <p className="text-[28px] font-bold text-white tracking-tight">${user.customPrice > 0 ? user.customPrice : (user.planType === 'Free' ? 'Gratuito' : user.planType || 'Free')} <span className="text-[14px] text-text-muted font-normal">{user.customPrice > 0 ? 'UF' : ''}</span></p>
                </div>
                <button onClick={() => setShowPayModal(true)}
                  className="px-5 py-2.5 text-[12px] font-semibold rounded-lg bg-white text-gray-900 hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg shadow-white/10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  Marcar como Pagado <InfoTooltip text="Registra tu transferencia para que el administrador la verifique." />
                </button>
              </div>
              <p className="text-[10px] text-text-subtle mt-3 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Incluye un concepto descriptivo para que el administrador identifique tu transferencia.
              </p>
            </div>
          </div>
        )}

        {pendingPayments.length > 0 && (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border-theme/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg border border-white/[0.04] bg-white/[0.01]/30 flex items-center justify-center text-amber-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-text-heading">Pagos Pendientes <InfoTooltip text="Pagos mensuales que aún no han sido registrados o aprobados." /></h3>
                  <p className="text-[10px] text-text-subtle">{pendingPayments.length} pago{pendingPayments.length > 1 ? 's' : ''} por regularizar</p>
                </div>
              </div>
              <span className="text-[11px] text-text-muted">{totalPending.toLocaleString()} USD</span>
            </div>
            <div className="divide-y divide-surface-700/10">
              {pendingPayments.map((p) => {
                const ps = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.pending;
                return (
                  <div key={p._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-bg-elevated/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg ${ps.bg} flex items-center justify-center ${ps.color} flex-shrink-0`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={p.status === 'overdue' ? 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'} /></svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-text-heading">{p.month}/{p.year}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${ps.bg} ${ps.color} border border-current/10`}>{ps.label}</span> <InfoTooltip text="Estado de la transacción de pago." placement="top" />
                        </div>
                        {p.concept && <p className="text-[11px] text-text-muted mt-0.5 truncate max-w-[200px]">{p.concept}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button onClick={() => setShowDetailsModal(true)}
                        className="px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-border-theme/40 text-text-muted hover:text-text-heading hover:border-surface-600 transition-all">
                        Ver datos
                      </button>
                      <div className="text-right">
                        <p className="text-[15px] font-bold text-white leading-none">${p.amount?.toLocaleString()}</p>
                        <p className="text-[8px] text-text-subtle uppercase tracking-wider mt-0.5">USD</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] rounded-xl overflow-hidden tour-detail-2">
          <div className="px-5 py-4 border-b border-border-theme/20 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-white/[0.04] bg-white/[0.01]/30 flex items-center justify-center text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-text-heading">Historial de Pagos <InfoTooltip text="Registro de todos los pagos realizados y su estado." /></h3>
              <p className="text-[10px] text-text-subtle">{history.length} registro{history.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="flex flex-col items-center py-12 px-4">
              <div className="w-14 h-14 rounded-xl bg-bg-elevated/50 border border-border-theme/20 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-[13px] text-text-muted">Sin pagos registrados</p>
              <p className="text-[11px] text-text-subtle mt-1">Los pagos aparecerán aquí una vez que el administrador los registre.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-700/10">
              {history.map((p) => {
                const ps = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.pending;
                return (
                  <div key={p._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-bg-elevated/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg ${ps.bg} flex items-center justify-center ${ps.color} flex-shrink-0`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={p.status === 'paid' ? 'M5 13l4 4L19 7' : p.status === 'pending' ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' : 'M6 18L18 6M6 6l12 12'} /></svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-text-heading">{p.month}/{p.year}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${ps.bg} ${ps.color} border border-current/10`}>{ps.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {p.concept && <span className="text-[10px] text-text-subtle truncate max-w-[180px]">{p.concept}</span>}
                          {p.paidAt && <span className="text-[10px] text-text-subtle">{new Date(p.paidAt).toLocaleDateString('es-CL')}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {p.status === 'pending' && (
                        <button onClick={() => setShowDetailsModal(true)}
                          className="px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-border-theme/40 text-text-muted hover:text-text-heading hover:border-surface-600 transition-all">
                          Ver datos
                        </button>
                      )}
                      <div className="text-right">
                        <p className="text-[15px] font-bold text-white leading-none">${p.amount?.toLocaleString()}</p>
                        <p className="text-[8px] text-text-subtle uppercase tracking-wider mt-0.5">USD</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showDetailsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)} />
            <div className="relative rounded-xl border border-white/[0.04] bg-white/[0.015] rounded-xl shadow-2xl shadow-black/50 w-full max-w-lg mx-4 overflow-hidden">
              {(data?.adminBankDetails?.bankName || user.bankDetails?.bankName) ? (
                <>
                  <div className="px-5 py-4 border-b border-border-theme/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg border border-white/[0.04] bg-white/[0.01]/30 flex items-center justify-center text-text-muted">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" /></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[14px] font-semibold text-text-heading">Datos Bancarios</h3>
                      <p className="text-[10px] text-text-subtle">Realiza la transferencia a la siguiente cuenta</p>
                    </div>
                    <button onClick={() => setShowDetailsModal(false)} className="p-1 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      {(() => {
                        const bd = data?.adminBankDetails?.bankName ? data.adminBankDetails : user.bankDetails;
                        return [
                          { label: 'Banco', value: bd.bankName },
                          { label: 'Tipo Cuenta', value: bd.accountType === 'corriente' ? 'Cuenta Corriente' : bd.accountType === 'vista' ? 'Cuenta Vista' : bd.accountType === 'ahorro' ? 'Cuenta de Ahorro' : bd.accountType === 'rut' ? 'Cuenta RUT' : bd.accountType, cap: true },
                          { label: 'N° Cuenta', value: bd.accountNumber, mono: true },
                          { label: 'RUT', value: bd.rut, mono: true },
                        ].map((item, i) => (
                          <div key={i} className="bg-bg-base/40 border border-border-theme/20 rounded-lg px-3.5 py-3">
                            <p className="text-[9px] text-text-subtle uppercase tracking-wider font-semibold mb-1">{item.label}</p>
                            <p className={`text-[13px] ${item.mono ? 'font-mono tracking-wider' : item.cap ? 'capitalize' : ''} font-semibold text-white truncate`}>{item.value || '-'}</p>
                          </div>
                        ));
                      })()}
                    </div>
                    {(() => {
                      const bd = data?.adminBankDetails?.bankName ? data.adminBankDetails : user.bankDetails;
                      return bd.email ? (
                        <div className="bg-bg-base/40 border border-border-theme/20 rounded-lg px-3.5 py-3">
                          <p className="text-[9px] text-text-subtle uppercase tracking-wider font-semibold mb-1">Correo</p>
                          <p className="text-[13px] font-semibold text-text-heading">{bd.email}</p>
                        </div>
                      ) : null;
                    })()}
                    <div className="bg-bg-base/40 border border-border-theme/20 rounded-lg p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] text-text-subtle uppercase tracking-wider font-semibold">Monto Mensual</p>
                        <p className="text-[22px] font-bold text-text-heading">${user.customPrice > 0 ? user.customPrice : (user.planType === 'Free' ? 'Gratuito' : user.planType || 'Free')} <span className="text-[12px] text-text-muted font-normal">{user.customPrice > 0 ? 'UF' : ''}</span></p>
                      </div>
                      <button onClick={() => { setShowDetailsModal(false); setShowPayModal(true); }}
                        className="px-4 py-2 text-[11px] font-semibold rounded-lg bg-white text-gray-900 hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg shadow-white/10">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        Ya Transferí
                      </button>
                    </div>
                    <div className="bg-bg-base/40 border border-border-theme/20 rounded-lg px-3.5 py-3">
                      <p className="text-[9px] text-text-subtle uppercase tracking-wider font-semibold mb-1">Concepto sugerido</p>
                      <p className="text-[12px] font-mono text-text-muted break-all">
                        {`Pago mensual ${new Date().getMonth() + 1}/${new Date().getFullYear()} - ${user.companyName || ''}${user.bankDetails?.rut ? ' - RUT ' + user.bankDetails.rut : ''}`}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-12 px-6">
                  <div className="w-14 h-14 rounded-xl bg-bg-elevated/50 border border-border-theme/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-[15px] font-semibold text-white mb-2">Datos Bancarios no Configurados</h3>
                  <p className="text-[12px] text-text-muted text-center leading-relaxed">
                    El administrador aún no ha configurado los datos bancarios. Contacta al administrador para que complete esta información.
                  </p>
                  <button onClick={() => setShowDetailsModal(false)}
                    className="mt-5 px-5 py-2 text-[12px] font-medium rounded-lg border border-border-theme/40 text-text-muted hover:text-text-heading hover:border-surface-600 transition-all">
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showPayModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPayModal(false)} />
            <div className="relative rounded-xl border border-white/[0.04] bg-white/[0.015] rounded-xl shadow-2xl shadow-black/50 w-full max-w-md mx-4 overflow-hidden">
              <div className="px-5 py-4 border-b border-border-theme/20 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg border border-white/[0.04] bg-white/[0.01]/30 flex items-center justify-center text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-text-heading">Confirmar Pago</h3>
                  <p className="text-[10px] text-text-subtle">Registra tu transferencia realizada</p>
                </div>
                <button onClick={() => setShowPayModal(false)} className="p-1 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-bg-base/40 border border-border-theme/20 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-text-subtle uppercase tracking-wider font-semibold">Monto</p>
                    <p className="text-[26px] font-bold text-white tracking-tight">${user.customPrice > 0 ? user.customPrice : (user.planType === 'Free' ? 'Gratuito' : user.planType || 'Free')} <span className="text-[12px] text-text-muted font-normal">{user.customPrice > 0 ? 'UF' : ''}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-subtle uppercase tracking-wider font-semibold">Período</p>
                    <p className="text-[14px] font-bold text-white capitalize">
                      {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] text-text-muted font-medium mb-2">
                    <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Concepto del Pago <span className="text-text-subtle">*</span>
                  </label>
                  <textarea value={concept} onChange={e => setConcept(e.target.value)} rows={2}
                    className="w-full bg-bg-base/60 border border-border-theme/30 text-[12px] text-white rounded-lg px-3.5 py-3 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 placeholder-text-subtle resize-none transition-all"
                    placeholder="Ej: Pago mensual junio 2026 - SecureLab SpA - RUT 12.345.678-9" />
                  <p className="text-[10px] text-text-subtle mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Incluye nombre de empresa, RUT y período para identificar el pago
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowPayModal(false)}
                    className="px-4 py-2 text-[11px] text-text-muted hover:text-text-body transition-colors rounded-lg hover:bg-bg-elevated">
                    Cancelar
                  </button>
                  <button onClick={handleSubmitPayment} disabled={submitting || !concept.trim()}
                    className="px-5 py-2 text-[12px] font-semibold rounded-lg bg-white text-gray-900 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-white/10">
                    {submitting ? (
                      <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Enviando...</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Confirmar Pago</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

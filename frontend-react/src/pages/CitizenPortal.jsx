import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/api';

const TIPO_LABELS = {
  acceso: 'Acceso', rectificacion: 'Rectificación', cancelacion: 'Cancelación',
  oposicion: 'Oposición', portabilidad: 'Portabilidad', bloqueo: 'Bloqueo',
};

const ESTADO_LABELS = {
  pendiente: 'Pendiente', en_proceso: 'En Proceso', completado: 'Completado', rechazado: 'Rechazado',
};

const ESTADO_COLORS = {
  pendiente: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  en_proceso: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  completado: 'text-green-400 bg-green-500/10 border-green-500/20',
  rechazado: 'text-red-400 bg-red-500/10 border-red-500/20',
};

function getDueDateInfo(dueDate) {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    overdue: diffDays < 0,
    daysLeft: diffDays,
    label: diffDays < 0 ? `Vencida hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}` : `${diffDays} día${diffDays !== 1 ? 's' : ''} restante${diffDays !== 1 ? 's' : ''}`,
  };
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const STEPS = [
  { key: 'creada', label: 'Solicitud recibida', icon: '📝' },
  { key: 'en_proceso', label: 'En revisión', icon: '🔍' },
  { key: 'completado', label: 'Finalizada', icon: '✅' },
];

function getStepIndex(estado) {
  if (estado === 'rechazado') return 2;
  return STEPS.findIndex(s => s.key === estado) + (estado === 'pendiente' ? 1 : 0);
}

export default function CitizenPortal() {
  const [requestId, setRequestId] = useState('');
  const [email, setEmail] = useState('');
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!requestId.trim()) return;
    setLoading(true);
    setError('');
    setTracking(null);
    const res = await api.api.post('/arco/requests/status', new URLSearchParams({ requestId: requestId.trim(), email: email.trim() }));
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.success && res.tracking) {
      setTracking(res.tracking);
    }
  };

  const dueInfo = getDueDateInfo(tracking?.dueDate);
  const stepIndex = tracking ? getStepIndex(tracking.estado) : -1;
  const isRejected = tracking?.estado === 'rechazado';

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="flex-shrink-0 border-b border-border-theme/50 bg-bg-base/95 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="text-text-muted hover:text-text-heading transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/25 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-text-heading">Estado de mi solicitud</h1>
            <p className="text-[11px] text-text-muted">Consulta el estado de tu solicitud de derechos ARCO</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center pt-12 px-4">
        <div className="w-full max-w-lg">
          {!tracking ? (
            <form onSubmit={handleSearch} className="bg-bg-panel/60 border border-border-theme/25 rounded-xl p-6 space-y-4">
              <div>
                <label className="text-[11px] text-text-muted font-medium block mb-1.5">ID de tu solicitud *</label>
                <input value={requestId} onChange={e => setRequestId(e.target.value)} placeholder="Ej: 60a1b2c3d4e5f6..." required
                  className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50 placeholder-text-subtle font-mono" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted font-medium block mb-1.5">Email (opcional, para ver respuesta)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
                  className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50 placeholder-text-subtle" />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading || !requestId.trim()}
                className="w-full py-2.5 text-[13px] font-medium rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-40">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    Consultando...
                  </span>
                ) : 'Consultar estado'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-bg-panel/60 border border-border-theme/25 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-[15px] font-semibold text-text-heading">{TIPO_LABELS[tracking.tipo] || tracking.tipo}</h2>
                    <p className="text-[11px] text-text-muted mt-0.5">{tracking.companyName}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-medium rounded border ${ESTADO_COLORS[tracking.estado] || ''}`}>
                    {ESTADO_LABELS[tracking.estado] || tracking.estado}
                  </span>
                </div>

                <div className="space-y-3">
                  {tracking.dueDate && tracking.estado !== 'completado' && tracking.estado !== 'rechazado' && dueInfo && (
                    <div className={`px-3 py-2 rounded-lg text-[12px] border ${dueInfo.overdue ? 'bg-red-500/10 border-red-500/20 text-red-400' : dueInfo.daysLeft <= 3 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-bg-elevated/40 border-border-theme/30 text-text-body'}`}>
                      Plazo: {dueInfo.label}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[12px] text-text-muted">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Creada: {formatDate(tracking.createdAt)}
                  </div>
                  {tracking.updatedAt && (
                    <div className="flex items-center gap-2 text-[12px] text-text-muted">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      Última actualización: {formatDate(tracking.updatedAt)}
                    </div>
                  )}
                </div>
              </div>

              {tracking.respuesta && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    <span className="text-[12px] font-medium text-purple-400">Respuesta de la empresa</span>
                  </div>
                  <p className="text-[13px] text-gray-200 whitespace-pre-wrap">{tracking.respuesta}</p>
                </div>
              )}

              <button onClick={() => { setTracking(null); setError(''); }}
                className="w-full py-2 text-[12px] text-text-muted hover:text-text-heading transition-colors">
                Consultar otra solicitud
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

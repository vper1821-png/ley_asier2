import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import { useI18n } from '../i18n/context';
import InfoTooltip from '../components/InfoTooltip';

const ESTADO_COLORS = {
  pendiente: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  en_proceso: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  completado: 'text-green-400 bg-green-500/10 border-green-500/20',
  rechazado: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const ESTADO_LABELS = {
  pendiente: 'Pendiente', en_proceso: 'En Proceso', completado: 'Completado', rechazado: 'Rechazado',
};

const TIPO_LABELS = {
  acceso: 'Acceso', rectificacion: 'Rectificación', cancelacion: 'Cancelación',
  oposicion: 'Oposición', portabilidad: 'Portabilidad', bloqueo: 'Bloqueo',
};

const TIPO_COLORS = {
  acceso: 'text-purple-400 border-purple-600',
  rectificacion: 'text-cyan-400 border-cyan-600',
  cancelacion: 'text-rose-400 border-rose-600',
  oposicion: 'text-orange-400 border-orange-600',
  portabilidad: 'text-emerald-400 border-emerald-600',
  bloqueo: 'text-indigo-400 border-indigo-600',
};

function formatDate(d, lang) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(lang === 'en' ? 'en' : 'es-CL', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getDueDateInfo(dueDate) {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    overdue: diffDays < 0,
    daysLeft: diffDays,
    urgent: diffDays >= 0 && diffDays <= 3,
    warning: diffDays > 3 && diffDays <= 7,
    ok: diffDays > 7,
    label: diffDays < 0 ? `VENCIDA hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}` : `${diffDays} día${diffDays !== 1 ? 's' : ''} restante${diffDays !== 1 ? 's' : ''}`,
  };
}

const statusDot = (estado) => {
  const colors = {
    pendiente: 'bg-yellow-400',
    en_proceso: 'bg-blue-400',
    completado: 'bg-green-400',
    rechazado: 'bg-red-400',
  };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[estado] || 'bg-gray-500'}`} />;
};

export default function ArcoRequests() {
  const { token } = useAuth();
  const { t, lang } = useI18n();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.arcoListRequests(token);
    if (res?.requests) setRequests(res.requests);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (requestId, estado) => {
    setSending(true);
    const res = await api.arcoUpdateRequest(token, requestId, estado, '');
    setSending(false);
    if (res.success) {
      if (selected?._id === requestId) {
        setSelected(prev => prev ? { ...prev, estado } : null);
      }
      load();
    }
  };

  const handleSelect = (req) => {
    setSelected(req);
  };

  const filtered = filter ? requests.filter(r => r.estado === filter) : requests;

  const pendienteCount = requests.filter(r => r.estado === 'pendiente').length;
  const enProcesoCount = requests.filter(r => r.estado === 'en_proceso').length;
  const completadoCount = requests.filter(r => r.estado === 'completado').length;
  const overdueCount = requests.filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.estado !== 'completado' && r.estado !== 'rechazado').length;

  const statusBadge = (estado) => (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${ESTADO_COLORS[estado] || ESTADO_COLORS.pendiente}`}>
      {ESTADO_LABELS[estado] || estado}
    </span>
  );

  const tipoBadge = (tipo) => {
    const tips = { acceso: 'Derecho a acceder a tus datos personales.', rectificacion: 'Derecho a corregir datos inexactos.', cancelacion: 'Derecho a eliminar tus datos personales.', oposicion: 'Derecho a oponerte al tratamiento de tus datos.', portabilidad: 'Derecho a recibir tus datos en formato estructurado.', bloqueo: 'Derecho a bloquear temporalmente el tratamiento.' };
    return <span className="inline-flex items-center gap-1"><span className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${TIPO_COLORS[tipo] || TIPO_COLORS.acceso}`}>{TIPO_LABELS[tipo] || tipo}</span><InfoTooltip text={tips[tipo] || 'Tipo de solicitud ARCO.'} /></span>;
  };

  return (
    <div className="h-full flex flex-col bg-bg-base">
      <header className="flex-shrink-0 border-b border-white/[0.04] bg-bg-base sticky top-0 z-40">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Derechos de titulares</p>
                <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">{t('admin.arcoPortal.title')}</h1>
              </div>
            </div>
            <p className="text-[11px] text-text-muted md:ml-auto md:mr-4">{requests.length} solicitud{requests.length !== 1 ? 'es' : ''} · {pendienteCount} pendientes{overdueCount > 0 ? ` · ${overdueCount} vencidas` : ''}</p>
            <div className="flex gap-1 overflow-x-auto items-center bg-bg-base border border-white/[0.04] rounded-xl p-1">
              {['', 'pendiente', 'en_proceso', 'completado', 'rechazado'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap ${filter === s ? 'bg-purple-500/10 text-purple-400' : 'text-text-muted hover:text-text-heading'}`}>
                  {s ? ({ pendiente: 'Pendientes', en_proceso: 'En Proceso', completado: 'Completados', rechazado: 'Rechazados' })[s] : 'Todas'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-shrink-0 w-full px-4 md:px-8 py-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-200">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-purple-400 " />
            <div className="flex items-center gap-2.5 mb-3">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Total <InfoTooltip text="Número total de solicitudes ARCO registradas." /></span>
            </div>
            <p className="text-[26px] font-bold leading-none tracking-tight text-text-heading">{requests.length}</p>
            <p className="text-[10px] text-text-subtle mt-2">{pendienteCount} pendientes</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-200">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-yellow-400 " />
            <div className="flex items-center gap-2.5 mb-3">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Pendientes <InfoTooltip text="Solicitudes esperando ser tomadas por un agente." /></span>
            </div>
            <p className="text-[26px] font-bold leading-none tracking-tight text-yellow-400">{pendienteCount}</p>
            <p className="text-[10px] text-text-subtle mt-2">Esperando atención</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-200">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-blue-400 " />
            <div className="flex items-center gap-2.5 mb-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">En Proceso <InfoTooltip text="Solicitudes en revisión y gestión activa." /></span>
            </div>
            <p className="text-[26px] font-bold leading-none tracking-tight text-blue-400">{enProcesoCount}</p>
            <p className="text-[10px] text-text-subtle mt-2">En revisión</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-green-500/30 transition-all duration-200">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-green-400 " />
            <div className="flex items-center gap-2.5 mb-3">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Completados <InfoTooltip text="Solicitudes respondidas y cerradas exitosamente." /></span>
            </div>
            <p className="text-[26px] font-bold leading-none tracking-tight text-green-400">{completadoCount}</p>
            <p className="text-[10px] text-text-subtle mt-2">{requests.length > 0 ? Math.round(completadoCount / requests.length * 100) : 0}% resueltos</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden w-full px-4 md:px-8 pb-8">
        <div className="h-full rounded-xl border border-white/[0.04] bg-white/[0.015] flex overflow-hidden tour-detail-1">
          <aside className="hidden md:block w-64 flex-shrink-0 border-r border-border-theme/50 overflow-y-auto bg-white/[0.015]">
            <div className="p-3">
              <p className="text-[10px] text-text-subtle uppercase tracking-wide font-medium mb-2 px-1 flex items-center gap-1">Solicitudes <InfoTooltip text="Lista de todas las solicitudes ARCO y su estado." /></p>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <svg className="w-8 h-8 mx-auto mb-2 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <p className="text-xs">No hay solicitudes</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map(req => (
                    <div key={req._id}
                      onClick={() => handleSelect(req)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                        selected?._id === req._id ? 'bg-purple-500/10 border border-purple-500/20' : 'hover:bg-bg-elevated border border-transparent'
                      }`}>
                      {statusDot(req.estado)}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{TIPO_LABELS[req.tipo] || req.tipo}</p>
                        <p className="text-[10px] text-text-subtle">{req.solicitante?.nombre} · {formatDate(req.createdAt, lang)}</p>
                      </div>
                      {(() => {
                        const di = getDueDateInfo(req.dueDate);
                        if (!di || di.ok) return null;
                        return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${di.overdue ? 'bg-red-400 animate-pulse' : di.urgent ? 'bg-orange-400' : 'bg-yellow-400'}`} />;
                      })()}
                      {req.respuesta && <svg className="w-3.5 h-3.5 text-green-500/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className="flex-1 flex flex-col overflow-hidden">
            {selected ? (
              <>
                <div className="flex-shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border-theme/50 bg-white/[0.015]">
                  <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-heading transition-colors md:hidden">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    Volver
                  </button>
                  <div className="h-4 w-px bg-surface-600 md:hidden" />
                  <span className="text-sm font-medium text-white truncate">{TIPO_LABELS[selected.tipo] || selected.tipo}</span>
                  <div className="flex gap-2 ml-auto">
                    {statusBadge(selected.estado)}
                    {tipoBadge(selected.tipo)}
                  </div>
                  {(() => {
                    const dueInfo = getDueDateInfo(selected.dueDate);
                    if (!dueInfo) return null;
                    const color = dueInfo.overdue ? 'text-red-400 border-red-500/30 bg-red-500/10'
                      : dueInfo.urgent ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                      : dueInfo.warning ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                      : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
                    const pulse = dueInfo.overdue || dueInfo.urgent;
                    return (
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border ${color} ${pulse ? 'animate-pulse' : ''}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        {dueInfo.label} <InfoTooltip text="Tiempo restante para responder la solicitud ARCO." placement="top" />
                      </span>
                    );
                  })()}
                  <div className="flex gap-1">
                    {selected.respuesta && (
                      <a href={`/api/arco/requests/${selected._id}/pdf`}
                        onClick={e => { e.preventDefault(); window.open(`/api/arco/requests/${selected._id}/pdf`, '_blank'); }}
                        className="px-2.5 py-1 text-[11px] font-medium rounded bg-bg-elevated/50 text-text-body border border-surface-600 hover:bg-bg-elevated transition-colors">
                        PDF
                      </a>
                    )}
                    {selected.estado === 'pendiente' && (
                      <button onClick={() => handleUpdate(selected._id, 'en_proceso')} disabled={sending}
                        className="px-2.5 py-1 text-[11px] font-medium rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-40">
                        Tomar
                      </button>
                    )}
                    {selected.estado !== 'completado' && selected.estado !== 'rechazado' && (
                      <button onClick={() => handleUpdate(selected._id, 'completado')} disabled={sending}
                        className="px-2.5 py-1 text-[11px] font-medium rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-40">
                        Completar <InfoTooltip text="Marca la solicitud ARCO como respondida." placement="top" />
                      </button>
                    )}
                    {selected.estado !== 'rechazado' && selected.estado !== 'completado' && (
                      <button onClick={() => handleUpdate(selected._id, 'rechazado')} disabled={sending}
                        className="px-2.5 py-1 text-[11px] font-medium rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-40">
                        Rechazar
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 scrollbar-custom">
                  {selected.dueDate && selected.estado !== 'completado' && selected.estado !== 'rechazado' && (() => {
                    const di = getDueDateInfo(selected.dueDate);
                    if (!di) return null;
                    const barColor = di.overdue ? 'bg-red-500' : di.urgent ? 'bg-orange-500' : di.warning ? 'bg-yellow-500' : 'bg-emerald-500';
                    const pct = di.overdue ? 100 : Math.max(0, Math.min(100, ((15 - (15 - di.daysLeft)) / 15) * 100));
                    return (
                      <div className={`px-4 py-2.5 rounded-lg border ${di.overdue ? 'bg-red-500/10 border-red-500/20' : di.urgent ? 'bg-orange-500/10 border-orange-500/20' : 'bg-bg-elevated/40 border-border-theme/30'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">Plazo de respuesta <InfoTooltip text="Tiempo límite para responder la solicitud ARCO según la normativa." /></span>
                          <span className={`text-[11px] font-medium ${di.overdue ? 'text-red-400' : di.urgent ? 'text-orange-400' : di.warning ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {di.label}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-bg-elevated/50 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                  <div className="bg-bg-elevated/40 border border-border-theme/30 rounded-xl px-4 py-3.5 max-w-[75%]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-medium text-purple-400">Solicitante</span>
                      <span className="text-[10px] text-text-subtle">{formatDate(selected.createdAt, lang)}</span>
                    </div>
                    <div className="space-y-1.5 text-[12px]">
                      <p className="text-text-body"><span className="text-text-muted">Nombre:</span> {selected.solicitante?.nombre}</p>
                      <p className="text-text-body"><span className="text-text-muted">RUT:</span> {selected.solicitante?.rut}</p>
                      <p className="text-text-body"><span className="text-text-muted">Email:</span> {selected.solicitante?.email}</p>
                      {selected.solicitante?.telefono && <p className="text-text-body"><span className="text-text-muted">Teléfono:</span> {selected.solicitante.telefono}</p>}
                      <p className="text-text-body"><span className="text-text-muted">Tipo:</span> {TIPO_LABELS[selected.tipo] || selected.tipo}</p>
                      {selected.descripcion && (
                        <div className="pt-1.5 border-t border-border-theme/50 mt-1.5">
                          <p className="text-text-muted text-[11px] mb-0.5">Descripción:</p>
                          <p className="text-gray-200">{selected.descripcion}</p>
                        </div>
                      )}
                      {selected.datosAEliminar && (
                        <div className="pt-1.5 border-t border-border-theme/50 mt-1.5">
                          <p className="text-text-muted text-[11px] mb-0.5">Datos a eliminar:</p>
                          <p className="text-gray-200">{selected.datosAEliminar}</p>
                        </div>
                      )}
                      {selected.eliminacionTotal && (
                        <p className="text-red-400 font-medium text-[11px] pt-1">Solicita eliminación total de sus datos</p>
                      )}
                    </div>
                  </div>

                  {selected.respuesta && (
                    <div className="flex justify-end">
                      <div className="max-w-[75%] rounded-xl px-4 py-3 bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-medium text-purple-400">Respuesta</span>
                        </div>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{selected.respuesta}</p>
                      </div>
                    </div>
                  )}

                </div>


              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                    <svg className="w-12 h-12 mb-3 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <p className="text-sm">No hay solicitudes {filter ? 'con ese estado' : 'todavía'}</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="hidden md:flex flex-col items-center text-text-muted">
                      <svg className="w-16 h-16 mb-4 text-surface-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      <p className="text-sm font-medium text-text-muted">Seleccione una solicitud</p>
                      <p className="text-xs text-text-subtle mt-1">Elija una solicitud de la lista para gestionarla</p>
                    </div>
                    <div className="w-full md:hidden space-y-2 px-1 pb-4">
                      {filtered.map(req => (
                        <div key={req._id} onClick={() => handleSelect(req)}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-lg rounded-xl border border-white/[0.04] bg-white/[0.015] active:scale-[0.98] transition-all">
                          {statusDot(req.estado)}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-white truncate">{TIPO_LABELS[req.tipo] || req.tipo}</p>
                            <p className="text-[11px] text-text-muted mt-0.5">{req.solicitante?.nombre} · {formatDate(req.createdAt, lang)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {req.respuesta && <svg className="w-3.5 h-3.5 text-green-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>}
                            <svg className="w-3.5 h-3.5 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

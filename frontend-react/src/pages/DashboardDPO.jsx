import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import InfoTooltip from '../components/InfoTooltip';

const TIPO_LABELS = {
  acceso: 'Acceso', rectificacion: 'Rectificación', cancelacion: 'Cancelación',
  oposicion: 'Oposición', portabilidad: 'Portabilidad', bloqueo: 'Bloqueo',
};

const ESTADO_COLORS = {
  pendiente: 'text-amber-500', en_proceso: 'text-blue-500',
  completado: 'text-green-500', rechazado: 'text-red-500',
};

const TIPO_COLORS = {
  acceso: 'bg-purple-500', rectificacion: 'bg-cyan-500', cancelacion: 'bg-rose-500',
  oposicion: 'bg-orange-500', portabilidad: 'bg-emerald-500', bloqueo: 'bg-indigo-500',
};

function StatCard({ icon, label, value, sub, color = 'var(--text-heading)' }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-panel p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-text-muted">{icon}</span>
        <span className="text-[10px] text-text-subtle font-medium uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-text-subtle mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardDPO() {
  const { token } = useAuth();
  const [arcoRequests, setArcoRequests] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [arcoRes, overviewRes] = await Promise.all([
        api.arcoListRequests(token).catch(() => ({ requests: [] })),
        api.api.get('/invisia/compliance/overview', { params: { token } }).catch(() => ({ stats: {} })),
      ]);
      if (arcoRes?.requests) setArcoRequests(arcoRes.requests);
      if (overviewRes) setCompliance(overviewRes);
    } catch (e) {
      // fallback silently
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const overdue = arcoRequests.filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.estado !== 'completado' && r.estado !== 'rechazado').length;
  const pendientes = arcoRequests.filter(r => r.estado === 'pendiente').length;
  const enProceso = arcoRequests.filter(r => r.estado === 'en_proceso').length;
  const completadas = arcoRequests.filter(r => r.estado === 'completado').length;
  const rechazadas = arcoRequests.filter(r => r.estado === 'rechazado').length;

  const byType = {};
  arcoRequests.forEach(r => { byType[r.tipo] = (byType[r.tipo] || 0) + 1; });

  const stats = compliance?.stats || {};

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-y-auto">
      <header className="flex-shrink-0 border-b border-white/[0.04] bg-bg-base sticky top-0 z-40">
        <div className="w-full px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent-border flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <div>
              <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Delegado de Protección de Datos</p>
              <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">Dashboard DPO</h1>
            </div>
          </div>
          <p className="text-[11px] text-text-muted md:ml-auto md:mr-4">Panel de control con KPIs y reportes de protección de datos</p>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme hover:border-white/[0.08] transition-all">
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refrescar
          </button>
        </div>
      </header>

      <div className="flex-1 w-full px-4 md:px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 tour-detail-1">
              <StatCard icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>} label={<span className="flex items-center gap-1">Solicitudes ARCO <InfoTooltip text="Total de solicitudes de derechos ARCO recibidas." /></span>} value={arcoRequests.length} sub={`${pendientes} pendientes · ${enProceso} en proceso`} color="#a855f7" />
              <StatCard icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} label={<span className="flex items-center gap-1">Vencidas <InfoTooltip text="Solicitudes cuyo plazo legal de respuesta ya expiró." /></span>} value={overdue} sub={overdue > 0 ? 'Requieren atención inmediata' : 'Al día'} color={overdue > 0 ? 'var(--danger)' : 'var(--success)'} />
              <StatCard icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>} label={<span className="flex items-center gap-1">Brechas activas <InfoTooltip text="Incidentes de seguridad de datos activos que requieren gestión." /></span>} value={stats.activeBreaches || 0} sub={`${stats.criticalBreaches || 0} críticas · ${stats.totalBreaches || 0} totales`} color={(stats.activeBreaches || 0) > 0 ? 'var(--danger)' : 'var(--success)'} />
              <StatCard icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>} label={<span className="flex items-center gap-1">Inventario RAT <InfoTooltip text="Registro de actividades de tratamiento de datos personales." /></span>} value={stats.inventoryItems || 0} sub={`${stats.sensitiveItems || 0} datos sensibles`} color="#06b6d4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border-subtle bg-bg-panel p-5 shadow-theme-sm">
                <h3 className="text-[13px] font-semibold text-text-heading mb-4 flex items-center gap-1.5">Solicitudes por tipo <InfoTooltip text="Distribución de solicitudes ARCO clasificadas por tipo de derecho." /></h3>
                {Object.keys(byType).length === 0 ? (
                  <p className="text-[12px] text-text-muted">Sin solicitudes registradas</p>
                ) : (
                  <div className="space-y-2.5">
                    {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => {
                      const pct = Math.round(count / arcoRequests.length * 100);
                      const barColor = TIPO_COLORS[tipo] || 'bg-text-muted';
                      return (
                        <div key={tipo}>
                          <div className="flex items-center justify-between text-[12px] mb-1">
                            <span className="text-text-body">{TIPO_LABELS[tipo] || tipo}</span>
                            <span className="text-text-subtle">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border-subtle bg-bg-panel p-5 shadow-theme-sm">
                <h3 className="text-[13px] font-semibold text-text-heading mb-4 flex items-center gap-1.5">Estado de solicitudes <InfoTooltip text="Resumen del estado actual de todas las solicitudes ARCO." /></h3>
                <div className="space-y-3">
                  {[
                    { label: 'Pendientes', count: pendientes, color: 'bg-amber-500' },
                    { label: 'En Proceso', count: enProceso, color: 'bg-blue-500' },
                    { label: 'Completadas', count: completadas, color: 'bg-green-500' },
                    { label: 'Rechazadas', count: rechazadas, color: 'bg-red-500' },
                  ].map(s => {
                    const total = arcoRequests.length || 1;
                    const pct = Math.round(s.count / total * 100);
                    return (
                      <div key={s.label}>
                        <div className="flex items-center justify-between text-[12px] mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${s.color}`} />
                            <span className="text-text-body">{s.label}</span>
                          </div>
                          <span className="text-text-subtle">{s.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
                          <div className={`h-full rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border-subtle bg-bg-panel p-4 shadow-theme-sm">
                <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">DPD Designado <InfoTooltip text="Delegado de Protección de Datos. Obligatorio según Art. 28." /></p>
                <p className={`text-lg font-bold ${stats.dpdAssigned ? 'text-green-500' : 'text-red-500'}`}>{stats.dpdAssigned ? 'Sí' : 'No'}</p>
                <p className="text-[10px] text-text-subtle mt-1">{stats.dpdAssigned ? 'Art. 28 cumplido' : 'Obligatorio según Art. 28'}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-bg-panel p-4 shadow-theme-sm">
                <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">Registrado en APDP <InfoTooltip text="Registro Nacional de Tratamiento ante la autoridad." /></p>
                <p className={`text-lg font-bold ${stats.apdpRegistered ? 'text-green-500' : 'text-amber-500'}`}>{stats.apdpRegistered ? 'Sí' : 'Pendiente'}</p>
                <p className="text-[10px] text-text-subtle mt-1">Registro Nacional de Tratamiento</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-bg-panel p-4 shadow-theme-sm">
                <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">Capacitaciones <InfoTooltip text="Programa de capacitación en protección de datos para el equipo." /></p>
                <p className="text-lg font-bold text-text-heading">{stats.completedTrainings || 0}/{stats.totalTrainings || 0}</p>
                <p className="text-[10px] text-text-subtle mt-1">Completadas / Totales</p>
              </div>
            </div>

            {arcoRequests.length > 0 && (
              <div className="rounded-xl border border-border-subtle bg-bg-panel shadow-theme-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border-subtle bg-bg-elevated/40">
                  <h3 className="text-[13px] font-semibold text-text-heading flex items-center gap-1.5">Últimas solicitudes <InfoTooltip text="Tabla con las 10 solicitudes ARCO más recientes." /></h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-text-subtle border-b border-border-subtle">
                        <th className="text-left px-5 py-2.5 font-medium">Tipo</th>
                        <th className="text-left px-5 py-2.5 font-medium">Solicitante</th>
                        <th className="text-left px-5 py-2.5 font-medium">Estado</th>
                        <th className="text-left px-5 py-2.5 font-medium">Fecha</th>
                        <th className="text-left px-5 py-2.5 font-medium">Plazo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arcoRequests.slice(0, 10).map(r => {
                        const dueInfo = r.dueDate && r.estado !== 'completado' && r.estado !== 'rechazado' ? (() => { const d = new Date(r.dueDate); const n = new Date(); return Math.ceil((d - n) / (1000 * 60 * 60 * 24)); })() : null;
                        return (
                          <tr key={r._id} className="border-b border-border-subtle hover:bg-bg-elevated/30">
                            <td className="px-5 py-2.5 text-text-heading">{TIPO_LABELS[r.tipo] || r.tipo}</td>
                            <td className="px-5 py-2.5 text-text-muted">{r.solicitante?.nombre}</td>
                            <td className="px-5 py-2.5"><span className={`${ESTADO_COLORS[r.estado] || ''}`}>{r.estado}</span></td>
                            <td className="px-5 py-2.5 text-text-subtle">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-CL') : '-'}</td>
                            <td className="px-5 py-2.5">
                              {dueInfo !== null ? (
                                <span className={dueInfo < 0 ? 'text-danger' : dueInfo <= 3 ? 'text-amber-500' : 'text-text-subtle'}>
                                  {dueInfo < 0 ? `Vencida` : `${dueInfo}d`}
                                </span>
                              ) : (
                                <span className="text-text-subtle">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

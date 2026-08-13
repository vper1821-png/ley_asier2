import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';

export default function UserMonitor() {
  const { userId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    if (!token || !userId) return;
    setLoading(true);
    api.getUserMonitorData(token, userId).then(res => {
      if (res.error) return;
      setData(res);
    }).finally(() => setLoading(false));
  }, [token, userId]);

  useEffect(() => {
    if (!token || !userId) return;
    api.getPaymentHistory(token, userId).then(res => {
      if (!res.error) setPayments(Array.isArray(res) ? res : []);
    }).catch(() => {}).finally(() => setPaymentsLoading(false));
  }, [token, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-text-muted text-[13px]">Usuario no encontrado</div>
      </div>
    );
  }

  const { user, complianceConfig, breaches, consents, inventory, agents, databases, logs, scans, complianceChecklist } = data;
  const passedChecks = complianceChecklist?.filter(c => c.passed)?.length || 0;
  const totalChecks = complianceChecklist?.length || 0;
  const overallCompliant = totalChecks > 0 && passedChecks === totalChecks;

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => navigate('/admin')} className="text-[11px] text-text-muted hover:text-text-body mb-2">&larr; Volver al panel</button>
            <h1 className="text-xl font-bold text-text-heading">{user.companyName || 'Usuario'}</h1>
            <p className="text-[12px] text-text-muted">{user.email} {user.domain ? `· ${user.domain}` : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded text-[12px] font-semibold ${overallCompliant ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
              {overallCompliant ? 'CUMPLE' : 'NO CUMPLE'} · {passedChecks}/{totalChecks}
            </div>
            {user.paymentStatus && (
              <div className={`px-4 py-2 rounded text-[12px] font-semibold ${
                user.paymentStatus === 'active' ? 'bg-emerald-900/40 text-emerald-400' :
                user.paymentStatus === 'preapproved' ? 'bg-blue-900/40 text-blue-400' :
                user.paymentStatus === 'pending_approval' ? 'bg-yellow-900/40 text-yellow-400' :
                'bg-red-900/40 text-red-400'
              }`}>
                {user.paymentStatus === 'active' ? 'PAGO ACTIVO' :
                 user.paymentStatus === 'preapproved' ? 'PREAPROBADO' :
                 user.paymentStatus === 'pending_approval' ? 'PENDIENTE' :
                 user.paymentStatus === 'suspended' ? 'SUSPENDIDO' : 'CANCELADO'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Agentes" value={agents?.length || 0} sub={agents?.filter(a => a.status === 'online').length + ' online'} />
          <StatCard label="Bases de datos" value={databases?.length || 0} />
          <StatCard label="Brechas" value={breaches?.length || 0} sub={breaches?.filter(b => b.status !== 'resolved').length + ' abiertas'} color="red" />
          <StatCard label="Escaneos" value={scans?.length || 0} />
          <StatCard label="Transacciones" value={payments.length || 0} sub={'$' + payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0) + ' USD pagados'} color="cyan" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Cumplimiento Ley 21.719">
            <div className="space-y-2">
              {complianceChecklist?.map(check => (
                <div key={check.id} className="flex items-start gap-3 bg-bg-panel/50 rounded p-3">
                  <span className={`mt-0.5 text-base ${check.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {check.passed ? '✓' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-white font-medium">{check.label}</div>
                    <div className="text-[11px] text-text-muted truncate">{check.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="space-y-6">
            <Section title={`Agentes / Máquinas (${agents?.length || 0})`}>
              {agents?.length > 0 ? agents.map(agent => (
                <div key={agent._id} className="bg-bg-panel/50 rounded p-3 space-y-1.5 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-white font-medium">{agent.hostname || 'Agente'}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${agent.status === 'online' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-800 text-text-muted'}`}>
                      {agent.status || 'unknown'}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted">
                    {agent.platform} {agent.arch} · IP: {agent.ip} · v{agent.version}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Último heartbeat: {agent.lastHeartbeat ? new Date(agent.lastHeartbeat).toLocaleString() : 'N/A'}
                  </div>
                  {agent.metrics && (
                    <div className="flex gap-4 text-[11px] text-text-muted">
                      <span>CPU: {agent.metrics.cpu?.toFixed(1)}%</span>
                      <span>RAM: {agent.metrics.memory?.toFixed(1)}%</span>
                      <span>Carga: {agent.metrics.load}</span>
                    </div>
                  )}
                  {agent.capabilities && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Object.entries(agent.capabilities).filter(([, v]) => v).map(([k]) => (
                        <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-primary-900/30 text-accent">{k}</span>
                      ))}
                    </div>
                  )}
                </div>
              )) : <EmptyState text="No hay agentes registrados" />}
            </Section>

            <Section title={`Bases de Datos (${databases?.length || 0})`}>
              {databases?.length > 0 ? databases.map(db => (
                <div key={db._id} className="bg-bg-panel/50 rounded p-3 space-y-1.5 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-white font-medium">{db.name || db.database}</span>
                    <span className="text-[10px] text-text-muted uppercase">{db.engine}</span>
                  </div>
                  <div className="text-[11px] text-text-muted">
                    {db.host}:{db.port} · {db.status || 'unknown'}
                  </div>
                  {db.metrics && (
                    <div className="flex gap-4 text-[11px] text-text-muted">
                      <span>Tablas: {db.metrics.tablesCount ?? '?'}</span>
                      <span>Registros: {db.metrics.recordsCount ?? '?'}</span>
                      {db.metrics.sizeBytes ? <span>Tamaño: {(db.metrics.sizeBytes / 1024 / 1024).toFixed(1)} MB</span> : null}
                    </div>
                  )}
                </div>
              )) : <EmptyState text="No hay bases de datos registradas" />}
            </Section>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title={`Brechas de Seguridad (${breaches?.length || 0})`}>
            {breaches?.length > 0 ? breaches.slice(0, 10).map(b => (
              <div key={b._id} className="bg-bg-panel/50 rounded p-3 space-y-1 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white font-medium">{b.type || 'Brecha'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    b.severity === 'critical' ? 'bg-red-900/40 text-red-400' :
                    b.severity === 'high' ? 'bg-orange-900/40 text-orange-400' :
                    'bg-yellow-900/40 text-yellow-400'
                  }`}>{b.severity}</span>
                </div>
                <div className="text-[11px] text-text-muted">{b.description?.slice(0, 120)}</div>
                <div className="text-[10px] text-text-subtle">{b.detectedAt ? new Date(b.detectedAt).toLocaleString() : ''} · {b.status}</div>
              </div>
            )) : <EmptyState text="No hay brechas registradas" />}
          </Section>

          <Section title={`Escaneos Recientes (${scans?.length || 0})`}>
            {scans?.length > 0 ? scans.slice(0, 10).map(s => (
              <div key={s._id} className="bg-bg-panel/50 rounded p-3 space-y-1 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white font-medium">{s.domain || 'Escaneo'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    s.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400' :
                    s.status === 'failed' ? 'bg-red-900/40 text-red-400' :
                    'bg-yellow-900/40 text-yellow-400'
                  }`}>{s.status}</span>
                </div>
                <div className="text-[11px] text-text-muted">{s.scanType} · {s.startedAt ? new Date(s.startedAt).toLocaleString() : ''}</div>
                {s.vulnerabilities?.length > 0 && (
                  <div className="flex gap-2 text-[10px]">
                    <span className="text-red-400">{s.vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length} críticas/altas</span>
                    <span className="text-yellow-400">{s.vulnerabilities.filter(v => v.severity === 'medium').length} medias</span>
                    <span className="text-text-muted">{s.vulnerabilities.filter(v => v.severity === 'low').length} bajas</span>
                  </div>
                )}
              </div>
            )) : <EmptyState text="No hay escaneos" />}
          </Section>
        </div>

        <Section title={`Historial de Actividad (${logs?.length || 0})`}>
          {logs?.length > 0 ? (
            <div className="max-h-80 overflow-y-auto space-y-1">
              {logs.map(log => (
                <div key={log._id} className="flex items-start gap-3 py-1.5 border-b border-border-theme/50 last:border-0">
                  <span className="text-[10px] text-text-subtle whitespace-nowrap w-32 shrink-0">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                  </span>
                  <span className="text-[11px] text-text-muted">{log.action}</span>
                  {log.resourceType && <span className="text-[10px] text-text-subtle">{log.resourceType}</span>}
                </div>
              ))}
            </div>
          ) : <EmptyState text="No hay actividad registrada" />}
        </Section>

        <Section title={`Historial de Transacciones (${payments.length})`}>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border-theme">
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Período</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Monto</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Concepto</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Estado</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id} className="border-b border-border-theme/40 hover:bg-bg-elevated/20 transition-colors">
                      <td className="py-2.5 px-3 text-white font-medium">{p.month}/{p.year}</td>
                      <td className="py-2.5 px-3 text-white font-semibold">${p.amount}</td>
                      <td className="py-2.5 px-3 text-text-muted max-w-[200px] truncate">{p.concept || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                          p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          p.status === 'overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-gray-500/10 text-text-muted border-gray-500/20'
                        }`}>
                          {p.status === 'paid' ? 'Pagado' : p.status === 'pending' ? 'Pendiente' : p.status === 'overdue' ? 'Vencido' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-text-muted">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState text="No hay transacciones registradas" />}
        </Section>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-bg-panel border border-border-theme rounded p-4">
      <div className="text-[11px] text-text-muted uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color === 'red' ? 'text-red-400' : color === 'cyan' ? 'text-cyan-400' : 'text-text-heading'}`}>{value}</div>
      {sub && <div className="text-[11px] text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-bg-panel border border-border-theme rounded p-4">
      <h2 className="text-[13px] font-semibold text-white mb-3">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="text-[12px] text-text-subtle text-center py-6">{text}</div>;
}

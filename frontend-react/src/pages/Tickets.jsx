import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTickets, createSupportTicket, getTicketDetail, replyTicket, updateTicketStatus } from '../api/api';
import InfoTooltip from '../components/InfoTooltip';

const STATUS_COLORS = {
  open: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  resolved: 'text-green-400 bg-green-500/10 border-green-500/20',
  closed: 'text-text-muted bg-gray-500/10 border-gray-500/20',
};

const PRIORITY_COLORS = {
  low: 'text-text-muted border-gray-600',
  medium: 'text-amber-400 border-amber-600',
  high: 'text-orange-400 border-orange-600',
  critical: 'text-red-400 border-red-600',
};

export default function Tickets() {
  const { token } = useAuth();
  const [view, setView] = useState('list');
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [sending, setSending] = useState(false);
  const replyEndRef = useRef(null);

  useEffect(() => { fetchTickets(); }, [filter]);
  useEffect(() => { if (replyEndRef.current) replyEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [selected?.replies]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const data = await getTickets(token, filter || undefined);
      if (Array.isArray(data)) setTickets(data);
      else setTickets([]);
    } catch { setTickets([]); }
    setLoading(false);
  }

  async function openTicket(ticket) {
    try {
      const data = await getTicketDetail(token, ticket.id);
      if (data && !data.error) { setSelected(data); setView('detail'); setReplyText(''); }
    } catch {}
  }

  async function createTicket() {
    if (!form.subject.trim() || !form.description.trim()) return;
    setSending(true);
    try {
      const data = await createSupportTicket(token, form.subject, form.description, form.priority);
      if (data && !data.error) {
        setForm({ subject: '', description: '', priority: 'medium' });
        setView('list');
        setSelected(null);
        fetchTickets();
      }
    } catch {}
    setSending(false);
  }

  async function sendReply() {
    if (!replyText.trim() || !selected) return;
    try {
      const data = await replyTicket(token, selected.id, replyText);
      if (data && !data.error) {
        setReplyText('');
        const updated = await getTicketDetail(token, selected.id);
        if (updated && !updated.error) setSelected(updated);
        fetchTickets();
      }
    } catch {}
  }

  async function changeStatus(ticketId, status) {
    try {
      await updateTicketStatus(token, ticketId, status);
      fetchTickets();
      if (selected && selected.id === ticketId) {
        const updated = await getTicketDetail(token, ticketId);
        if (updated && !updated.error) setSelected(updated);
      }
    } catch {}
  }

  const statusBadge = (status) => {
    const labels = { open: 'Abierto', in_progress: 'En curso', resolved: 'Resuelto', closed: 'Cerrado' };
    const tips = { open: 'Ticket nuevo, esperando atención.', in_progress: 'Un agente está trabajando en ello.', resolved: 'Problema solucionado correctamente.', closed: 'Ticket cerrado permanentemente.' };
    return <span className="inline-flex items-center gap-1"><span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_COLORS[status] || STATUS_COLORS.open}`}>{labels[status] || status}</span><InfoTooltip text={tips[status] || ''} /></span>;
  };

  const priorityBadge = (p) => {
    const labels = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };
    const tips = { low: 'Sin urgencia. Atención en orden habitual.', medium: 'Atención estándar dentro del horario laboral.', high: 'Requiere atención prioritaria.', critical: 'Emergencia. Respuesta inmediata requerida.' };
    return <span className="inline-flex items-center gap-1"><span className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[p] || PRIORITY_COLORS.medium}`}>{labels[p] || p}</span><InfoTooltip text={tips[p] || ''} /></span>;
  };

  function formatDate(d) {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  return (
    <div className="h-full flex flex-col bg-bg-base">
      <header className="flex-shrink-0 border-b border-white/[0.04] bg-bg-base sticky top-0 z-40">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
              </div>
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Soporte técnico</p>
                <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">Tickets de Soporte</h1>
              </div>
            </div>
            <p className="text-[11px] text-text-muted md:ml-auto md:mr-4">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} · {openCount} abiertos</p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 overflow-x-auto items-center bg-bg-base border border-white/[0.04] rounded-xl p-1">
                {['', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap ${filter === s ? 'bg-cyan-500/10 text-cyan-400' : 'text-text-muted hover:text-text-heading'}`}>
                    {s ? ({ open: 'Abiertos', in_progress: 'En curso', resolved: 'Resueltos', closed: 'Cerrados' })[s] : 'Todos'}
                  </button>
                ))}
              </div>
              {view === 'new' ? (
                <button onClick={() => setView('list')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-muted hover:text-text-heading border border-border-theme transition-all flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  Cancelar
                </button>
              ) : (
                <button onClick={() => setView('new')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex-shrink-0 tour-detail-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  Nuevo Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={`flex-shrink-0 w-full px-4 md:px-8 py-5 ${view === 'detail' ? 'hidden md:block' : ''}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-200">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-blue-400 " />
            <div className="flex items-center gap-2.5 mb-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
              <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Total Tickets <InfoTooltip text="Número total de tickets de soporte creados." /></span>
            </div>
            <p className="text-[26px] font-bold leading-none tracking-tight text-text-heading">{tickets.length}</p>
            <p className="text-[10px] text-text-subtle mt-2">{openCount} abiertos</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-200">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-cyan-400 " />
            <div className="flex items-center gap-2.5 mb-3">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
              <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Abiertos <InfoTooltip text="Tickets nuevos esperando atención de soporte." /></span>
            </div>
            <p className="text-[26px] font-bold leading-none tracking-tight text-cyan-400">{openCount}</p>
            <p className="text-[10px] text-text-subtle mt-2">Pendientes de atención</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-200">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-amber-400 " />
            <div className="flex items-center gap-2.5 mb-3">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">En Curso <InfoTooltip text="Tickets que un agente está procesando activamente." /></span>
            </div>
            <p className="text-[26px] font-bold leading-none tracking-tight text-amber-400">{inProgressCount}</p>
            <p className="text-[10px] text-text-subtle mt-2">En proceso de resolución</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-200">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-emerald-400 " />
            <div className="flex items-center gap-2.5 mb-3">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Resueltos <InfoTooltip text="Tickets cerrados exitosamente con solución aplicada." /></span>
            </div>
            <p className="text-[26px] font-bold leading-none tracking-tight text-emerald-400">{resolvedCount}</p>
            <p className="text-[10px] text-text-subtle mt-2">{tickets.length > 0 ? Math.round(resolvedCount / tickets.length * 100) : 0}% tasa de resolución</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden w-full px-4 md:px-8 pb-8">
        <div className="h-full rounded-xl border border-white/[0.04] bg-white/[0.015] flex overflow-hidden">
          <aside className="hidden md:block w-64 flex-shrink-0 border-r border-border-theme/50 overflow-y-auto bg-white/[0.015] tour-detail-2">
            <div className="p-3">
              <p className="text-[10px] text-text-subtle uppercase tracking-wide font-medium mb-2 px-1">Historial <InfoTooltip text="Lista de tickets anteriores y actuales." placement="right" /></p>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <svg className="w-8 h-8 mx-auto mb-2 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
                  <p className="text-xs">No hay tickets</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {tickets.map(t => (
                    <div key={t.id}
                      onClick={() => openTicket(t)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                        selected?.id === t.id ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-bg-elevated border border-transparent'
                      }`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'open' ? 'bg-cyan-400' : t.status === 'in_progress' ? 'bg-amber-400' : t.status === 'resolved' ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{t.subject}</p>
                        <p className="text-[10px] text-text-subtle">{t.id?.substring(0, 8)} · {formatDate(t.updated_at || t.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {t.reply_count > 0 && <span className="text-[9px] text-text-subtle bg-bg-elevated px-1.5 py-0.5 rounded-full">{t.reply_count}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className="flex-1 flex flex-col overflow-hidden">
            {view === 'new' ? (
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto">
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 md:p-6">
                    <h2 className="text-base font-semibold text-white mb-1">Crear Nuevo Ticket</h2>
                    <p className="text-xs text-text-muted mb-5">Describe tu consulta y nuestro equipo te responderá a la brevedad.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-medium text-text-muted mb-1.5">Asunto</label>
                        <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                          placeholder="Ej: Problema al conectar base de datos"
                          className="w-full bg-bg-panel border border-border-theme rounded-lg px-3 py-2 text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-text-muted mb-1.5">Descripción</label>
                        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Describe tu consulta en detalle..." rows={5}
                          className="w-full bg-bg-panel border border-border-theme rounded-lg px-3 py-2 text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-text-muted mb-1.5">Prioridad</label>
                        <div className="flex gap-2">
                          {['low', 'medium', 'high', 'critical'].map(p => (
                            <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${form.priority === p ? PRIORITY_COLORS[p] + ' bg-bg-elevated' : 'text-text-muted border-border-theme hover:text-text-body hover:border-surface-600'}`}>
                              {{ low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' }[p]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={createTicket} disabled={sending || !form.subject.trim() || !form.description.trim()}
                          className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-[13px] font-medium hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                          {sending ? 'Enviando...' : 'Crear Ticket'}
                        </button>
                        <button onClick={() => setView('list')}
                          className="px-4 py-2 bg-bg-elevated text-text-muted border border-border-theme rounded-lg text-[13px] font-medium hover:text-text-heading hover:border-surface-600 transition-all">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : view === 'detail' && selected ? (
              <>
                <div className="flex-shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 md:px-6 py-3 border-b border-border-theme/50 bg-white/[0.015]">
                  <button onClick={() => { setView('list'); setSelected(null); }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-heading transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    Volver
                  </button>
                  <div className="h-4 w-px bg-surface-600 hidden sm:block" />
                  <span className="text-sm font-medium text-white truncate flex-1 min-w-[120px]">{selected.subject}</span>
                  <div className="flex gap-2 md:ml-auto">
                    {statusBadge(selected.status)}
                    {priorityBadge(selected.priority)}
                  </div>
                  <div className="flex gap-1">
                    {selected.status === 'open' && (
                      <button onClick={() => changeStatus(selected.id, 'in_progress')} className="px-2.5 py-1 text-[11px] font-medium rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">Tomar</button>
                    )}
                    {selected.status !== 'resolved' && selected.status !== 'closed' && (
                      <button onClick={() => changeStatus(selected.id, 'resolved')} className="px-2.5 py-1 text-[11px] font-medium rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">Resolver</button>
                    )}
                    {selected.status !== 'closed' && (
                      <button onClick={() => changeStatus(selected.id, 'closed')} className="px-2.5 py-1 text-[11px] font-medium rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">Cerrar</button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 scrollbar-custom">
                  {selected.replies?.map((r, i) => (
                    <div key={r.id || i} className={`flex ${r.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] md:max-w-[75%] rounded-xl px-4 py-3 ${r.role === 'user' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'border border-white/[0.04] bg-white/[0.01]'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[11px] font-medium ${r.role === 'user' ? 'text-cyan-400' : 'text-text-muted'}`}>
                            {r.role === 'user' ? 'Tú' : r.role === 'agent' ? 'Soporte' : 'Sistema'}
                          </span>
                          <span className="text-[10px] text-text-subtle">{r.created_at ? formatDate(r.created_at) : ''}</span>
                        </div>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{r.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={replyEndRef} />
                </div>

                <div className="flex-shrink-0 border-t border-border-theme/50 p-3 md:p-4 bg-bg-panel/60">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] text-text-subtle font-medium uppercase tracking-wider">Comentarios</span>
                    <InfoTooltip text="Respuestas del ticket. Presiona Enter para enviar." />
                  </div>
                  <div className="flex gap-2 md:gap-3">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Escribe tu respuesta..."
                      className="flex-1 bg-bg-panel border border-border-theme rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all" />
                    <button onClick={sendReply} disabled={!replyText.trim()}
                      className="px-4 py-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm font-medium hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19V5m0 0l-7 7m7-7l7 7"/></svg>
                      <span className="hidden sm:inline">Enviar</span> <InfoTooltip text="Envía tu respuesta al ticket de soporte." placement="top" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                    <svg className="w-12 h-12 mb-3 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
                    <p className="text-sm">No hay tickets {filter ? 'con ese estado' : 'todavía'}</p>
                    <button onClick={() => setView('new')} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Crear tu primer ticket</button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="hidden md:flex flex-col items-center text-text-muted">
                      <svg className="w-16 h-16 mb-4 text-surface-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      <p className="text-sm font-medium text-text-muted">Seleccione o cree un chat</p>
                      <p className="text-xs text-text-subtle mt-1">Elija un ticket de la lista o cree uno nuevo</p>
                    </div>
                    <div className="w-full md:hidden space-y-2 px-1 pb-4">
                      {tickets.map(t => (
                        <div key={t.id} onClick={() => openTicket(t)}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-lg rounded-xl border border-white/[0.04] bg-white/[0.015] active:scale-[0.98] transition-all">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.status === 'open' ? 'bg-cyan-400' : t.status === 'in_progress' ? 'bg-amber-400' : t.status === 'resolved' ? 'bg-green-400' : 'bg-gray-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-white truncate">{t.subject}</p>
                            <p className="text-[11px] text-text-muted mt-0.5">{t.id?.substring(0, 8)} · {formatDate(t.updated_at || t.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {t.reply_count > 0 && <span className="text-[10px] text-text-subtle bg-bg-elevated/80 px-1.5 py-0.5 rounded-full">{t.reply_count}</span>}
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

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../api/api';

const TOPIC_LABELS = {
  ley_21719: 'Ley 21.719 — Protección de Datos Personales',
  ciberseguridad: 'Ciberseguridad',
  brechas: 'Protocolo de Brechas (Art. 26)',
  arco: 'Derechos ARCO (Arts. 8-13)',
  consentimientos: 'Gestión de Consentimientos (Art. 12)',
  general: 'General',
};

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSignature) setHasSignature(true);
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const end = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={560}
        height={180}
        className="w-full bg-white rounded-lg border border-border-theme cursor-crosshair touch-none"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-[11px] text-text-subtle">Dibuja tu firma en el recuadro (mouse o táctil).</p>
        <button type="button" onClick={clear} className="text-[11px] text-red-400 hover:text-red-300 font-medium">
          Limpiar
        </button>
      </div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="text-[18px] font-bold text-white tracking-widest uppercase">SecureLab</div>
          <p className="text-[11px] text-text-subtle mt-1">Cumplimiento Ley 21.719 — Protección de Datos Personales</p>
        </div>
        <div className="bg-bg-panel border border-border-theme rounded-xl shadow-xl p-5 md:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SignInvite() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ titularName: '', titularRut: '', titularEmail: '' });
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    api.getPublicInvite(token).then((res) => {
      if (!active) return;
      if (res?.error) setError(res.error);
      else {
        setInvite(res);
        setForm({
          titularName: res.recipientName || '',
          titularRut: res.recipientRut || '',
          titularEmail: res.recipientEmail || '',
        });
      }
      setLoading(false);
    }).catch(() => { if (active) { setError('No se pudo cargar la invitación'); setLoading(false); } });
    return () => { active = false; };
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = invite.kind === 'consent'
      ? { accepted: accepted ? 'true' : 'false', titularEmail: form.titularEmail, titularName: form.titularName, titularRut: form.titularRut }
      : { signatureData: signature };
    const res = await api.submitPublicInvite(token, payload);
    if (res?.error) setError(res.error);
    else setDone(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[12px] text-text-subtle">Cargando invitación...</span>
        </div>
      </Shell>
    );
  }

  if (error && !invite) {
    return (
      <Shell>
        <div className="text-center py-8">
          <p className="text-[14px] text-red-400 font-medium mb-2">Invitación no válida</p>
          <p className="text-[12px] text-text-subtle">{error}</p>
        </div>
      </Shell>
    );
  }

  if (invite?.status === 'used') {
    return (
      <Shell>
        <div className="text-center py-8">
          <p className="text-[14px] text-emerald-400 font-medium mb-2">Este enlace ya fue utilizado</p>
          <p className="text-[12px] text-text-subtle">La invitación era de un solo uso y ya fue completada. Si necesitas un nuevo enlace, contacta a la empresa.</p>
        </div>
      </Shell>
    );
  }

  if (invite?.status === 'expired') {
    return (
      <Shell>
        <div className="text-center py-8">
          <p className="text-[14px] text-yellow-400 font-medium mb-2">Invitación expirada</p>
          <p className="text-[12px] text-text-subtle">Este enlace ha caducado. Solicita a la empresa una nueva invitación.</p>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="text-[15px] text-white font-semibold mb-2">
            {invite.kind === 'consent' ? 'Consentimiento registrado' : 'Firma registrada'}
          </p>
          <p className="text-[12px] text-text-subtle">
            {invite.kind === 'consent'
              ? 'Tu consentimiento fue registrado correctamente conforme al Art. 12 de la Ley 21.719. Puedes cerrar esta página.'
              : 'Tu firma quedó registrada como constancia de la capacitación recibida. Puedes cerrar esta página.'}
          </p>
        </div>
      </Shell>
    );
  }

  const isConsent = invite.kind === 'consent';

  return (
    <Shell>
      <div className="mb-5">
        <h1 className="text-[16px] font-semibold text-white">
          {isConsent ? 'Solicitud de Consentimiento' : 'Firma de Constancia de Capacitación'}
        </h1>
        <p className="text-[11px] text-text-subtle mt-1">
          {invite.companyName ? `Solicitado por ${invite.companyName} · ` : ''}
          Enlace de un solo uso · Expira el {new Date(invite.expiresAt).toLocaleDateString('es-CL')}
        </p>
      </div>

      {isConsent ? (
        <form onSubmit={submit} className="space-y-4">
          <div className="bg-bg-base/50 border border-border-theme rounded-lg p-4">
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Finalidad del tratamiento</p>
            <p className="text-[13px] text-white">{invite.purpose}</p>
            {invite.dataCategories?.length > 0 && (
              <>
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mt-3 mb-1.5">Datos autorizados</p>
                <div className="flex flex-wrap gap-1.5">
                  {invite.dataCategories.map((c, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-300 border border-accent-border">{c}</span>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Nombre completo *</label>
              <input value={form.titularName} onChange={e => setForm({ ...form, titularName: e.target.value })} required
                className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent placeholder-text-subtle" />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">RUT</label>
              <input value={form.titularRut} onChange={e => setForm({ ...form, titularRut: e.target.value })} placeholder="XX.XXX.XXX-X"
                className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent placeholder-text-subtle" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1.5">Email *</label>
            <input value={form.titularEmail} onChange={e => setForm({ ...form, titularEmail: e.target.value })} type="email" required
              className="w-full bg-bg-base border border-border-theme text-[12px] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent placeholder-text-subtle" />
          </div>
          <label className="flex items-start gap-3 bg-bg-base/40 border border-border-theme/60 rounded-lg p-3 cursor-pointer">
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border-theme bg-bg-base text-primary-500" />
            <span className="text-[11px] text-text-body leading-relaxed">
              Otorgo mi <strong className="text-white">consentimiento explícito e informado</strong> para el tratamiento de mis datos personales
              con la finalidad indicada, conforme al Art. 12 de la Ley 21.719. Entiendo que puedo revocar este consentimiento en cualquier momento
              {invite.dpdEmail ? ` escribiendo a ${invite.dpdEmail}` : ''}.
            </span>
          </label>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <button type="submit" disabled={!accepted || submitting}
            className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-text-heading text-[13px] font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none">
            {submitting ? 'Enviando...' : 'Otorgar Consentimiento'}
          </button>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="bg-bg-base/50 border border-border-theme rounded-lg p-4 space-y-2">
            <div>
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1">Empleado</p>
              <p className="text-[13px] text-white">{invite.training?.employeeName}{invite.training?.employeePosition ? ` · ${invite.training.employeePosition}` : ''}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1">Capacitación</p>
              <p className="text-[13px] text-white">{TOPIC_LABELS[invite.training?.topic] || invite.training?.topic}</p>
              <p className="text-[11px] text-text-subtle">Fecha: {invite.training?.date ? new Date(invite.training.date).toLocaleDateString('es-CL') : '-'}</p>
            </div>
          </div>
          <p className="text-[11px] text-text-body leading-relaxed">
            Al firmar declaro haber <strong className="text-white">recibido y comprendido</strong> la capacitación indicada,
            conforme al Art. 28 letra c) de la Ley 21.719 de Protección de Datos Personales.
          </p>
          <SignaturePad onChange={setSignature} />
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <button type="submit" disabled={!signature || submitting}
            className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-text-heading text-[13px] font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none">
            {submitting ? 'Enviando...' : 'Firmar Constancia'}
          </button>
        </form>
      )}
    </Shell>
  );
}

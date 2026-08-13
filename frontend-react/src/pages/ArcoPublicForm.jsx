import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const TIPOS = [
  { value: 'acceso', label: 'Acceso a mis datos' },
  { value: 'rectificacion', label: 'Rectificación de datos' },
  { value: 'cancelacion', label: 'Cancelación (supresión) de datos' },
  { value: 'oposicion', label: 'Oposición al tratamiento' },
  { value: 'portabilidad', label: 'Portabilidad de datos' },
  { value: 'bloqueo', label: 'Bloqueo temporal de datos' },
];

export default function ArcoPublicForm() {
  const [step, setStep] = useState('search');
  const [companySearch, setCompanySearch] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [form, setForm] = useState({
    nombre: '', rut: '', email: '', telefono: '',
    tipo: 'acceso', descripcion: '', datosAEliminar: '', eliminacionTotal: false,
  });
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const captchaRendered = useRef(false);

  useEffect(() => {
    if (step !== 'form' || captchaRendered.current) return;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    window.onTurnstileArcoSuccess = (token) => { setCaptchaToken(token); setCaptchaError(''); };
    window.onTurnstileArcoError = () => { setCaptchaError('Error de verificación.'); setCaptchaToken(''); };
    captchaRendered.current = true;
    return () => { document.head.removeChild(script); };
  }, [step]);

  useEffect(() => {
    if (companySearch.length < 2) { setCompanies([]); return; }
    const timer = setTimeout(async () => {
      setLoadingCompanies(true);
      try {
        const res = await fetch('/api/arco/companies/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ q: companySearch }),
        });
        const data = await res.json();
        if (data.companies) setCompanies(data.companies);
      } catch (e) { /* ignore */ }
      setLoadingCompanies(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [companySearch]);

  const selectCompany = (c) => {
    setSelectedCompany(c);
    setCompanySearch(c.companyName);
    setCompanies([]);
    setStep('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.rut || !form.email) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    if (!captchaToken) {
      setError('Completa la verificación de seguridad');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/arco/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          solicitante: {
            nombre: form.nombre, rut: form.rut,
            email: form.email, telefono: form.telefono,
          },
          captchaToken,
          tipo: form.tipo,
          descripcion: form.descripcion,
          datosAEliminar: form.datosAEliminar,
          eliminacionTotal: form.eliminacionTotal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Error al enviar solicitud');
      }
    } catch (err) {
      setError('Error de conexión');
    }
    setSubmitting(false);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-panel rounded-2xl p-8 text-center border border-border-theme">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Solicitud Enviada</h2>
          <p className="text-sm text-text-muted mb-6">{result.message}</p>
          <p className="text-xs text-text-muted mb-2">ID de solicitud: {result.requestId}</p>
          <p className="text-[11px] text-text-subtle mb-6">Guarda este ID para hacer seguimiento</p>
          <div className="flex gap-2 justify-center">
            <Link to={`/track`} className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 text-sm transition-colors">
              Hacer seguimiento
            </Link>
            <Link to="/" className="px-4 py-2 bg-bg-elevated text-text-body border border-border-theme rounded-lg hover:bg-bg-elevated text-sm transition-colors">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="border-b border-border-theme px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-white font-bold text-sm">Invisia</Link>
          <span className="text-[10px] text-text-muted">Ley 21.719 - Derechos ARCO</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="bg-bg-panel rounded-2xl p-6 md:p-8 border border-border-theme">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent-subtle rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-heading">Ejercer mis Derechos ARCO</h1>
              <p className="text-[11px] text-text-muted">Ley 21.719 - Protección de Datos Personales</p>
            </div>
          </div>

          {step === 'search' && (
            <div>
              <p className="text-sm text-text-muted mb-4">
                Selecciona la empresa a la que deseas solicitar el ejercicio de tus derechos ARCO (Acceso, Rectificación, Cancelación, Oposición, Portabilidad).
              </p>
              <div className="relative">
                <input
                  type="text" value={companySearch}
                  onChange={e => setCompanySearch(e.target.value)}
                  placeholder="Busca el nombre de la empresa..."
                  className="w-full px-4 py-3 bg-bg-base border border-border-theme rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                {loadingCompanies && (
                  <div className="absolute right-3 top-3">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {companies.length > 0 && (
                <div className="mt-2 border border-border-theme rounded-xl overflow-hidden">
                  {companies.map(c => (
                    <button
                      key={c.id} onClick={() => selectCompany(c)}
                      className="w-full px-4 py-3 text-left text-sm text-text-body hover:bg-bg-elevated transition-colors border-b border-border-theme last:border-b-0"
                    >
                      <span className="text-white font-medium">{c.companyName}</span>
                      {c.domain && <span className="text-text-muted ml-2">{c.domain}</span>}
                    </button>
                  ))}
                </div>
              )}
              {companySearch.length >= 2 && companies.length === 0 && !loadingCompanies && (
                <p className="text-xs text-text-muted mt-2">No se encontraron empresas. Intenta con otro nombre.</p>
              )}
            </div>
          )}

          {step === 'form' && selectedCompany && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-bg-base rounded-xl border border-border-theme">
                <p className="text-xs text-text-muted">Empresa seleccionada</p>
                <p className="text-sm font-medium text-text-heading">{selectedCompany.companyName}</p>
              </div>

              <button type="button" onClick={() => { setStep('search'); setSelectedCompany(null); setCompanySearch(''); }}
                className="text-xs text-accent hover:text-primary-300 transition-colors">
                &larr; Cambiar empresa
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Nombre completo *</label>
                  <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-base border border-border-theme rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    placeholder="Tu nombre" />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">RUT *</label>
                  <input type="text" value={form.rut} onChange={e => setForm(f => ({ ...f, rut: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-base border border-border-theme rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    placeholder="12.345.678-9" />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-base border border-border-theme rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    placeholder="correo@ejemplo.cl" />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Teléfono</label>
                  <input type="text" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-base border border-border-theme rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    placeholder="+56 9 1234 5678" />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-text-muted block mb-1">Tipo de solicitud *</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-bg-base border border-border-theme rounded-xl text-white text-sm focus:outline-none focus:border-primary-500">
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-text-muted block mb-1">Descripción / Fundamentación</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3}
                  className="w-full px-3 py-2.5 bg-bg-base border border-border-theme rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  placeholder="Describe los motivos de tu solicitud..." />
              </div>

              <div>
                <label className="text-[11px] text-text-muted block mb-1">Datos específicos a eliminar (si aplica)</label>
                <input type="text" value={form.datosAEliminar} onChange={e => setForm(f => ({ ...f, datosAEliminar: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-bg-base border border-border-theme rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  placeholder="Ej: historial de compras, datos de facturación..." />
              </div>

              <label className="flex items-center gap-3 p-3 bg-bg-base rounded-xl border border-border-theme cursor-pointer">
                <input type="checkbox" checked={form.eliminacionTotal} onChange={e => setForm(f => ({ ...f, eliminacionTotal: e.target.checked }))}
                  className="w-4 h-4 rounded border-surface-600 bg-bg-elevated text-primary-500 focus:ring-primary-500" />
                <div>
                  <span className="text-sm text-text-heading">Solicitar eliminación total de mis datos</span>
                  <p className="text-[10px] text-text-muted">Solicito que esta empresa elimine todos mis datos personales de sus sistemas</p>
                </div>
              </label>

              <div className="flex justify-center">
                <div id="cf-turnstile-arco" className="cf-turnstile" data-sitekey="1x00000000000000000000AA" data-theme="dark"
                  data-callback="onTurnstileArcoSuccess" data-error-callback="onTurnstileArcoError" />
              </div>
              {captchaError && <p className="text-xs text-red-400 text-center">{captchaError}</p>}
              {error && <p className="text-xs text-red-400">{error}</p>}

              <button type="submit" disabled={submitting || !captchaToken}
                className="w-full py-3 bg-accent-subtle text-accent rounded-xl hover:bg-primary-500/30 transition-colors text-sm font-medium disabled:opacity-50">
                {submitting ? 'Enviando...' : 'Enviar Solicitud ARCO'}
              </button>

              <p className="text-[10px] text-text-subtle text-center">
                Al enviar, aceptas que tus datos sean gestionados por la empresa seleccionada según la Ley 21.719.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '/logo-nuevo.png';
import AlertBanner from '../components/AlertBanner';

const I = {
  shield: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  check: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  lock: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  search: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  globe: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>,
  arrowRight: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>,
  users: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  document: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  clock: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  star: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>,
  menu: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>,
  xmark: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>,
  trash: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
};

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showArcoModal, setShowArcoModal] = useState(false);
  const [arcoForm, setArcoForm] = useState({ nombre: '', rut: '', email: '', telefono: '', tipo: 'acceso', descripcion: '', datosAEliminar: '', eliminacionTotal: false });
  const [arcoSubmitting, setArcoSubmitting] = useState(false);
  const [arcoResult, setArcoResult] = useState(null);
  const [arcoError, setArcoError] = useState('');
  const [arcoCaptchaToken, setArcoCaptchaToken] = useState('');
  const arcoCaptchaRendered = useRef(false);
  const [showViolacionModal, setShowViolacionModal] = useState(false);
  const [violacionForm, setViolacionForm] = useState({ nombre: '', rut: '', email: '', telefono: '', tipoViolacion: 'no_reportar_brecha', descripcion: '', fechaIncidente: '', datosAfectados: '' });
  const [violacionSubmitting, setViolacionSubmitting] = useState(false);
  const [violacionResult, setViolacionResult] = useState(null);
  const [violacionError, setViolacionError] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (companySearch.length < 2) { setCompanies([]); return; }
    const timer = setTimeout(() => {
      setLoadingCompanies(true);
      fetch('/api/compliant-companies?search=' + encodeURIComponent(companySearch))
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setCompanies(data); })
        .catch(() => {})
        .finally(() => setLoadingCompanies(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [companySearch]);

  const [publicAlerts, setPublicAlerts] = useState([]);

  useEffect(() => {
    fetch('/api/admin/alerts/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        const filtered = data.filter(a => a.showOnLanding !== false);
        setPublicAlerts(filtered);
      }
    }).catch(() => {});
  }, []);

  const handleArcoSubmit = async (e) => {
    e.preventDefault();
    if (!arcoForm.nombre || !arcoForm.rut || !arcoForm.email) {
      setArcoError('Completa todos los campos obligatorios');
      return;
    }
    setArcoSubmitting(true);
    setArcoError('');
    try {
      const res = await fetch('/api/arco/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany?.userId,
          solicitante: { nombre: arcoForm.nombre, rut: arcoForm.rut, email: arcoForm.email, telefono: arcoForm.telefono },
          captchaToken: arcoCaptchaToken || 'development-bypass',
          tipo: arcoForm.tipo,
          descripcion: arcoForm.descripcion,
          datosAEliminar: arcoForm.datosAEliminar,
          eliminacionTotal: arcoForm.eliminacionTotal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setArcoResult(data);
      } else {
        setArcoError(data.error || 'Error al enviar solicitud');
      }
    } catch (err) {
      setArcoError('Error de conexión');
    }
    setArcoSubmitting(false);
  };

  useEffect(() => {
    if (!showArcoModal || arcoCaptchaRendered.current) return;
    const existing = document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
    if (existing) {
      if (window.turnstile) {
        window.turnstile.render('#cf-turnstile-arco', { sitekey: '0x4AAAAAAD4bBqtEEyeh9-4J', theme: 'dark', callback: (token) => setArcoCaptchaToken(token), 'error-callback': () => setArcoCaptchaToken('') });
        arcoCaptchaRendered.current = true;
      }
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.onload = () => {
      if (window.turnstile) {
        window.turnstile.render('#cf-turnstile-arco', { sitekey: '0x4AAAAAAD4bBqtEEyeh9-4J', theme: 'dark', callback: (token) => setArcoCaptchaToken(token), 'error-callback': () => setArcoCaptchaToken('') });
        arcoCaptchaRendered.current = true;
      }
    };
    document.head.appendChild(script);
  }, [showArcoModal]);

  const sections = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'ley', label: 'La Ley' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'empresas', label: 'Empresas' },
    { id: 'contacto', label: 'Contacto' },
  ];

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-body">
      {/* Alerts banner */}
      {publicAlerts.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[60] p-3 pb-0">
          <AlertBanner alerts={publicAlerts} />
        </div>
      )}

      {/* Nav */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-bg-base/90 backdrop-blur-xl border-b border-border-theme' : 'bg-transparent'} ${publicAlerts.length > 0 ? 'mt-16' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('inicio')}>
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-bg-panel flex items-center justify-center">
              <img src={logo} alt="SecureLab" className="w-full h-full object-contain" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight">SecureLab</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className="px-3 py-1.5 text-[12px] text-text-muted hover:text-text-heading hover:bg-white/[0.06] rounded-lg transition-all duration-200">
                {s.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login"
              className="hidden md:inline-flex px-4 py-1.5 text-[12px] font-medium text-text-body hover:text-text-heading transition-colors">
              Iniciar Sesión
            </Link>
            <Link to="/register"
              className="px-4 py-1.5 text-[12px] font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-200">
              Registrarse
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-text-muted hover:text-text-heading">
              {menuOpen ? I.xmark : I.menu}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-bg-panel/95 backdrop-blur-xl border-t border-border-theme px-6 py-4 space-y-2">
            {sections.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className="block w-full text-left px-3 py-2 text-[13px] text-text-muted hover:text-text-heading hover:bg-white/[0.06] rounded-lg">
                {s.label}
              </button>
            ))}
            <Link to="/login" className="block px-3 py-2 text-[13px] text-text-body hover:text-text-heading">Iniciar Sesión</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-surface-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Ley 21.719 — Protección de Datos Personales en Chile
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6 tracking-tight">
            Cumplimiento <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Simplificado</span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            La nueva Ley de Protección de Datos Personales exige que tu empresa implemente medidas concretas. 
            Te ayudamos a cumplir con cada artículo, automatizar procesos y proteger a tus titulares.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register"
              className="px-8 py-3 text-[14px] font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400 shadow-lg shadow-cyan-500/25 transition-all duration-200">
              Comenzar Ahora
            </Link>
            <button onClick={() => scrollTo('ley')}
              className="px-8 py-3 text-[14px] font-medium rounded-xl border border-border-theme text-text-body hover:bg-white/[0.06] hover:border-surface-600 transition-all duration-200">
              Conoce la Ley
            </button>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { n: 'Automático', d: 'Escaneo y mapeo de datos personales' },
              { n: 'Cumplimiento', d: 'Checklist completo Ley 21.719' },
              { n: 'Consulta tu precio', d: 'Soluciones adaptadas a tu empresa' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-[22px] font-bold text-white mb-1">{item.n}</p>
                <p className="text-[11px] text-text-muted">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ley */}
      <section id="ley" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-900/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-widest rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">¿Qué cambió?</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Ley 21.719 de Protección de Datos</h2>
            <p className="text-text-muted max-w-3xl mx-auto leading-relaxed">
              Publicada el 13 de diciembre de 2022, esta ley moderniza el marco legal chileno creando la 
              Agencia de Protección de Datos Personales (APDP) y estableciendo estándares internacionales 
              para el tratamiento de datos personales.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: I.shield, title: 'Consentimiento Explícito', desc: 'Art. 12 — El consentimiento debe ser libre, específico, informado e inequívoco. Cada finalidad requiere autorización separada.' },
              { icon: I.lock, title: 'Delegado de Protección de Datos', desc: 'Art. 28 — Toda empresa debe designar un DPD interno o externo, responsable de supervisar el cumplimiento normativo.' },
              { icon: I.globe, title: 'Notificación de Brechas', desc: 'Art. 26 — Las brechas de seguridad deben notificarse a la APDP en un plazo máximo de 48 horas desde su detección.' },
              { icon: I.document, title: 'Inventario de Datos', desc: 'Art. 15 — Llevar un registro detallado de todas las bases de datos personales, su finalidad, base legal y medidas de seguridad.' },
              { icon: I.users, title: 'Derechos ARCO + Portabilidad', desc: 'Arts. 8-13 — Los titulares pueden acceder, rectificar, suprimir, oponerse y portar sus datos. Debes responder en 10 días hábiles.' },
              { icon: I.clock, title: 'Registro APDP', desc: 'Art. 31 — Las empresas deben registrarse ante la Agencia de Protección de Datos Personales e informar sus tratamientos de datos.' },
            ].map((item, i) => (
              <div key={i} className="bg-bg-panel/40 border border-border-theme rounded-xl p-6 hover:border-emerald-500/20 hover:bg-bg-panel/60 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-[12px] text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Sanciones de hasta <span className="text-red-400">50.000 UF</span></h3>
                <p className="text-text-muted leading-relaxed text-[13px]">
                  El incumplimiento de la Ley 21.719 puede resultar en multas que van desde 5.000 UF (infracciones 
                  graves) hasta 50.000 UF (infracciones gravísimas, aproximadamente $1.900 millones CLP). 
                  Además, la APDP puede ordenar la suspensión temporal o definitiva del tratamiento de datos.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { t: 'Gravísimas', m: 'Hasta 50.000 UF', c: 'text-red-400' },
                  { t: 'Graves', m: 'Hasta 10.000 UF', c: 'text-yellow-400' },
                  { t: 'Leves', m: 'Hasta 5.000 UF', c: 'text-blue-400' },
                  { t: 'Suspensión', m: 'Temporal/Definitiva', c: 'text-text-muted' },
                ].map((s, i) => (
                  <div key={i} className="bg-bg-base/60 border border-border-theme rounded-lg p-4 text-center">
                    <p className={`text-[11px] font-semibold uppercase tracking-wider ${s.c} mb-1`}>{s.t}</p>
                    <p className="text-[15px] font-bold text-text-heading">{s.m}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-24 bg-bg-panel/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-widest rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">Nuestra Solución</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Todo lo que necesitas para cumplir</h2>
            <p className="text-text-muted max-w-2xl mx-auto leading-relaxed">
              Desde el escaneo automático de bases de datos hasta la gestión de solicitudes ARCO, 
              te cubrimos en cada etapa del proceso de cumplimiento.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: I.search, t: 'Escaneo Automático', d: 'Descubre automáticamente bases de datos en tu infraestructura y clasifica los datos personales que contienen.' },
              { icon: I.document, t: 'Inventario de Datos', d: 'Mantén un registro actualizado de todas tus bases de datos personales con su nivel de riesgo y base legal.' },
              { icon: I.check, t: 'Gestión de Consentimientos', d: 'Genera, almacena y gestiona consentimientos explícitos por finalidad, con prueba de auditoría.' },
              { icon: I.shield, t: 'Portal ARCO', d: 'Portal para que los titulares ejerzan sus derechos y panel de gestión con tiempos de respuesta.' },
              { icon: I.users, t: 'Notificación de Brechas', d: 'Detección, clasificación y notificación automática a la APDP dentro del plazo legal de 48 horas.' },
              { icon: I.clock, t: 'Capacitaciones', d: 'Registro y seguimiento de capacitaciones en protección de datos para tu equipo.' },
              { icon: I.star, t: 'Reportes PDF', d: 'Genera informes de cumplimiento listos para auditoría con un solo clic.' },
              { icon: I.lock, t: 'DPD Integrado', d: 'Designa tu Delegado de Protección de Datos y recibe alertas inteligentes de cumplimiento.' },
            ].map((s, i) => (
              <div key={i} className="bg-bg-base/60 border border-border-theme rounded-xl p-5 hover:border-emerald-500/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                  {s.icon}
                </div>
                <h3 className="text-[13px] font-semibold text-white mb-1.5">{s.t}</h3>
                <p className="text-[11px] text-text-muted leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Empresas Cumplidoras */}
      <section id="empresas" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-widest rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">Portal de Datos</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Ejerce tus Derechos ARCO</h2>
            <p className="text-text-muted max-w-2xl mx-auto leading-relaxed">
              Busca la empresa que trata tus datos personales y accede directamente a su portal de 
              solicitudes para ejercer tus derechos de acceso, rectificación, supresión, oposición o portabilidad.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="relative mb-6">
              <input value={companySearch} onChange={e => setCompanySearch(e.target.value)}
                placeholder="Busca una empresa por nombre o RUT..."
                className="w-full bg-bg-panel border border-border-theme text-[14px] text-white rounded-xl pl-11 pr-4 py-4 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 placeholder-text-subtle transition-all" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">{I.search}</span>
              {loadingCompanies && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </span>
              )}
            </div>

            {companySearch.length >= 2 && companies.length === 0 && !loadingCompanies && (
              <div className="text-center py-8 text-text-muted text-[13px]">
                No encontramos empresas con ese nombre. ¿Tu empresa cumple con la ley? <Link to="/register" className="text-cyan-400 hover:underline">Regístrate aquí</Link>
              </div>
            )}

            {companies.length > 0 && (
              <div className="space-y-3 mb-6">
                {companies.map(c => (
                  <div key={c.rut}
                    onClick={() => setSelectedCompany(selectedCompany?.rut === c.rut ? null : c)}
                    className={`bg-bg-panel/60 border rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                      selectedCompany?.rut === c.rut ? 'border-cyan-500/40 bg-bg-panel' : 'border-border-theme/50 hover:border-cyan-500/20 hover:bg-bg-panel/80'
                    }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold text-text-heading">{c.name}</h4>
                        <p className="text-[11px] text-text-muted">RUT: {c.rut}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {c.complianceLevel === 'certified' ? 'Certificado' : 'Cumple'}
                        </span>
                        <span className={`text-text-muted transition-transform ${selectedCompany?.rut === c.rut ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                      </div>
                    </div>

                    {selectedCompany?.rut === c.rut && (
                      <div className="mt-5 pt-5 border-t border-border-theme/50 space-y-4">
                        {c.description && (
                          <p className="text-[12px] text-text-muted leading-relaxed">{c.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedCompany(c); setShowArcoModal(true); }}
                            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-[12px] font-medium">
                            {I.document}
                            Ejercer Derecho ARCO
                            {I.arrowRight}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedCompany(c); setViolacionForm(f => ({ ...f, nombre: '', rut: '', email: '', telefono: '', tipoViolacion: 'no_reportar_brecha', descripcion: '', fechaIncidente: '', datosAfectados: '' })); setViolacionError(''); setViolacionResult(null); setShowViolacionModal(true); }}
                            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-[12px] font-medium">
                            {I.alert}
                            Denunciar Violación
                            {I.arrowRight}
                          </button>
                          {c.website && (
                            <a href={c.website} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-bg-elevated/60 text-text-muted border border-border-theme hover:border-surface-600 transition-all text-[12px]">
                              {I.globe}
                              {c.website.replace('https://', '')}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-cyan-500/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">¿Listo para cumplir con la ley?</h2>
          <p className="text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed text-[15px]">
            Únete a las empresas que ya están preparadas para la Ley 21.719.
            Comienza hoy y escala cuando lo necesites.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register"
              className="px-10 py-4 text-[15px] font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400 shadow-lg shadow-emerald-500/25 transition-all duration-200">
              Crear Cuenta
            </Link>

          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-16 border-t border-border-theme">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-bg-panel flex items-center justify-center">
                  <img src={logo} alt="SecureLab" className="w-full h-full object-contain" />
                </div>
                <span className="text-[14px] font-bold text-text-heading">SecureLab</span>
              </div>
              <p className="text-[11px] text-text-subtle leading-relaxed">
                Plataforma integral de cumplimiento para la Ley 21.719 de Protección de Datos Personales en Chile.
              </p>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">Enlaces</h4>
              <div className="space-y-2">
                {sections.map(s => (
                  <button key={s.id} onClick={() => scrollTo(s.id)}
                    className="block text-[12px] text-text-muted hover:text-text-body transition-colors">
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">Recursos</h4>
              <div className="space-y-2">
                <Link to="/login" className="block text-[12px] text-text-muted hover:text-text-body transition-colors">Iniciar Sesión</Link>
                <Link to="/register" className="block text-[12px] text-text-muted hover:text-text-body transition-colors">Registrarse</Link>
                <Link to="/arco-solicitud" className="block text-[12px] text-text-muted hover:text-text-body transition-colors">Derechos ARCO (Ley 21.719)</Link>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">Contacto</h4>
              <div className="space-y-2 text-[12px] text-text-muted">
                <p>contacto@securelab.cl</p>
                <p>+56 9 9744 7411</p>
                <p className="text-[10px] text-text-subtle">L-V 9:00 - 18:00 CLT</p>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border-theme text-center text-[10px] text-text-subtle">
            &copy; {new Date().getFullYear()} SecureLab. Todos los derechos reservados. Ley 21.719 — Chile.
          </div>
        </div>
      </section>

      {/* ARCO Request Modal */}
      {showArcoModal && selectedCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-4" onClick={() => { if (!arcoSubmitting) { setShowArcoModal(false); setArcoResult(null); setArcoError(''); } }}>
          <div className="bg-bg-panel border border-border-theme rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {arcoResult ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Solicitud Enviada</h3>
                <p className="text-sm text-text-muted mb-4">{arcoResult.message}</p>
                <p className="text-xs text-text-muted mb-2">ID: {arcoResult.requestId}</p>
                <p className="text-[11px] text-text-subtle mb-6">Guarda este ID para hacer seguimiento</p>
                <div className="flex gap-2 justify-center">
                  <Link to="/track" className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 text-sm transition-colors">
                    Hacer seguimiento
                  </Link>
                  <button onClick={() => { setShowArcoModal(false); setArcoResult(null); setArcoForm({ nombre: '', rut: '', email: '', telefono: '', tipo: 'acceso', descripcion: '', datosAEliminar: '', eliminacionTotal: false }); }}
                    className="px-4 py-2 bg-bg-elevated text-text-body border border-border-theme rounded-lg hover:bg-bg-elevated text-sm transition-colors">
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleArcoSubmit}>
                <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-text-heading">Ejercer Derecho ARCO</h3>
                    <p className="text-[11px] text-text-muted">{selectedCompany.name}</p>
                  </div>
                  <button type="button" onClick={() => { setShowArcoModal(false); setArcoError(''); }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">
                    {I.xmark}
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {selectedCompany.website && (
                    <p className="text-[10px] text-text-subtle">
                      Sitio web: <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{selectedCompany.website}</a>
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Nombre *</label>
                      <input type="text" value={arcoForm.nombre} onChange={e => setArcoForm(f => ({ ...f, nombre: e.target.value }))}
                        className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 placeholder-text-subtle"
                        placeholder="Tu nombre completo" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">RUT *</label>
                      <input type="text" value={arcoForm.rut} onChange={e => setArcoForm(f => ({ ...f, rut: e.target.value }))}
                        className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 placeholder-text-subtle"
                        placeholder="12.345.678-9" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Email *</label>
                      <input type="email" value={arcoForm.email} onChange={e => setArcoForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 placeholder-text-subtle"
                        placeholder="correo@ejemplo.cl" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Teléfono</label>
                      <input type="text" value={arcoForm.telefono} onChange={e => setArcoForm(f => ({ ...f, telefono: e.target.value }))}
                        className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 placeholder-text-subtle"
                        placeholder="+56 9 1234 5678" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Tipo de Solicitud *</label>
                    <select value={arcoForm.tipo} onChange={e => setArcoForm(f => ({ ...f, tipo: e.target.value }))}
                      className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50">
                      {[
                        { value: 'acceso', label: 'Acceso a mis datos' },
                        { value: 'rectificacion', label: 'Rectificación de datos' },
                        { value: 'cancelacion', label: 'Cancelación (supresión) de datos' },
                        { value: 'oposicion', label: 'Oposición al tratamiento' },
                        { value: 'portabilidad', label: 'Portabilidad de datos' },
                        { value: 'bloqueo', label: 'Bloqueo temporal de datos' },
                      ].map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Descripción / Fundamentación</label>
                    <textarea value={arcoForm.descripcion} onChange={e => setArcoForm(f => ({ ...f, descripcion: e.target.value }))} rows={3}
                      className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 placeholder-text-subtle"
                      placeholder="Describe los motivos de tu solicitud..." />
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Datos específicos a eliminar (si aplica)</label>
                    <input type="text" value={arcoForm.datosAEliminar} onChange={e => setArcoForm(f => ({ ...f, datosAEliminar: e.target.value }))}
                      className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 placeholder-text-subtle"
                      placeholder="Ej: historial de compras, datos de facturación..." />
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-bg-base rounded-xl border border-border-theme cursor-pointer">
                    <input type="checkbox" checked={arcoForm.eliminacionTotal} onChange={e => setArcoForm(f => ({ ...f, eliminacionTotal: e.target.checked }))}
                      className="w-4 h-4 rounded border-surface-600 bg-bg-elevated text-cyan-500 focus:ring-cyan-500" />
                    <div>
                      <span className="text-[13px] text-text-heading">Solicitar eliminación total de mis datos</span>
                      <p className="text-[10px] text-text-muted">Solicito que esta empresa elimine todos mis datos personales de sus sistemas</p>
                    </div>
                  </label>

                  <div className="flex justify-center">
                    <div id="cf-turnstile-arco" className="cf-turnstile" data-sitekey="0x4AAAAAAD4bBqtEEyeh9-4J" data-theme="dark" />
                  </div>
                  {arcoError && <p className="text-[11px] text-red-400 text-center">{arcoError}</p>}

                  <button type="submit" disabled={arcoSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-xl hover:from-cyan-400 hover:to-emerald-400 transition-all text-sm font-medium disabled:opacity-50">
                    {arcoSubmitting ? 'Enviando...' : 'Enviar Solicitud ARCO'}
                  </button>

                  <p className="text-[10px] text-text-subtle text-center">
                    Al enviar, aceptas que tus datos sean gestionados por {selectedCompany.name} según la Ley 21.719.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Violación Report Modal */}
      {showViolacionModal && selectedCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-4" onClick={() => { if (!violacionSubmitting) { setShowViolacionModal(false); setViolacionResult(null); setViolacionError(''); } }}>
          <div className="bg-bg-panel border border-border-theme rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {violacionResult ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Denuncia Enviada</h3>
                <p className="text-sm text-text-muted mb-2">Tu denuncia ha sido registrada correctamente.</p>
                <p className="text-[11px] text-text-subtle mb-4">La Agencia de Protección de Datos Personales (APDP) recibirá tu denuncia para su evaluación.</p>
                <p className="text-xs text-text-muted mb-6">ID de seguimiento: <span className="text-red-400 font-mono">{violacionResult.requestId || 'DEN-' + Date.now().toString(36).toUpperCase()}</span></p>
                <button onClick={() => { setShowViolacionModal(false); setViolacionResult(null); setViolacionForm({ nombre: '', rut: '', email: '', telefono: '', tipoViolacion: 'no_reportar_brecha', descripcion: '', fechaIncidente: '', datosAfectados: '' }); }}
                  className="px-6 py-2.5 bg-bg-elevated text-text-body border border-border-theme rounded-lg hover:bg-bg-elevated text-sm transition-colors">
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!violacionForm.nombre || !violacionForm.rut || !violacionForm.email || !violacionForm.descripcion) {
                  setViolacionError('Completa todos los campos obligatorios');
                  return;
                }
                setViolacionSubmitting(true);
                setViolacionError('');
                try {
                  const res = await fetch('/api/compliance/breaches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      companyId: selectedCompany?.userId,
                      denunciante: { nombre: violacionForm.nombre, rut: violacionForm.rut, email: violacionForm.email, telefono: violacionForm.telefono },
                      type: violacionForm.tipoViolacion,
                      description: violacionForm.descripcion,
                      detectedAt: violacionForm.fechaIncidente || new Date().toISOString(),
                      affectedData: violacionForm.datosAfectados ? violacionForm.datosAfectados.split(',').map(s => s.trim()) : [],
                      severity: 'high',
                      source: 'public_report',
                    }),
                  });
                  const data = await res.json();
                  if (data && !data.error) {
                    setViolacionResult(data);
                  } else {
                    setViolacionError(data.error || 'Error al enviar denuncia');
                  }
                } catch (err) {
                  setViolacionError('Error de conexión');
                }
                setViolacionSubmitting(false);
              }}>
                <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-text-heading">Denunciar Violación</h3>
                    <p className="text-[11px] text-text-muted">Ley 21.719 — {selectedCompany.name}</p>
                  </div>
                  <button type="button" onClick={() => { setShowViolacionModal(false); setViolacionError(''); }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">
                    {I.xmark}
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-[11px] text-red-400 flex items-start gap-2">
                    {I.alert} <span>Esta denuncia será enviada a la Agencia de Protección de Datos Personales (APDP) para su investigación. Asegúrate de que la información sea verídica.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Nombre *</label>
                      <input type="text" value={violacionForm.nombre} onChange={e => setViolacionForm(f => ({ ...f, nombre: e.target.value }))}
                        className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-red-500/50 placeholder-text-subtle"
                        placeholder="Tu nombre completo" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">RUT *</label>
                      <input type="text" value={violacionForm.rut} onChange={e => setViolacionForm(f => ({ ...f, rut: e.target.value }))}
                        className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-red-500/50 placeholder-text-subtle"
                        placeholder="12.345.678-9" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Email *</label>
                      <input type="email" value={violacionForm.email} onChange={e => setViolacionForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-red-500/50 placeholder-text-subtle"
                        placeholder="correo@ejemplo.cl" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Teléfono</label>
                      <input type="text" value={violacionForm.telefono} onChange={e => setViolacionForm(f => ({ ...f, telefono: e.target.value }))}
                        className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-red-500/50 placeholder-text-subtle"
                        placeholder="+56 9 1234 5678" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Tipo de Violación *</label>
                    <select value={violacionForm.tipoViolacion} onChange={e => setViolacionForm(f => ({ ...f, tipoViolacion: e.target.value }))}
                      className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-red-500/50">
                      <option value="no_reportar_brecha">No reportar brecha de seguridad (Art. 26)</option>
                      <option value="datos_sin_consentimiento">Tratar datos sin consentimiento (Art. 12)</option>
                      <option value="datos_sensibles">Tratar datos sensibles sin autorización (Art. 16)</option>
                      <option value="no_responder_arco">No responder solicitud ARCO (Arts. 8-13)</option>
                      <option value="transferencia_ilegal">Transferencia internacional no autorizada (Art. 21)</option>
                      <option value="falta_seguridad">Falta de medidas de seguridad (Art. 25)</option>
                      <option value="datos_ninios">Violación de datos de niños (Art. 17)</option>
                      <option value="no_dpd">No tener DPD designado (Art. 28)</option>
                      <option value="otro">Otra violación</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Fecha del Incidente</label>
                    <input type="date" value={violacionForm.fechaIncidente} onChange={e => setViolacionForm(f => ({ ...f, fechaIncidente: e.target.value }))}
                      className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-red-500/50" />
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Descripción de la Violación *</label>
                    <textarea value={violacionForm.descripcion} onChange={e => setViolacionForm(f => ({ ...f, descripcion: e.target.value }))} rows={4} required
                      className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-red-500/50 placeholder-text-subtle"
                      placeholder="Describe detalladamente qué ocurrió, cuándo lo detectaste, qué datos están involucrados y cualquier otra información relevante..." />
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block mb-1">Datos Afectados (separados por coma)</label>
                    <input type="text" value={violacionForm.datosAfectados} onChange={e => setViolacionForm(f => ({ ...f, datosAfectados: e.target.value }))}
                      className="w-full bg-bg-base border border-border-theme text-[13px] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-red-500/50 placeholder-text-subtle"
                      placeholder="Ej: nombre, email, RUT, datos bancarios" />
                  </div>

                  {violacionError && <p className="text-[11px] text-red-400 text-center">{violacionError}</p>}

                  <button type="submit" disabled={violacionSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-400 hover:to-orange-400 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                    {violacionSubmitting ? 'Enviando...' : <>{I.alert} Enviar Denuncia</>}
                  </button>

                  <p className="text-[10px] text-text-subtle text-center">
                    La información proporcionada será remitida a la empresa denunciada y a la APDP según lo establecido en la Ley 21.719.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

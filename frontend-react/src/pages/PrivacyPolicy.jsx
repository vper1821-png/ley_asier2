import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const I = {
  building: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  target: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653a8.25 8.25 0 0114.498 0M5.25 5.653A8.25 8.25 0 013.5 12m1.75 6.347a8.25 8.25 0 0014.498 0M20.25 12a8.25 8.25 0 01-1.75 6.347M12 3.75v16.5"/></svg>,
  scale: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>,
  shield: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  users: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  database: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>,
  lock: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  clock: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  globe: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>,
  cookie: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  mail: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  alert: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
  check: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  file: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  eye: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  child: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  cpu: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>,
  xmark: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>,
  arrowUp: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>,
  download: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  expand: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>,
  collapse: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/></svg>,
  spinner: <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>,
  printer: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>,
  info: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};

const SECTIONS = [
  { id: 'responsable', num: '1', icon: I.building, title: 'Identificación del Responsable', ref: 'Art. 14 ter' },
  { id: 'finalidades', num: '2', icon: I.target, title: 'Finalidades del Tratamiento', ref: 'Art. 14 ter' },
  { id: 'base-legal', num: '3', icon: I.scale, title: 'Base Legal del Tratamiento', ref: 'Art. 12-13' },
  { id: 'derechos', num: '4', icon: I.users, title: 'Derechos del Titular', ref: 'Art. 4-9, 8 ter' },
  { id: 'categorias', num: '5', icon: I.database, title: 'Categorías de Datos', ref: 'Art. 2' },
  { id: 'fuente', num: '6', icon: I.eye, title: 'Fuente de los Datos', ref: 'Art. 14 ter' },
  { id: 'seguridad', num: '7', icon: I.lock, title: 'Medidas de Seguridad', ref: 'Art. 14 quinquies' },
  { id: 'conservacion', num: '8', icon: I.clock, title: 'Conservación de Datos', ref: 'Art. 16' },
  { id: 'transferencias', num: '9', icon: I.globe, title: 'Transferencias Internacionales', ref: 'Art. 27-29' },
  { id: 'cookies', num: '10', icon: I.cookie, title: 'Cookies', ref: 'Art. 14 ter' },
  { id: 'decisiones', num: '11', icon: I.cpu, title: 'Decisiones Automatizadas', ref: 'Art. 19' },
  { id: 'menores', num: '12', icon: I.child, title: 'Datos de Menores', ref: 'Art. 12' },
  { id: 'ejercicio', num: '13', icon: I.mail, title: 'Ejercicio de Derechos', ref: 'Art. 11' },
  { id: 'retiro', num: '14', icon: I.xmark, title: 'Retiro del Consentimiento', ref: 'Art. 12' },
  { id: 'vulneraciones', num: '15', icon: I.alert, title: 'Vulneraciones de Seguridad', ref: 'Art. 14 sexies' },
  { id: 'responsable-final', num: '16', icon: I.check, title: 'Responsable del Tratamiento', ref: 'Art. 14 ter' },
];

export default function PrivacyPolicy() {
  const { token } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('responsable');
  const [expandedSections, setExpandedSections] = useState(() => {
    const initial = {};
    SECTIONS.forEach(s => { initial[s.id] = true; });
    return initial;
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const sectionRefs = useRef({});
  const contentRef = useRef(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetch('/api/invisia/compliance/config', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error('Error al cargar la configuración');
        return r.json();
      })
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'No se pudo cargar la política de privacidad');
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loading]);

  const scrollToSection = useCallback((id) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileTocOpen(false);
    }
  }, []);

  const toggleSection = useCallback((id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const expandAll = useCallback(() => {
    const all = {};
    SECTIONS.forEach(s => { all[s.id] = true; });
    setExpandedSections(all);
  }, []);

  const collapseAll = useCallback(() => {
    const all = {};
    SECTIONS.forEach(s => { all[s.id] = false; });
    setExpandedSections(all);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const company = config?.companyName || '[Nombre de la Empresa]';
  const dpd = config?.dpdName || '[Delegado de Protección de Datos]';
  const dpdEmail = config?.dpdEmail || '[email@empresa.cl]';
  const dpdPhone = config?.dpdPhone || '[+56 9 XXXX XXXX]';
  const lastUpdated = config?.policyLastUpdated
    ? new Date(config.policyLastUpdated).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-accent mb-4 flex justify-center">{I.spinner}</div>
          <p className="text-text-muted text-sm">Cargando política de privacidad...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400">{I.alert}</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Error al cargar</h2>
          <p className="text-text-muted text-sm mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); }}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const allExpanded = Object.values(expandedSections).every(Boolean);
  const allCollapsed = Object.values(expandedSections).every(v => !v);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #privacy-policy-content, #privacy-policy-content * { visibility: visible; }
          #privacy-policy-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print, nav, button { display: none !important; }
          .print-break { page-break-before: always; }
          .print-avoid-break { page-break-inside: avoid; }
        }
      `}</style>

      <div className="flex">
        <aside className="no-print hidden lg:block w-64 xl:w-72 shrink-0 border-r border-gray-800 h-screen sticky top-0 overflow-y-auto bg-gray-950/95 backdrop-blur-sm">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-accent">{I.shield}</span>
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Contenido</h2>
            </div>
            <nav className="space-y-0.5">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-150 ${
                    activeSection === s.id
                      ? 'bg-primary-500/10 text-accent border border-accent-border'
                      : 'text-text-muted hover:text-text-body hover:bg-bg-elevated/50 border border-transparent'
                  }`}
                >
                  <span className={`shrink-0 ${activeSection === s.id ? 'text-accent' : 'text-text-subtle'}`}>{s.icon}</span>
                  <span className="truncate">{s.num}. {s.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden no-print sticky top-0 z-30 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
            <button
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              className="flex items-center gap-2 text-sm text-text-body hover:text-text-heading transition-colors"
            >
              <span className="text-accent">{I.shield}</span>
              <span>Índice</span>
              <span className="text-[10px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded">{SECTIONS.length} secciones</span>
              <span className={`ml-auto transition-transform ${mobileTocOpen ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
            </button>
            {mobileTocOpen && (
              <nav className="mt-3 space-y-0.5 max-h-64 overflow-y-auto">
                {SECTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                      activeSection === s.id
                        ? 'bg-primary-500/10 text-accent'
                        : 'text-text-muted hover:text-text-body'
                    }`}
                  >
                    <span className="shrink-0">{s.icon}</span>
                    <span>{s.num}. {s.title}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>

          <div id="privacy-policy-content" ref={contentRef} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <div className="mb-10">
              <div className="flex items-center gap-2 text-accent mb-3">
                <span>{I.shield}</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary-500">Ley 21.719</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">Política de Privacidad</h1>
              <p className="text-text-muted text-sm">Art. 14 ter — Ley 21.719 de Protección de Datos Personales (Chile)</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  <span>{I.clock}</span>
                  Última actualización: {lastUpdated}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  <span>{I.file}</span>
                  {SECTIONS.length} secciones
                </span>
              </div>
            </div>

            <div className="no-print flex flex-wrap items-center gap-2 mb-8 pb-6 border-b border-gray-800">
              <button
                onClick={allExpanded ? collapseAll : expandAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-700 text-text-muted hover:text-text-heading hover:border-gray-600 bg-bg-elevated/50 transition-all"
              >
                {allExpanded ? I.collapse : I.expand}
                {allExpanded ? 'Colapsar todo' : 'Expandir todo'}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-700 text-text-muted hover:text-text-heading hover:border-gray-600 bg-bg-elevated/50 transition-all"
              >
                {I.printer}
                Imprimir / PDF
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-all"
              >
                {I.download}
                Descargar PDF
              </button>
            </div>

            <div className="space-y-4">
              <div id="responsable" ref={el => sectionRefs.current.responsable = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('responsable')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0"><span className="text-accent">{I.building}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">1. Identificación del Responsable</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 14 ter</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.responsable ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.responsable && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body space-y-2">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="bg-bg-elevated/50 rounded-lg p-3">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Responsable del tratamiento</p>
                        <p className="text-white font-medium">{company}</p>
                      </div>
                      <div className="bg-bg-elevated/50 rounded-lg p-3">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">DPD</p>
                        <p className="text-white font-medium">{dpd}</p>
                      </div>
                      <div className="bg-bg-elevated/50 rounded-lg p-3">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Contacto DPD</p>
                        <p className="text-white font-medium text-xs">{dpdEmail} · {dpdPhone}</p>
                      </div>
                      <div className="bg-bg-elevated/50 rounded-lg p-3">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Registro APDP</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${config?.apdpRegistered ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                          {config?.apdpRegistered ? I.check : I.clock}
                          {config?.apdpRegistered ? 'Registrado' : 'En proceso'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div id="finalidades" ref={el => sectionRefs.current.finalidades = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('finalidades')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><span className="text-blue-400">{I.target}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">2. Finalidades del Tratamiento</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 14 ter</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.finalidades ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.finalidades && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <p className="mb-3">Los datos personales serán tratados para las siguientes finalidades:</p>
                    <ul className="space-y-2">
                      {[
                        'Prestación de servicios de seguridad informática y monitoreo de bases de datos',
                        'Gestión de cuentas de usuario y autenticación',
                        'Generación de reportes de cumplimiento normativo',
                        'Comunicaciones relacionadas con el servicio',
                        'Cumplimiento de obligaciones legales y regulatorias',
                        'Marketing directo (solo con consentimiento expreso)',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-blue-400 w-3 h-3">{I.check}</span></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div id="base-legal" ref={el => sectionRefs.current['base-legal'] = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('base-legal')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0"><span className="text-amber-400">{I.scale}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">3. Base Legal del Tratamiento</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 12-13</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections['base-legal'] ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections['base-legal'] && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <p className="mb-3">El tratamiento se fundamenta en:</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {[
                        { label: 'Consentimiento expreso', art: 'Art. 12', desc: 'Del titular de los datos' },
                        { label: 'Ejecución de contrato', art: 'Art. 13 letra b', desc: 'Prestación de servicios' },
                        { label: 'Obligación legal', art: 'Art. 13 letra a', desc: 'Seguridad y protección de datos' },
                        { label: 'Interés legítimo', art: 'Art. 13 letra c', desc: 'Mejora de servicios' },
                      ].map((item, i) => (
                        <div key={i} className="bg-bg-elevated/50 rounded-lg p-3">
                          <p className="text-white font-medium text-xs">{item.label}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{item.art} — {item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div id="derechos" ref={el => sectionRefs.current.derechos = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('derechos')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0"><span className="text-emerald-400">{I.users}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">4. Derechos del Titular</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 4-9, 8 ter</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.derechos ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.derechos && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <div className="grid sm:grid-cols-2 gap-2 mb-3">
                      {[
                        { label: 'Acceso', art: 'Art. 5', desc: 'Solicitar información sobre los datos que tratamos' },
                        { label: 'Rectificación', art: 'Art. 6', desc: 'Corregir datos inexactos o incompletos' },
                        { label: 'Supresión', art: 'Art. 7', desc: 'Solicitar la eliminación de sus datos' },
                        { label: 'Oposición', art: 'Art. 8', desc: 'Oponerse a tratamientos específicos' },
                        { label: 'Portabilidad', art: 'Art. 9', desc: 'Recibir sus datos en formato estructurado' },
                        { label: 'Bloqueo', art: 'Art. 8 ter', desc: 'Suspender el tratamiento temporalmente' },
                      ].map((item, i) => (
                        <div key={i} className="bg-bg-elevated/50 rounded-lg p-3">
                          <p className="text-white font-medium text-xs">{item.label}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{item.art}</p>
                          <p className="text-xs text-text-muted mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">{I.info}</span>
                      <p className="text-xs text-amber-300/80">Plazo de respuesta: 30 días corridos, prorrogable por 30 días adicionales (Art. 11).</p>
                    </div>
                  </div>
                )}
              </div>

              <div id="categorias" ref={el => sectionRefs.current.categorias = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('categorias')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0"><span className="text-purple-400">{I.database}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">5. Categorías de Datos</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 2</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.categorias ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.categorias && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <div className="flex flex-wrap gap-2">
                      {['Datos de identificación (nombre, RUT, email)', 'Datos de contacto (teléfono, dirección)', 'Datos de cuenta de usuario', 'Datos de monitoreo de bases de datos', 'Datos de cumplimiento normativo'].map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated/70 text-xs text-text-body border border-border-theme/50">
                          <span className="text-purple-400 w-3 h-3">{I.check}</span>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div id="fuente" ref={el => sectionRefs.current.fuente = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('fuente')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0"><span className="text-cyan-400">{I.eye}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">6. Fuente de los Datos</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 14 ter</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.fuente ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.fuente && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <p>Los datos personales son recolectados directamente del titular a través de:</p>
                    <ul className="space-y-2 mt-2">
                      {[
                        'Formularios de registro y creación de cuenta en nuestra plataforma',
                        'Configuración de perfil y preferencias del usuario',
                        'Interacciones con nuestros servicios de monitoreo y cumplimiento',
                        'Comunicaciones directas con nuestro equipo de soporte y DPD',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-cyan-400 w-3 h-3">{I.check}</span></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-text-muted">No se recolectan datos de fuentes públicamente accesibles sin informar previamente al titular, conforme al Art. 14 ter.</p>
                  </div>
                )}
              </div>

              <div id="seguridad" ref={el => sectionRefs.current.seguridad = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('seguridad')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><span className="text-red-400">{I.lock}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">7. Medidas de Seguridad</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 14 quinquies</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.seguridad ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.seguridad && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <p className="mb-3">Implementamos medidas técnicas y organizativas apropiadas:</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {[
                        'Cifrado de datos en reposo y en tránsito',
                        'Control de acceso basado en roles (RBAC)',
                        'Pseudonimización y anonimización',
                        'Monitoreo continuo de seguridad',
                        'Evaluaciones de impacto (DPIA)',
                        'Registros de actividad (logs de acceso)',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 bg-bg-elevated/50 rounded-lg p-2.5">
                          <span className="text-red-400 w-3 h-3 shrink-0">{I.shield}</span>
                          <span className="text-xs">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div id="conservacion" ref={el => sectionRefs.current.conservacion = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('conservacion')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0"><span className="text-orange-400">{I.clock}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">8. Conservación de Datos</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 16</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.conservacion ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.conservacion && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <p>Los datos serán conservados por el tiempo necesario para cumplir las finalidades para las que fueron recolectados, o por el plazo exigido por ley, lo que sea mayor.</p>
                    <div className="grid sm:grid-cols-2 gap-2 mt-3">
                      {[
                        { cat: 'Datos de cuenta', plazo: 'Mientras la cuenta esté activa + 5 años' },
                        { cat: 'Datos de monitoreo', plazo: '12 meses desde su recolección' },
                        { cat: 'Registros de cumplimiento', plazo: '5 años (obligación legal)' },
                        { cat: 'Solicitudes ARCO', plazo: '3 años desde su resolución' },
                      ].map((item, i) => (
                        <div key={i} className="bg-bg-elevated/50 rounded-lg p-3">
                          <p className="text-white font-medium text-xs">{item.cat}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{item.plazo}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-text-muted">Las políticas de retención se encuentran configuradas en nuestro sistema de cumplimiento y se revisan anualmente.</p>
                  </div>
                )}
              </div>

              <div id="transferencias" ref={el => sectionRefs.current.transferencias = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('transferencias')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0"><span className="text-teal-400">{I.globe}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">9. Transferencias Internacionales</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 27-29</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.transferencias ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.transferencias && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    {config?.internationalTransfer ? (
                      <div>
                        <p className="mb-2">Realizamos transferencias internacionales de datos a:</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(config.internationalTransferCountries || []).map((c, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 text-xs border border-teal-500/20">{c}</span>
                          ))}
                        </div>
                        <p className="text-xs text-text-muted">Estas transferencias se realizan con garantías adecuadas conforme al Art. 27 (cláusulas contractuales tipo, normas corporativas vinculantes o decisión de adecuación).</p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                        <span className="text-emerald-400 shrink-0 mt-0.5">{I.check}</span>
                        <p className="text-xs text-emerald-300/80">No realizamos transferencias internacionales de datos personales a países sin nivel adecuado de protección.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div id="cookies" ref={el => sectionRefs.current.cookies = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('cookies')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0"><span className="text-pink-400">{I.cookie}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">10. Cookies</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 14 ter</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.cookies ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.cookies && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <div className="space-y-2">
                      {[
                        { tipo: 'Cookies necesarias', desc: 'Esenciales para el funcionamiento del sitio. No requieren consentimiento.' },
                        { tipo: 'Cookies de análisis', desc: 'Recolectan datos anónimos de tráfico para mejorar el servicio.' },
                        { tipo: 'Cookies de funcionalidad', desc: 'Recuerdan preferencias del usuario (idioma, tema, etc.).' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 bg-bg-elevated/50 rounded-lg p-3">
                          <span className="text-pink-400 w-3 h-3 shrink-0 mt-0.5">{I.check}</span>
                          <div>
                            <p className="text-white font-medium text-xs">{item.tipo}</p>
                            <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-text-muted">Puede gestionar sus preferencias de cookies en cualquier momento desde el banner de cookies del sitio.</p>
                  </div>
                )}
              </div>

              <div id="decisiones" ref={el => sectionRefs.current.decisiones = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('decisiones')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0"><span className="text-indigo-400">{I.cpu}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">11. Decisiones Automatizadas</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 19</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.decisiones ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.decisiones && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <div className="flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3 mb-3">
                      <span className="text-indigo-400 shrink-0 mt-0.5">{I.info}</span>
                      <div>
                        <p className="text-white font-medium text-xs">No utilizamos decisiones automatizadas</p>
                        <p className="text-xs text-indigo-300/70 mt-1">No tomamos decisiones basadas únicamente en tratamiento automatizado que produzcan efectos jurídicos sobre el titular, incluyendo la elaboración de perfiles (Art. 19).</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">En caso de implementar decisiones automatizadas en el futuro, se informará previamente a los titulares y se recabará su consentimiento expreso cuando sea requerido por ley.</p>
                  </div>
                )}
              </div>

              <div id="menores" ref={el => sectionRefs.current.menores = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('menores')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0"><span className="text-rose-400">{I.child}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">12. Datos de Menores</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 12</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.menores ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.menores && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <p>No recolectamos ni tratamos intencionalmente datos personales de menores de 14 años sin el consentimiento verificable de sus padres, madres o tutores legales.</p>
                    <div className="flex items-start gap-3 bg-rose-500/5 border border-rose-500/10 rounded-lg p-3 mt-3">
                      <span className="text-rose-400 shrink-0 mt-0.5">{I.alert}</span>
                      <div>
                        <p className="text-white font-medium text-xs">Importante</p>
                        <p className="text-xs text-rose-300/70 mt-1">Si usted es padre, madre o tutor y tiene conocimiento de que su hijo nos ha proporcionado datos personales sin su consentimiento, contáctenos de inmediato a través de nuestro DPD para proceder a su eliminación.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div id="ejercicio" ref={el => sectionRefs.current.ejercicio = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('ejercicio')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0"><span className="text-sky-400">{I.mail}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">13. Ejercicio de Derechos</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 11</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.ejercicio ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.ejercicio && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <p className="mb-3">Para ejercer sus derechos ARCO, puede utilizar los siguientes canales:</p>
                    <div className="grid sm:grid-cols-3 gap-2 mb-3">
                      <div className="bg-bg-elevated/50 rounded-lg p-3 text-center">
                        <span className="text-sky-400 flex justify-center mb-1">{I.mail}</span>
                        <p className="text-white font-medium text-xs">Email DPD</p>
                        <p className="text-[10px] text-text-muted mt-0.5 break-all">{dpdEmail}</p>
                      </div>
                      <div className="bg-bg-elevated/50 rounded-lg p-3 text-center">
                        <span className="text-sky-400 flex justify-center mb-1">{I.globe}</span>
                        <p className="text-white font-medium text-xs">Portal ARCO</p>
                        <p className="text-[10px] text-text-muted mt-0.5">Disponible en la plataforma</p>
                      </div>
                      <div className="bg-bg-elevated/50 rounded-lg p-3 text-center">
                        <span className="text-sky-400 flex justify-center mb-1">{I.building}</span>
                        <p className="text-white font-medium text-xs">Teléfono</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{dpdPhone}</p>
                      </div>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 mt-0.5">{I.info}</span>
                      <p className="text-xs text-amber-300/80">Si no recibe respuesta dentro de 30 días corridos, puede presentar reclamo ante la Agencia de Protección de Datos Personales (APDP).</p>
                    </div>
                  </div>
                )}
              </div>

              <div id="retiro" ref={el => sectionRefs.current.retiro = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('retiro')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center shrink-0"><span className="text-text-muted">{I.xmark}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">14. Retiro del Consentimiento</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 12</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.retiro ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.retiro && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <p>Usted tiene derecho a retirar su consentimiento en cualquier momento, sin que ello afecte la licitud del tratamiento basado en el consentimiento previo a su retiro.</p>
                    <ul className="space-y-2 mt-3">
                      {[
                        'El retiro del consentimiento no tendrá efectos retroactivos',
                        'Puede retirar el consentimiento para finalidades específicas sin afectar otras',
                        'El retiro se puede ejercer por los mismos canales habilitados para derechos ARCO',
                        'En caso de retiro, cesaremos el tratamiento en un plazo máximo de 10 días hábiles',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-gray-500/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-text-muted w-3 h-3">{I.check}</span></span>
                          <span className="text-xs">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div id="vulneraciones" ref={el => sectionRefs.current.vulneraciones = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('vulneraciones')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><span className="text-red-400">{I.alert}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">15. Vulneraciones de Seguridad</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 14 sexies</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections.vulneraciones ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections.vulneraciones && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <p>En caso de brecha de seguridad que genere riesgo para sus derechos y libertades, le notificaremos sin dilaciones indebidas.</p>
                    <div className="grid sm:grid-cols-3 gap-2 mt-3">
                      {[
                        { label: 'Naturaleza', desc: 'Descripción de la vulneración ocurrida' },
                        { label: 'Datos afectados', desc: 'Categorías y volumen aproximado' },
                        { label: 'Medidas adoptadas', desc: 'Acciones correctivas y preventivas' },
                      ].map((item, i) => (
                        <div key={i} className="bg-bg-elevated/50 rounded-lg p-3">
                          <p className="text-white font-medium text-xs">{item.label}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-text-muted">Las vulneraciones de seguridad se notificarán también a la APDP dentro de las 72 horas siguientes a su detección, conforme al Art. 14 sexies.</p>
                  </div>
                )}
              </div>

              <div id="responsable-final" ref={el => sectionRefs.current['responsable-final'] = el} className="print-avoid-break bg-bg-panel/40 border border-border-theme/50 rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleSection('responsable-final')} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-elevated/30 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0"><span className="text-emerald-400">{I.check}</span></span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-text-heading">16. Responsable del Tratamiento</h2>
                    <p className="text-[10px] text-text-subtle mt-0.5">Art. 14 ter</p>
                  </div>
                  <span className={`text-text-muted transition-transform ${expandedSections['responsable-final'] ? 'rotate-180' : ''}`}>{I.chevronDown}</span>
                </button>
                {expandedSections['responsable-final'] && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-body">
                    <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                      <span className="text-emerald-400 shrink-0 mt-0.5">{I.shield}</span>
                      <p className="text-xs text-emerald-300/80"><strong>{company}</strong> es el responsable del tratamiento de sus datos personales conforme a la Ley 21.719 de Protección de Datos Personales de Chile.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-gray-800 text-xs text-text-muted text-center space-y-1">
              <p>Política de Privacidad generada conforme al Art. 14 ter de la Ley 21.719 de Protección de Datos Personales</p>
              <p>Este documento no constituye asesoría legal. Se recomienda revisión por un abogado especializado.</p>
              <p className="text-text-subtle">© {new Date().getFullYear()} {company}. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </div>

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="no-print fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
          aria-label="Volver arriba"
        >
          {I.arrowUp}
        </button>
      )}
    </div>
  );
}

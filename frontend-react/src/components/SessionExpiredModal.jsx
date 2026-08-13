import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SessionExpiredModal() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

  useEffect(() => {
    if (show) {
      const handler = (e) => { e.preventDefault(); e.stopPropagation(); };
      document.addEventListener('mousedown', handler, true);
      document.addEventListener('keydown', handler, true);
      return () => {
        document.removeEventListener('mousedown', handler, true);
        document.removeEventListener('keydown', handler, true);
      };
    }
  }, [show]);

  if (!show) return null;

  const handleLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.__sessionExpiredFired = false;
    setShow(false);
    navigate('/login', { replace: true });
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-panel border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-red-500/10 px-6 py-5 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text-heading">Sesión Expirada</h3>
              <p className="text-[11px] text-text-muted mt-0.5">Tu sesión ha caducado por seguridad</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-[12px] text-text-body leading-relaxed">
            Tu sesión ha expirado porque permaneciste inactivo demasiado tiempo o tu token de acceso ya no es válido.
          </p>
          <p className="text-[12px] text-text-muted leading-relaxed mt-3">
            Por favor, inicia sesión nuevamente para continuar usando el sistema.
          </p>
        </div>
        <div className="px-6 pb-5">
          <button
            onClick={handleLogin}
            className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold transition-colors duration-200"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

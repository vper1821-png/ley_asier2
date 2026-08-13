import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAuth } from '../context/AuthContext';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }) {
  const { token } = useAuth();
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message, duration = 6000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // SSE for real-time events
  useEffect(() => {
    if (!token) return;
    let evtSource = null;
    let reconnectTimer = null;

    function connect() {
      if (evtSource) evtSource.close();
      evtSource = new EventSource(`/api/agents/events?token=${encodeURIComponent(token)}`);

      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'agent:online') {
            addToast('success', 'Agente Conectado', `El agente ${data.hostname} se ha conectado al servidor`);
          } else if (data.type === 'scan:complete') {
            addToast('info', 'Escaneo Completado', `${data.dbName}: ${data.tablesCount} tablas escaneadas`);
          }
        } catch {}
      };

      evtSource.onerror = () => {
        evtSource.close();
        reconnectTimer = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      if (evtSource) evtSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [token, addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id}
            className={`px-4 py-3 rounded-lg border shadow-lg text-[12px] transition-all animate-slide-in ${
              t.type === 'success' ? 'bg-emerald-900/90 border-emerald-600/40 text-emerald-200' :
              t.type === 'error' ? 'bg-red-900/90 border-red-600/40 text-red-200' :
              t.type === 'info' ? 'bg-blue-900/90 border-blue-600/40 text-blue-200' :
              'bg-yellow-900/90 border-yellow-600/40 text-yellow-200'
            }`}
            style={{ animation: 'slideIn 0.3s ease-out' }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-[12px]">{t.title}</p>
                {t.message && <p className="text-[11px] opacity-80 mt-0.5">{t.message}</p>}
              </div>
              <button onClick={() => removeToast(t.id)}
                className="text-current opacity-60 hover:opacity-100 flex-shrink-0 text-[14px] leading-none">&times;</button>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
import { useState, useEffect } from 'react';

const COOKIE_KEY = 'invisia_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 text-white p-4 shadow-2xl">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1">Este sitio utiliza cookies</p>
          <p className="text-xs text-text-muted">
            Utilizamos cookies para mejorar tu experiencia, análisis de tráfico y funcionalidad del sitio.
            Conforme al Art. 14 ter de la Ley 21.719, puedes gestionar tus preferencias.
            Consulta nuestra{' '}
            <a href="/politica-privacidad" className="text-blue-400 underline">Política de Privacidad</a>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={reject} className="px-4 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            Solo Necesarias
          </button>
          <button onClick={accept} className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-semibold">
            Aceptar Todas
          </button>
        </div>
      </div>
    </div>
  );
}

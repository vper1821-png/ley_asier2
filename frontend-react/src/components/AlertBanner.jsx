import { useState, useEffect } from 'react';
import * as api from '../api/api';

const typeStyles = {
  maintenance: { bg: 'bg-amber-500/10 border-amber-500/30', icon: 'text-amber-400', text: 'text-amber-200',
    svg: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  announcement: { bg: 'bg-blue-500/10 border-blue-500/30', icon: 'text-blue-400', text: 'text-blue-200',
    svg: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg> },
  warning: { bg: 'bg-red-500/10 border-red-500/30', icon: 'text-red-400', text: 'text-red-200',
    svg: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  info: { bg: 'bg-primary-500/10 border-primary-500/30', icon: 'text-accent', text: 'text-primary-200',
    svg: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
};

export default function AlertBanner({ alerts: propAlerts, onLanding = false }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    if (onLanding) {
      api.getPublicAlerts().then(res => {
        if (!res.error && Array.isArray(res)) setAlerts(res);
      });
    } else if (propAlerts) {
      setAlerts(propAlerts);
    }
  }, [onLanding, propAlerts]);

  const visible = alerts.filter(a => !dismissed.has(a._id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1.5 mb-3">
      {visible.map(alert => {
        const s = typeStyles[alert.type] || typeStyles.info;
        return (
          <div key={alert._id || alert.title} className={`flex items-start gap-3 px-4 py-2.5 rounded-lg border ${s.bg}`}>
            <span className={`flex-shrink-0 mt-0.5 ${s.icon}`}>{s.svg}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-medium ${s.text}`}>{alert.title}</p>
              {alert.message && <p className="text-[11px] text-text-muted mt-0.5">{alert.message}</p>}
            </div>
            <button onClick={() => setDismissed(prev => new Set([...prev, alert._id]))}
              className="flex-shrink-0 text-text-subtle hover:text-text-muted transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

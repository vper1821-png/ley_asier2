import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';

const I = {
  bell: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  xmark: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  check: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  warning: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  db: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>,
};

const typeIcons = {
  db_disconnected: <span className="text-red-400">{I.warning}</span>,
  db_reconnected: <span className="text-emerald-400">{I.check}</span>,
  db_error: <span className="text-red-400">{I.db}</span>,
  scan_complete: <span className="text-blue-400">{I.check}</span>,
  info: <span className="text-text-muted">{I.bell}</span>,
  payment: <span className="text-yellow-400">{I.warning}</span>,
};

const typeColors = {
  db_disconnected: 'border-l-red-500',
  db_reconnected: 'border-l-emerald-500',
  db_error: 'border-l-red-500',
  scan_complete: 'border-l-blue-500',
  info: 'border-l-gray-500',
  payment: 'border-l-yellow-500',
};

export default function NotificationBell({ collapsed, dropUp = true }) {
  const { token } = useAuth();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadUnread = async () => {
    const res = await api.unreadNotificationCount(token);
    if (!res.error) setUnread(res.count || 0);
  };

  const toggleDropdown = async () => {
    const next = !showDropdown;
    setShowDropdown(next);
    if (next) {
      const res = await api.listNotifications(token, 10);
      if (!res.error) setNotifications(Array.isArray(res) ? res : []);
    }
  };

  const markRead = async (id) => {
    await api.markNotificationRead(token, id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead(token);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const clearAll = async () => {
    await api.clearAllNotifications(token);
    setNotifications([]);
    setUnread(0);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggleDropdown}
        className={`relative flex items-center justify-center gap-1.5 w-full px-2.5 py-2 rounded-lg text-[11px] font-medium bg-bg-panel/80 border border-border-theme text-text-muted hover:bg-bg-elevated/80 hover:border-surface-600 hover:text-gray-200 transition-all duration-200 ${collapsed ? '' : ''}`}>
        {I.bell}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {!collapsed && <span className="truncate">Notificaciones</span>}
      </button>

      {showDropdown && (
        <div className={`absolute ${dropUp ? 'bottom-full left-0 mb-1' : 'top-full right-0 mt-1'} w-80 max-w-[calc(100vw-1.5rem)] bg-bg-panel border border-border-theme rounded-xl shadow-2xl z-50 overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-theme">
            <h3 className="text-[12px] font-semibold text-text-heading">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                  Marcar todas leídas
                </button>
              )}
              <button onClick={clearAll} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">
                Limpiar
              </button>
              <button onClick={() => setShowDropdown(false)} className="p-0.5 rounded text-text-muted hover:text-text-heading transition-colors">
                {I.xmark}
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[11px] text-text-muted">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id}
                  className={`px-4 py-3 border-b border-border-theme/60 hover:bg-bg-elevated/40 transition-colors cursor-pointer border-l-2 ${typeColors[n.type] || 'border-l-transparent'} ${n.read ? 'opacity-60' : ''}`}
                  onClick={() => !n.read && markRead(n._id)}>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0">{typeIcons[n.type] || typeIcons.info}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] ${n.read ? 'text-text-muted' : 'text-white font-medium'}`}>{n.title}</p>
                      {n.message && <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[9px] text-text-subtle mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

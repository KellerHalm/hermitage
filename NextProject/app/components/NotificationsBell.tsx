'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Store } from '../../lib/store';

const TYPE_ICONS: Record<string, { bg: string; color: string }> = {
  ORDER_CREATED: { bg: '#e8f5e9', color: '#2e7d32' },
  ORDER_STATUS: { bg: '#fff3e0', color: '#e65100' },
  SYSTEM: { bg: '#e3f2fd', color: '#1565c0' },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#e65100',
  PROCESSING: '#1565c0',
  SHIPPED: '#6a1b9a',
  DELIVERED: '#2e7d32',
  CANCELLED: '#c62828',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return `${Math.floor(diff / 86400)} дн. назад`;
}

export default function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [notifs, count] = await Promise.all([
      Store.getNotifications(),
      Store.getNotificationUnreadCount(),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [open, load]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleToggle = async () => {
    if (!open) {
      setLoading(true);
      await load();
      setLoading(false);
    }
    setOpen(!open);
  };

  const handleMarkAllRead = async () => {
    await Store.markAllNotificationsAsRead();
    await load();
  };

  const handleMarkRead = async (id: string) => {
    await Store.markNotificationAsRead(id);
    await load();
  };

  const iconStyle = TYPE_ICONS[open ? 'SYSTEM' : 'ORDER_STATUS'] || TYPE_ICONS.SYSTEM;

  return (
    <div className="notif-bell" ref={panelRef}>
      <button
        className="icon-btn"
        aria-label="Уведомления"
        onClick={handleToggle}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="badge-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel__header">
            <span className="notif-panel__title">Уведомления</span>
            {unreadCount > 0 && (
              <button className="notif-panel__mark-all" onClick={handleMarkAllRead}>
                Прочитать все
              </button>
            )}
          </div>

          <div className="notif-panel__list">
            {loading && notifications.length === 0 && (
              <div className="notif-panel__empty">Загрузка...</div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="notif-panel__empty">Нет уведомлений</div>
            )}

            {!loading && notifications.length > 0 && notifications.map((n) => {
              const style = TYPE_ICONS[n.type] || TYPE_ICONS.SYSTEM;
              return (
                <div
                  key={n.id}
                  className={`notif-item ${!n.isRead ? 'notif-item--unread' : ''}`}
                  onClick={() => {
                    if (!n.isRead) void handleMarkRead(n.id);
                    setOpen(false);
                    if (n.orderId) router.push('/account?tab=orders');
                  }}
                >
                  <div className="notif-item__icon" style={{ background: style.bg, color: style.color }}>
                    {n.type === 'ORDER_CREATED' || n.type === 'ORDER_STATUS' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    )}
                  </div>
                  <div className="notif-item__body">
                    <div className="notif-item__top">
                      <span className="notif-item__title">{n.title}</span>
                      <span className="notif-item__time">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="notif-item__message">{n.message}</p>
                    {n.orderId && (
                      <span
                        className="notif-item__badge"
                        style={{ color: STATUS_COLORS[n.title?.includes('обработк') ? 'PROCESSING' : n.title?.includes('достав') ? 'SHIPPED' : n.title?.includes('отмен') ? 'CANCELLED' : n.title?.includes('доставл') ? 'DELIVERED' : 'PENDING'] }}
                      >
                        Заказ #{n.orderId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  {!n.isRead && <div className="notif-item__dot" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

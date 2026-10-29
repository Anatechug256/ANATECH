import React from 'react';
import { X, Bell, MessageSquare, Tag, ShieldCheck, CheckCircle2, BellRing, Search } from 'lucide-react';
import { NotificationItem } from '../types';
import { store } from '../services/marketplaceStore';

interface NotificationsModalProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onSelectNotification: (notif: NotificationItem) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onSelectNotification
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Notifications & Alerts
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
          {notifications.length > 0 ? (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  store.markNotificationAsRead(n.id);
                  onSelectNotification(n);
                }}
                className={`p-3 rounded-xl flex items-start gap-3 cursor-pointer transition-colors ${
                  n.isRead ? 'opacity-70 hover:opacity-100' : 'bg-cyan-50/40 dark:bg-cyan-950/20 font-semibold'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-600 shrink-0">
                  {n.type === 'message' && <MessageSquare className="w-4 h-4" />}
                  {n.type === 'offer' && <Tag className="w-4 h-4 text-amber-500" />}
                  {n.type === 'listing_status' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {n.type === 'system' && <ShieldCheck className="w-4 h-4 text-cyan-500" />}
                  {n.type === 'promotion' && <Tag className="w-4 h-4 text-purple-500" />}
                  {n.type === 'search_alert' && <BellRing className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No notifications at this time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

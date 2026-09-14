import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export function timeAgo(value) {
  if (!value) return "";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function notificationIcon(notification) {
  const text = `${notification.title || ""} ${notification.message || ""}`.toLowerCase();
  if (text.includes("cancelled")) return "❌";
  if (text.includes("delivered")) return "📦";
  if (text.includes("on the way") || text.includes("out for delivery")) return "🛵";
  if (text.includes("prepar")) return "🍳";
  if (text.includes("confirm")) return "✅";
  if (text.includes("placed")) return "🧾";
  return "🔔";
}

// Order id the notification links to (populated order or raw ObjectId).
export function notificationOrderId(notification) {
  const order = notification.order;
  if (!order) return null;
  if (typeof order === "object") return order._id || null;
  return order;
}

// Bell with unread badge + dropdown panel. Fetches on mount and every
// time the panel opens (no sockets). Never crashes the navbar.
function NotificationBell({ onNavigate }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const panelRef = useRef(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnread(Number(res.data.count) || 0);
    } catch {
      // Badge stays quiet; dropdown shows the error state instead.
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const res = await api.get("/notifications", { params: { limit: 20 } });
      setNotifications(res.data.notifications || []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  useEffect(() => {
    if (!open) return;
    fetchList();
    fetchUnread();
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, fetchList, fetchUnread]);

  const openNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await api.put(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnread((count) => Math.max(0, count - 1));
      }
    } catch {
      // Still navigate: the read flag syncs on next open.
    }
    setOpen(false);
    onNavigate?.();
    const orderId = notificationOrderId(notification);
    if (orderId) navigate(`/orders/${orderId}`);
    else navigate("/notifications");
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      setFailed(true);
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative w-10 h-10 rounded-full hover:bg-cream-dark transition-colors flex items-center justify-center"
      >
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-burgundy text-white text-[11px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[85vw] bg-white border border-charcoal/10 rounded-[20px] shadow-[0_25px_50px_-20px_rgba(23,23,23,0.4)] overflow-hidden z-[60]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-charcoal/10">
            <p className="font-display font-semibold text-lg">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[13px] font-medium text-burgundy hover:underline underline-offset-2"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading && (
              <p className="px-5 py-8 text-center text-sm text-charcoal/50">
                Loading notifications...
              </p>
            )}
            {!loading && failed && (
              <p className="px-5 py-8 text-center text-sm text-red-700">
                Unable to load notifications.
              </p>
            )}
            {!loading && !failed && notifications.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-3xl">🔔</p>
                <p className="font-semibold mt-2">No notifications yet.</p>
                <p className="text-sm text-charcoal/60 mt-1">
                  Your order updates will appear here.
                </p>
              </div>
            )}
            {!loading &&
              !failed &&
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => openNotification(notification)}
                  className={`w-full text-left px-5 py-3.5 border-b border-charcoal/5 last:border-0 hover:bg-cream transition-colors flex gap-3 ${
                    notification.isRead ? "" : "bg-burgundy/[0.04]"
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5" aria-hidden>
                    {notificationIcon(notification)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-[15px] truncate">
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-burgundy shrink-0" aria-label="Unread" />
                      )}
                    </span>
                    <span className="block text-sm text-charcoal/65 mt-0.5 leading-snug">
                      {notification.message}
                    </span>
                    <span className="block text-xs text-charcoal/45 mt-1">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
          </div>

          <Link
            to="/notifications"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="block text-center text-sm font-semibold py-3 border-t border-charcoal/10 hover:text-burgundy transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

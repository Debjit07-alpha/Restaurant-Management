import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  notificationIcon,
  notificationOrderId,
  timeAgo,
} from "../components/NotificationBell";

const PAGE_LIMIT = 30;

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/notifications", {
        params: { limit: PAGE_LIMIT },
      });
      setNotifications(res.data.notifications || []);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await api.put(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      }
    } catch {
      setError("Unable to update notification.");
    }
    const orderId = notificationOrderId(notification);
    if (orderId) navigate(`/orders/${orderId}`);
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setMessage("All notifications marked as read.");
    } catch {
      setError("Unable to update notifications.");
    }
  };

  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] uppercase tracking-[0.25em] text-burgundy font-semibold">
              Updates
            </p>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-2">
              Notifications
            </h1>
          </div>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={markAllRead}
              className="border border-charcoal/20 rounded-full px-5 py-2 text-sm font-semibold hover:border-burgundy hover:text-burgundy transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {error && (
          <p className="mt-6 bg-red-100 text-red-700 text-sm p-3.5 rounded-2xl border border-red-200">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-6 bg-pine/10 text-pine text-sm p-3.5 rounded-2xl border border-pine/20">
            {message}
          </p>
        )}

        {loading && (
          <p className="mt-8 text-center text-charcoal/50 text-sm">
            Loading notifications...
          </p>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="mt-10 text-center bg-white border border-charcoal/10 rounded-[20px] px-6 py-14">
            <span className="text-5xl">🔔</span>
            <p className="font-display font-semibold text-2xl mt-4">
              No notifications yet.
            </p>
            <p className="text-charcoal/60 mt-2 text-[15px]">
              Your order updates will appear here.
            </p>
            <Link
              to="/orders"
              className="inline-block mt-6 bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
            >
              View My Orders
            </Link>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="mt-8 bg-white border border-charcoal/10 rounded-[20px] overflow-hidden shadow-[0_15px_35px_-24px_rgba(23,23,23,0.35)] divide-y divide-charcoal/5">
            {notifications.map((notification) => (
              <button
                key={notification._id}
                onClick={() => openNotification(notification)}
                className={`w-full text-left px-5 sm:px-6 py-4 flex gap-4 hover:bg-cream transition-colors ${
                  notification.isRead ? "" : "bg-burgundy/[0.04]"
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5" aria-hidden>
                  {notificationIcon(notification)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-[16px]">
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-burgundy shrink-0" aria-label="Unread" />
                    )}
                  </span>
                  <span className="block text-[15px] text-charcoal/70 mt-0.5 leading-relaxed">
                    {notification.message}
                  </span>
                  <span className="block text-[13px] text-charcoal/45 mt-1">
                    {timeAgo(notification.createdAt)}
                    {notification.order?.orderId
                      ? ` · Order #${notification.order.orderId}`
                      : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

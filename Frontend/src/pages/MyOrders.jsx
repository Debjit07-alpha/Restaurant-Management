import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";
import { ORDER_STEP_LABELS, statusBadgeClass } from "../utils/orderStatus";
import { useReorder } from "../hooks/useReorder";
import MenuImage from "../components/MenuImage";

function formatOrderDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OrderCardSkeleton() {
  return (
    <div className="bg-white border border-charcoal/10 rounded-[20px] p-5 sm:p-6 animate-pulse">
      <div className="h-6 w-40 bg-cream-dark rounded" />
      <div className="h-4 w-56 bg-cream-dark rounded mt-2" />
      <div className="flex gap-2 mt-4">
        <div className="w-12 h-12 rounded-xl bg-cream-dark" />
        <div className="w-12 h-12 rounded-xl bg-cream-dark" />
        <div className="w-12 h-12 rounded-xl bg-cream-dark" />
      </div>
      <div className="h-4 w-32 bg-cream-dark rounded mt-4" />
      <div className="flex gap-3 mt-4">
        <div className="h-10 flex-1 bg-cream-dark rounded-full" />
        <div className="h-10 flex-1 bg-cream-dark rounded-full" />
      </div>
    </div>
  );
}

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { reorder, reorderingId, notice, clearNotice } = useReorder();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/orders");
      setOrders(res.data.orders || []);
    } catch {
      setError("Unable to load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-fade-in">
        <p className="text-[13px] uppercase tracking-[0.25em] text-burgundy font-semibold">
          Order history
        </p>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-2">
          My Orders
        </h1>

        {notice && (
          <div
            role="status"
            className={`mt-6 text-sm p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
              notice.type === "success"
                ? "bg-pine/10 text-pine border-pine/20"
                : notice.type === "warning"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-red-100 text-red-700 border-red-200"
            }`}
          >
            <span>{notice.text}</span>
            <button
              onClick={clearNotice}
              aria-label="Dismiss message"
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-100 text-red-700 text-sm p-3.5 rounded-2xl border border-red-200">
            <p>{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-2 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-8 space-y-4" aria-label="Loading your orders...">
            <p className="text-center text-charcoal/50 text-sm">
              Loading your orders...
            </p>
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-10 text-center bg-white border border-charcoal/10 rounded-[20px] px-6 py-14">
            <span className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-cream-dark text-2xl">
              🧾
            </span>
            <p className="font-display text-2xl mt-4">No orders yet</p>
            <p className="text-charcoal/60 mt-2 text-[15px]">
              You have not placed any orders yet. Your delicious history will
              appear here.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const itemCount = order.items.reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              const previewItems = order.items.slice(0, 3);
              const extraCount = order.items.length - previewItems.length;
              const isReordering = reorderingId === order._id;
              const cancelled = order.orderStatus === "Cancelled";
              return (
                <article
                  key={order._id}
                  className="bg-white border border-charcoal/10 rounded-[20px] p-5 sm:p-6 shadow-[0_15px_35px_-24px_rgba(23,23,23,0.35)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-xl sm:text-2xl truncate">
                        Order #{order.orderId}
                        {order.orderType === "dine_in" && (
                          <span className="ml-2 align-middle text-xs font-sans font-semibold bg-pine/10 text-pine border border-pine/20 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                            Dine-In{order.tableNumber ? ` · ${order.tableNumber}` : ""}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-charcoal/60 mt-1">
                        {formatOrderDate(order.createdAt)} · {itemCount} item
                        {itemCount === 1 ? "" : "s"} · {order.paymentMethod}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold border rounded-full px-3.5 py-1.5 ${statusBadgeClass(order.orderStatus)}`}
                    >
                      {cancelled
                        ? "Order Cancelled"
                        : (ORDER_STEP_LABELS[order.orderStatus] ||
                            order.orderStatus)}
                    </span>
                  </div>

                  {/* Food previews */}
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex -space-x-3">
                      {previewItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="w-12 h-12 rounded-xl overflow-hidden bg-cream-dark border-2 border-white shadow-sm shrink-0"
                        >
                          {item.image ? (
                            <MenuImage
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="h-full w-full flex items-center justify-center text-lg">
                              🍽️
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0 text-sm">
                      {previewItems.map((item) => (
                        <p key={item.name} className="truncate text-charcoal/80">
                          {item.name} × {item.quantity}
                        </p>
                      ))}
                      {extraCount > 0 && (
                        <p className="text-charcoal/50 text-[13px]">
                          +{extraCount} more item{extraCount === 1 ? "" : "s"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-charcoal/10">
                    <p className="text-[15px]">
                      <span className="text-charcoal/60">Total: </span>
                      <span className="font-display font-semibold text-xl text-burgundy">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                      <Link
                        to={`/orders/${order._id}`}
                        className="flex-1 sm:flex-none text-center border border-charcoal/20 rounded-full px-6 py-2.5 text-sm font-semibold hover:border-burgundy hover:text-burgundy transition-colors"
                      >
                        View Order
                      </Link>
                      <button
                        onClick={() => reorder(order._id)}
                        disabled={isReordering}
                        className="flex-1 sm:flex-none bg-burgundy text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-burgundy-dark transition-colors disabled:opacity-50"
                      >
                        {isReordering ? "Adding items to cart..." : "Reorder"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;

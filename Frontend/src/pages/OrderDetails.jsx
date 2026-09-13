import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";
import {
  ORDER_STEPS,
  ORDER_STEP_LABELS,
  getStepIndex,
  isCancelled,
  statusBadgeClass,
} from "../utils/orderStatus";
import { useReorder } from "../hooks/useReorder";
import MenuImage from "../components/MenuImage";
import CustomizationLines from "../components/CustomizationLines";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAddress(address) {
  if (!address) return "—";
  return [address.flat, address.street, address.landmark]
    .filter(Boolean)
    .join(", ");
}

function StatusTimeline({ status }) {
  if (isCancelled(status)) {
    return (
      <div
        role="status"
        className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center"
      >
        <p className="font-display font-semibold text-2xl text-red-700">
          Order Cancelled
        </p>
        <p className="text-sm text-red-600/80 mt-1">
          This order is no longer active. You can still reorder available
          items below.
        </p>
      </div>
    );
  }

  const current = getStepIndex(status);
  return (
    <ol aria-label="Order status timeline" className="space-y-0">
      {ORDER_STEPS.map((step, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <li key={step} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${
                  done
                    ? "bg-pine text-cream border-pine"
                    : active
                      ? "bg-burgundy text-white border-burgundy shadow-[0_8px_20px_-8px_rgba(217,45,32,0.7)]"
                      : "bg-white text-charcoal/30 border-charcoal/15"
                }`}
              >
                {done ? "✓" : active ? "●" : "○"}
              </span>
              {idx < ORDER_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`w-0.5 flex-1 min-h-[28px] ${
                    idx < current ? "bg-pine" : "bg-charcoal/10"
                  }`}
                />
              )}
            </div>
            <div className="pb-6 pt-1">
              <p
                className={`font-semibold text-[15px] ${
                  done || active ? "text-charcoal" : "text-charcoal/40"
                }`}
              >
                {ORDER_STEP_LABELS[step]}
              </p>
              <p className="text-[13px] text-charcoal/50">
                {done ? "Completed" : active ? "Current stage" : "Pending"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { reorder, reorderingId, notice, clearNotice } = useReorder();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.order);
      } catch {
        setError("Unable to load this order. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-cream text-charcoal min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-pulse" aria-label="Loading order details">
          <div className="h-4 w-32 bg-cream-dark rounded" />
          <div className="h-10 w-64 bg-cream-dark rounded mt-3" />
          <div className="h-4 w-48 bg-cream-dark rounded mt-2" />
          <div className="bg-white border border-charcoal/10 rounded-[20px] p-6 mt-8 space-y-4">
            <div className="h-5 w-40 bg-cream-dark rounded" />
            <div className="h-5 w-full bg-cream-dark rounded" />
            <div className="h-5 w-full bg-cream-dark rounded" />
            <div className="h-5 w-2/3 bg-cream-dark rounded" />
          </div>
          <p className="text-center text-charcoal/50 text-sm mt-6">
            Loading order...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-cream text-charcoal min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-burgundy font-medium">
            {error || "Order not found."}
          </p>
          <Link
            to="/orders"
            className="inline-block mt-6 bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const isReordering = reorderingId === order._id;
  const cancelled = isCancelled(order.orderStatus);

  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-fade-in">
        <Link to="/orders" className="text-burgundy hover:underline text-sm font-medium">
          &larr; Back to My Orders
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-3">
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-3xl sm:text-4xl break-words">
              Order #{order.orderId}
            </h1>
            <p className="text-sm text-charcoal/60 mt-1">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>
          <span
            className={`shrink-0 text-xs font-semibold border rounded-full px-3.5 py-1.5 ${statusBadgeClass(order.orderStatus)}`}
          >
            {cancelled
              ? "Order Cancelled"
              : ORDER_STEP_LABELS[order.orderStatus] || order.orderStatus}
          </span>
        </div>

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

        {/* Tracking timeline */}
        <section
          aria-label="Tracking"
          className="mt-6 bg-white border border-charcoal/10 rounded-[20px] p-6 shadow-[0_15px_35px_-24px_rgba(23,23,23,0.35)]"
        >
          <h2 className="font-display font-semibold text-2xl">Track your order</h2>
          <div className="mt-5">
            <StatusTimeline status={order.orderStatus} />
          </div>
        </section>

        {/* Details */}
        <section className="mt-4 bg-white border border-charcoal/10 rounded-[20px] p-6 shadow-[0_15px_35px_-24px_rgba(23,23,23,0.35)]">
          <div className="grid sm:grid-cols-2 gap-5 text-sm">
            <div>
              <p className="text-charcoal/50 text-xs uppercase tracking-[0.2em]">
                Customer
              </p>
              <p className="font-semibold mt-1">{order.customerName}</p>
              <p className="text-charcoal/70 mt-0.5">{order.mobile}</p>
            </div>
            <div>
              <p className="text-charcoal/50 text-xs uppercase tracking-[0.2em]">
                Payment
              </p>
              <p className="font-semibold mt-1">{order.paymentMethod}</p>
              <p className="text-charcoal/70 mt-0.5">Pay on delivery</p>
            </div>
          </div>

          <div className="mt-5 text-sm">
            <p className="text-charcoal/50 text-xs uppercase tracking-[0.2em]">
              Delivery address
            </p>
            <p className="mt-1 leading-relaxed">
              {formatAddress(order.address)}
              <br />
              {order.address.city}, {order.address.state}{" "}
              {order.address.pincode}
              {order.address.instructions && (
                <span className="block text-charcoal/60 mt-1">
                  Note: {order.address.instructions}
                </span>
              )}
            </p>
          </div>

          <div className="pt-5 mt-5 border-t border-charcoal/10">
            <p className="text-charcoal/50 text-xs uppercase tracking-[0.2em]">
              Items
            </p>
            <div className="mt-3 space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-12 h-12 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                    {item.image ? (
                      <MenuImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="h-full w-full flex items-center justify-center">
                        🍽️
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-charcoal/60">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                    <CustomizationLines
                      customization={item.customization}
                      compact
                    />
                  </div>
                  <p className="font-medium whitespace-nowrap">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-charcoal/10 space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="text-charcoal/60">Subtotal</span>
              <span className="font-medium">{formatPrice(order.subtotal)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-charcoal/60">Delivery</span>
              <span className="font-medium">
                {order.deliveryCharge === 0
                  ? "Free"
                  : formatPrice(order.deliveryCharge)}
              </span>
            </p>
            <p className="flex justify-between font-display font-semibold text-xl pt-1">
              <span>Total</span>
              <span className="text-burgundy">
                {formatPrice(order.totalAmount)}
              </span>
            </p>
            <p className="flex justify-between text-[13px]">
              <span className="text-charcoal/60">Current status</span>
              <span className="font-semibold">
                {cancelled
                  ? "Order Cancelled"
                  : ORDER_STEP_LABELS[order.orderStatus] || order.orderStatus}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
            <button
              onClick={() => reorder(order._id)}
              disabled={isReordering}
              className="flex-1 bg-burgundy text-white rounded-full py-3 text-sm font-semibold hover:bg-burgundy-dark transition-colors disabled:opacity-50"
            >
              {isReordering ? "Adding items to cart..." : "Reorder"}
            </button>
            <Link
              to="/cart"
              className="flex-1 text-center border border-charcoal/20 rounded-full py-3 text-sm font-semibold hover:border-burgundy hover:text-burgundy transition-colors"
            >
              Go to Cart
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default OrderDetails;

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";
import MenuImage from "../components/MenuImage";

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.order);
      } catch {
        setError("Unable to load this order.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <p className="p-6 text-center">Loading order...</p>;

  if (error || !order) {
    return (
      <div className="bg-cream text-charcoal">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-burgundy">{error || "Order not found."}</p>
          <Link
            to="/orders"
            className="inline-block mt-6 bg-charcoal text-cream px-8 py-3 rounded-full text-sm hover:bg-burgundy transition-colors"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream text-charcoal">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link to="/orders" className="text-burgundy hover:underline text-sm">
          &larr; Back to My Orders
        </Link>
        <h1 className="font-display text-4xl mt-3">Order {order.orderId}</h1>
        <p className="text-sm text-charcoal/60 mt-1">
          Placed on {new Date(order.createdAt).toLocaleString()} ·{" "}
          {order.orderStatus}
        </p>

        <div className="mt-8 border border-charcoal/10 rounded-2xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <p>
              <span className="block text-charcoal/50 text-xs uppercase tracking-[0.2em]">
                Customer
              </span>
              {order.customerName} · {order.mobile}
            </p>
            <p>
              <span className="block text-charcoal/50 text-xs uppercase tracking-[0.2em]">
                Payment method
              </span>
              {order.paymentMethod}
            </p>
          </div>
          <p className="text-sm">
            <span className="block text-charcoal/50 text-xs uppercase tracking-[0.2em]">
              Delivery address
            </span>
            {[
              order.address.flat,
              order.address.street,
              order.address.landmark,
              `${order.address.city}, ${order.address.state} ${order.address.pincode}`,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>

          <div className="pt-4 border-t border-charcoal/10 space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                  <MenuImage
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-charcoal/60">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium whitespace-nowrap">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-charcoal/10 space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="text-charcoal/60">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-charcoal/60">Delivery</span>
              <span>
                {order.deliveryCharge === 0
                  ? "Free"
                  : formatPrice(order.deliveryCharge)}
              </span>
            </p>
            <p className="flex justify-between font-display text-xl">
              <span>Total</span>
              <span className="text-burgundy">
                {formatPrice(order.totalAmount)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;

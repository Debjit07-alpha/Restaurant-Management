import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";
import MenuImage from "../components/MenuImage";

function formatAddress(address) {
  if (!address) return "";
  return [
    address.flat,
    address.street,
    address.landmark,
    `${address.city}, ${address.state} ${address.pincode}`,
  ]
    .filter(Boolean)
    .join(", ");
}

function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data.order);
      } catch {
        setError("Unable to load your order.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <p className="p-6 text-center">Loading order...</p>;

  return (
    <div className="bg-cream text-charcoal">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {error || !order ? (
          <div className="text-center">
            <p className="text-burgundy">{error || "Order not found."}</p>
            <Link
              to="/orders"
              className="inline-block mt-6 bg-charcoal text-cream px-8 py-3 rounded-full text-sm hover:bg-burgundy transition-colors"
            >
              View My Orders
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-charcoal text-cream text-2xl">
                ✓
              </span>
              <h1 className="font-display text-4xl sm:text-5xl mt-4">
                Order placed <span className="italic text-burgundy">successfully</span>
              </h1>
              <p className="text-charcoal/60 mt-3">
                Thank you for ordering from TastyBites.
              </p>
            </div>

            <div className="mt-10 border border-charcoal/10 rounded-2xl p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <p>
                  <span className="block text-charcoal/50 text-xs uppercase tracking-[0.2em]">
                    Order ID
                  </span>
                  <span className="font-medium">{order.orderId}</span>
                </p>
                <p>
                  <span className="block text-charcoal/50 text-xs uppercase tracking-[0.2em]">
                    Status
                  </span>
                  <span className="font-medium">{order.orderStatus}</span>
                </p>
                <p>
                  <span className="block text-charcoal/50 text-xs uppercase tracking-[0.2em]">
                    Order total
                  </span>
                  <span className="font-display text-xl text-burgundy">
                    {formatPrice(order.totalAmount)}
                  </span>
                </p>
                <p>
                  <span className="block text-charcoal/50 text-xs uppercase tracking-[0.2em]">
                    Payment method
                  </span>
                  <span className="font-medium">{order.paymentMethod}</span>
                </p>
              </div>
              <p className="text-sm">
                <span className="block text-charcoal/50 text-xs uppercase tracking-[0.2em]">
                  Delivery address
                </span>
                <span>{formatAddress(order.address)}</span>
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
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/orders"
                className="flex-1 text-center bg-charcoal text-cream rounded-full py-3 text-sm hover:bg-burgundy transition-colors"
              >
                View My Orders
              </Link>
              <Link
                to="/"
                className="flex-1 text-center border border-charcoal/20 rounded-full py-3 text-sm hover:border-burgundy hover:text-burgundy transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OrderSuccess;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");
        setOrders(res.data.orders || []);
      } catch {
        setError("Unable to load your orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <p className="p-6 text-center">Loading orders...</p>;

  return (
    <div className="bg-cream text-charcoal">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-sm uppercase tracking-[0.25em] text-burgundy">
          Order history
        </p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2">My Orders</h1>

        {error && (
          <p className="mt-6 bg-red-100 text-red-700 text-sm p-3 rounded-xl">
            {error}
          </p>
        )}
        {!error && orders.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-charcoal/60">You have not placed any orders yet.</p>
            <Link
              to="/"
              className="inline-block mt-6 bg-charcoal text-cream px-8 py-3 rounded-full text-sm hover:bg-burgundy transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            return (
              <div
                key={order._id}
                className="border border-charcoal/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1">
                  <p className="font-display text-xl">Order {order.orderId}</p>
                  <p className="text-sm text-charcoal/60 mt-1">
                    {new Date(order.createdAt).toLocaleString()} · {itemCount}{" "}
                    item{itemCount === 1 ? "" : "s"}
                  </p>
                  <p className="mt-2 text-sm">
                    <span className="font-display text-lg text-burgundy">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <span className="text-charcoal/60">
                      {" "}
                      · {order.paymentMethod} · {order.orderStatus}
                    </span>
                  </p>
                </div>
                <Link
                  to={`/orders/${order._id}`}
                  className="text-center border border-charcoal/20 rounded-full px-6 py-2 text-sm hover:border-burgundy hover:text-burgundy transition-colors"
                >
                  View Order
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MyOrders;

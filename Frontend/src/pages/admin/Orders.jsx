import { useEffect, useState } from "react";
import api from "../../api/axios";
import { formatPrice } from "../../utils/formatPrice";

const STATUSES = ["Pending", "Confirmed", "Preparing", "Ready", "Served", "Delivered", "Cancelled"];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/orders");
      setOrders(res.data.orders || []);
    } catch {
      setError("Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id, orderStatus) => {
    setUpdatingId(id);
    setError("");
    setMessage("");
    try {
      await api.put(`/orders/${id}/status`, { orderStatus });
      setMessage("Order status updated successfully.");
      setOrders((prev) =>
        prev.map((order) =>
          order._id === id ? { ...order, orderStatus } : order
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p>Loading orders...</p>;

  const visibleOrders = orders.filter((order) => {
    if (typeFilter === "all") return true;
    return (order.orderType || "delivery") === typeFilter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Orders</h1>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Order type filter"
          className="border rounded px-3 py-2 text-sm bg-white"
        >
          <option value="all">All</option>
          <option value="delivery">Delivery</option>
          <option value="dine_in">Dine-In</option>
        </select>
      </div>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}
      {message && (
        <p className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">{message}</p>
      )}
      {visibleOrders.length === 0 && !error && (
        <p className="text-gray-600">No orders yet.</p>
      )}

      {visibleOrders.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Order ID</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Customer Name</th>
                <th className="text-left p-3">Total Amount</th>
                <th className="text-left p-3">Payment Method</th>
                <th className="text-left p-3">Order Status</th>
                <th className="text-left p-3">Order Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order._id} className="border-t align-top">
                  <td className="p-3 font-medium">{order.orderId}</td>
                  <td className="p-3 whitespace-nowrap">
                    {order.orderType === "dine_in" ? (
                      <span>
                        Dine-In
                        <span className="block text-xs text-gray-500">
                          {order.tableNumber ? `Table ${order.tableNumber}` : ""}
                        </span>
                      </span>
                    ) : (
                      "Delivery"
                    )}
                  </td>
                  <td className="p-3">
                    {order.customerName}
                    <span className="block text-xs text-gray-500">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      item(s)
                    </span>
                  </td>
                  <td className="p-3">{formatPrice(order.totalAmount)}</td>
                  <td className="p-3">{order.paymentMethod}</td>
                  <td className="p-3">
                    <select
                      value={order.orderStatus}
                      disabled={updatingId === order._id}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Orders;

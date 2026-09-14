import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { formatPrice } from "../../utils/formatPrice";
import {
  AVAILABILITY,
  AVAILABILITY_META,
  resolveAvailabilityStatus,
} from "../../utils/availability";

function MenuItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      // Admin list includes hidden items (customer API excludes them).
      const res = await api.get("/menu-items/admin/all");
      setItems(res.data.menuItems || []);
    } catch {
      setError("Unable to load menu items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await api.delete(`/menu-items/${id}`);
      setMessage("Menu item deleted successfully.");
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete menu item.");
    }
  };

  const handleStatusChange = async (id, availabilityStatus) => {
    setUpdatingId(id);
    setError("");
    setMessage("");
    try {
      await api.patch(`/menu-items/${id}/availability`, {
        availabilityStatus,
      });
      setItems((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                availabilityStatus,
                availability: availabilityStatus === AVAILABILITY.AVAILABLE,
              }
            : item
        )
      );
      setMessage("Availability updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update availability."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p>Loading menu...</p>;

  const visibleItems = items.filter((item) => {
    if (statusFilter === "all") return true;
    return resolveAvailabilityStatus(item) === statusFilter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Menu Items</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-gray-600" htmlFor="status-filter">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm bg-white"
          >
            <option value="all">All</option>
            <option value={AVAILABILITY.AVAILABLE}>
              {AVAILABILITY_META.available.dot} Available
            </option>
            <option value={AVAILABILITY.SOLD_OUT}>
              {AVAILABILITY_META.sold_out.dot} Sold Out
            </option>
            <option value={AVAILABILITY.HIDDEN}>
              {AVAILABILITY_META.hidden.dot} Hidden
            </option>
          </select>
          <Link
            to="/admin/menu-items/add"
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Add Menu Item
          </Link>
        </div>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}
      {message && (
        <p className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">{message}</p>
      )}
      {visibleItems.length === 0 && !error && (
        <p className="text-gray-600">No menu items available.</p>
      )}

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Availability</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3">{item.category}</td>
                <td className="p-3">{formatPrice(item.price)}</td>
                <td className="p-3">
                  <select
                    value={resolveAvailabilityStatus(item)}
                    disabled={updatingId === item._id}
                    onChange={(e) =>
                      handleStatusChange(item._id, e.target.value)
                    }
                    aria-label={`Availability for ${item.name}`}
                    className="border rounded px-2 py-1 text-sm bg-white disabled:opacity-50"
                  >
                    <option value={AVAILABILITY.AVAILABLE}>
                      {AVAILABILITY_META.available.dot} Available
                    </option>
                    <option value={AVAILABILITY.SOLD_OUT}>
                      {AVAILABILITY_META.sold_out.dot} Sold Out
                    </option>
                    <option value={AVAILABILITY.HIDDEN}>
                      {AVAILABILITY_META.hidden.dot} Hidden
                    </option>
                  </select>
                  {updatingId === item._id && (
                    <span className="ml-2 text-xs text-gray-500">Updating...</span>
                  )}
                </td>
                <td className="p-3 space-x-2">
                  <Link
                    to={`/admin/menu-items/edit/${item._id}`}
                    className="inline-block bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MenuItems;

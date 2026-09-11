import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { formatPrice } from "../../utils/formatPrice";

function MenuItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/menu-items");
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

  if (loading) return <p>Loading menu...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Menu Items</h1>
        <Link
          to="/admin/menu-items/add"
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Add Menu Item
        </Link>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}
      {message && (
        <p className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">{message}</p>
      )}
      {items.length === 0 && !error && (
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
            {items.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3">{item.category}</td>
                <td className="p-3">{formatPrice(item.price)}</td>
                <td className="p-3">
                  {item.availability ? "In Stock" : "Out of Stock"}
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

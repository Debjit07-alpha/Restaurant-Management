import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../context/CartContext";
import MenuImage from "../components/MenuImage";

function MenuItemDetails() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/menu-items/${id}`);
        setItem(res.data.menuItem || null);
      } catch {
        setError("Unable to load menu item.");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) return <p className="p-6 text-center">Loading menu...</p>;
  if (error) return <p className="p-6 text-center text-red-600">{error}</p>;
  if (!item) return <p className="p-6 text-center">Menu item not found.</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-orange-600 hover:underline">
        &larr; Back to menu
      </Link>

      <div className="mt-4 bg-white rounded-lg shadow overflow-hidden md:flex">
        <MenuImage
          src={item.image}
          alt={item.name}
          className="w-full md:w-1/2 h-64 md:h-auto object-cover"
        />

        <div className="p-6 flex-1">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <p className="text-orange-600 font-bold text-xl mt-2">{formatPrice(item.price)}</p>
          <p className="text-gray-700 mt-4">{item.description}</p>

          <div className="mt-4 space-y-1 text-sm">
            <p>
              <span className="font-semibold">Category:</span> {item.category}
            </p>
            <p>
              <span className="font-semibold">Availability:</span>{" "}
              <span
                className={
                  item.availability ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
                }
              >
                {item.availability ? "In Stock" : "Out of Stock"}
              </span>
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-semibold">Quantity:</span>
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 border rounded hover:bg-gray-100"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 border rounded hover:bg-gray-100"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            onClick={() => addItem(item, quantity)}
            disabled={!item.availability}
            className="mt-4 w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuItemDetails;

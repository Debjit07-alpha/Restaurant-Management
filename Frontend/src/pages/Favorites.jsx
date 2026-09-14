import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../hooks/useFavorites";
import { isOrderable, isSoldOut } from "../utils/availability";
import MenuImage from "../components/MenuImage";

function FavoriteCard({ item, onRemoved }) {
  const { addItem } = useCart();
  const { toggleFavorite, pendingId } = useFavorites();
  const [cartMessage, setCartMessage] = useState("");
  // Favorites are never deleted on status change; sold-out/hidden
  // items stay visible here but cannot be added to cart.
  const outOfStock = !isOrderable(item);
  const toggling = pendingId === item._id;

  const handleAddToCart = () => {
    if (outOfStock) {
      setCartMessage(
        isSoldOut(item)
          ? `${item.name} is currently sold out.`
          : `${item.name} is currently unavailable.`
      );
      return;
    }
    const ok = addItem(item, 1);
    setCartMessage(
      ok ? `${item.name} added to your cart.` : `${item.name} is currently unavailable.`
    );
  };

  const handleRemove = async () => {
    const ok = await toggleFavorite(item._id);
    // Only refetch when the backend confirmed the removal; otherwise the
    // page-level error state already explains the failure.
    if (ok) onRemoved();
  };

  return (
    <article className="bg-white border border-charcoal/10 rounded-[20px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[0_15px_35px_-24px_rgba(23,23,23,0.35)]">
      <Link
        to={`/menu/${item._id}`}
        className="relative w-full sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-cream-dark block"
        aria-label={`View ${item.name}`}
      >
        <MenuImage
          src={item.image}
          alt={item.name}
          className="h-40 sm:h-28 w-full sm:w-28 object-cover"
        />
        {item.rating != null && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-cream/95 px-2 py-0.5 text-xs font-bold shadow-sm">
            <svg className="w-3 h-3 text-brand" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
            </svg>
            {item.rating}
          </span>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/menu/${item._id}`} className="hover:text-burgundy transition-colors min-w-0">
            <h3 className="text-[17px] font-bold leading-snug truncate">{item.name}</h3>
          </Link>
          <button
            onClick={handleRemove}
            disabled={toggling}
            aria-label={`Remove ${item.name} from favorites`}
            className="shrink-0 w-9 h-9 rounded-full bg-cream flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
          >
            <svg
              className="w-[18px] h-[18px] text-burgundy"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5C7 16.5 3.5 13.3 3.5 9.5A4.5 4.5 0 018 5c1.6 0 3.1.8 4 2.1A4.5 4.5 0 0116 5a4.5 4.5 0 014.5 4.5c0 3.8-3.5 7-8.5 11z" />
            </svg>
          </button>
        </div>
        {item.category && (
          <p className="text-xs uppercase tracking-[0.18em] text-charcoal/50 mt-0.5">
            {item.category}
          </p>
        )}
        <p className="text-burgundy font-bold mt-1">{formatPrice(item.price)}</p>
        {outOfStock && (
          <p className="text-xs font-medium text-charcoal/50 mt-1">
            {isSoldOut(item) ? "♥ Sold Out" : "Unavailable"}
          </p>
        )}
        {cartMessage && (
          <p role="status" className="text-[13px] text-pine mt-1">{cartMessage}</p>
        )}
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="mt-3 bg-burgundy text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-burgundy-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}

function Favorites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { version } = useFavorites();
  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/users/me/favorites");
      // Backend already filters out deleted items; guard anyway.
      setItems((res.data.favorites || []).filter(Boolean));
    } catch (err) {
      const status = err.response?.status;
      // eslint-disable-next-line no-console
      console.error("fetchFavorites failed:", status, err.response?.data || err.message);
      if (status === 401) {
        // Session expired — reuse the existing login flow.
        navigate("/login", {
          state: { returnTo: location.pathname + location.search },
        });
        return;
      }
      if (status === 404 && !err.response?.data?.success) {
        setError("Favorites service is unavailable. Please try again later.");
      } else {
        setError(
          err.response?.data?.message || "Unable to load your favorites. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // UserRoute already waits for auth, but guard anyway so a cold
    // token-restore never fires an unauthenticated request.
    if (authLoading) return;
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Refresh when a heart is toggled anywhere (e.g. menu cards).
  useEffect(() => {
    if (version > 0) fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const handleRemoved = () => {
    fetchFavorites();
  };

  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-fade-in">
        <p className="text-[13px] uppercase tracking-[0.25em] text-burgundy font-semibold">
          Saved dishes
        </p>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-2">
          My Favorites
        </h1>

        {loading && (
          <p className="mt-8 text-center text-charcoal/50 text-sm">
            Loading your favorites...
          </p>
        )}

        {!loading && error && (
          <div className="mt-6 bg-red-100 text-red-700 text-sm p-3.5 rounded-2xl border border-red-200">
            <p>{error}</p>
            <button
              onClick={fetchFavorites}
              className="mt-2 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-10 text-center bg-white border border-charcoal/10 rounded-[20px] px-6 py-14">
            <span className="text-5xl" role="img" aria-label="Favorites">
              ❤️
            </span>
            <p className="font-display font-semibold text-2xl mt-4">No favorites yet</p>
            <p className="text-charcoal/60 mt-2 text-[15px]">
              Save your favorite dishes here for quick access.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <FavoriteCard key={item._id} item={item} onRemoved={handleRemoved} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;

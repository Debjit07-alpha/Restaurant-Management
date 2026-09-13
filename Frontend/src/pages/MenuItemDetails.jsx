import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../hooks/useFavorites";
import { formatRating } from "../components/ProductReviews";
import MenuImage from "../components/MenuImage";
import MenuCard from "../components/MenuCard";
import ProductReviews from "../components/ProductReviews";

function MenuItemDetails() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite, pendingId } = useFavorites();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/menu-items/${id}`);
        const current = res.data.menuItem || null;
        setItem(current);
        // Related dishes: same category, excluding itself
        if (current) {
          const all = await api.get("/menu-items");
          setRelated(
            (all.data.menuItems || [])
              .filter((m) => m._id !== current._id && m.category === current.category)
              .slice(0, 4)
          );
        }
      } catch {
        setError("Unable to load menu item.");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[1520px] mx-auto px-6 lg:px-12 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="h-80 sm:h-[420px] rounded-[24px] bg-cream-dark animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-cream-dark rounded-full animate-pulse" />
            <div className="h-5 w-1/4 bg-cream-dark rounded-full animate-pulse" />
            <div className="h-4 w-full bg-cream-dark rounded-full animate-pulse" />
            <div className="h-4 w-5/6 bg-cream-dark rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-burgundy">{error}</p>
        <Link
          to="/"
          className="inline-block mt-6 border border-charcoal/20 rounded-full px-8 py-2.5 text-sm hover:border-burgundy hover:text-burgundy transition-colors"
        >
          Back to menu
        </Link>
      </div>
    );
  }

  if (!item) return <p className="p-6 text-center">Menu item not found.</p>;

  const outOfStock = !item.availability;
  const favorite = isFavorite(item._id);

  return (
    <div className="bg-cream text-charcoal">
      <div className="max-w-[1520px] mx-auto px-6 lg:px-12 py-8 sm:py-12">
        <Link to="/" className="text-sm text-charcoal/60 hover:text-burgundy transition-colors">
          &larr; Back to menu
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16 items-start animate-fade-in">
          {/* Image */}
          <div className="relative overflow-hidden rounded-[24px] bg-cream-dark shadow-[0_25px_50px_-20px_rgba(23,23,23,0.35)]">
            <MenuImage
              src={item.image}
              alt={item.name}
              className="w-full h-80 sm:h-[440px] object-cover"
            />
            {item.category && (
              <span className="absolute top-4 left-4 rounded-full bg-cream/95 px-4 py-1.5 text-[13px] font-medium shadow-sm">
                {item.category}
              </span>
            )}
            <button
              onClick={() => toggleFavorite(item._id)}
              disabled={pendingId === item._id}
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-cream/95 shadow-md flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
            >
              <svg
                className={`w-5 h-5 ${favorite ? "text-burgundy" : "text-charcoal/40"}`}
                viewBox="0 0 24 24"
                fill={favorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5C7 16.5 3.5 13.3 3.5 9.5A4.5 4.5 0 018 5c1.6 0 3.1.8 4 2.1A4.5 4.5 0 0116 5a4.5 4.5 0 014.5 4.5c0 3.8-3.5 7-8.5 11z" />
              </svg>
            </button>
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-brand" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
              </svg>
              {formatRating(item.ratingAverage) && (item.ratingCount || 0) > 0 ? (
                <>
                  <span className="font-semibold">
                    {formatRating(item.ratingAverage)} ({item.ratingCount} review{item.ratingCount === 1 ? "" : "s"})
                  </span>
                  <span className="text-charcoal/50">· Customer favorite</span>
                </>
              ) : (
                <span className="text-charcoal/50">No reviews yet · Customer favorite</span>
              )}
            </div>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-3">
              {item.name}
            </h1>
            <p className="font-display text-3xl text-burgundy mt-3">
              {formatPrice(item.price)}
            </p>
            <p className="text-charcoal/70 mt-5 leading-[1.8]">{item.description}</p>

            <p className="mt-5 text-sm">
              {outOfStock ? (
                <span className="inline-block rounded-full bg-charcoal/85 text-cream px-4 py-1.5 font-medium">
                  Out of Stock
                </span>
              ) : (
                <span className="inline-block rounded-full bg-pine/10 text-pine px-4 py-1.5 font-medium">
                  Available now
                </span>
              )}
            </p>

            <div className="mt-7 flex items-center gap-4">
              <span className="text-sm font-semibold">Quantity:</span>
              <div className="flex items-center gap-3 border border-charcoal/15 rounded-full px-2 py-1.5">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full hover:bg-cream-dark transition-colors text-lg"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-full hover:bg-cream-dark transition-colors text-lg"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => addItem(item, quantity)}
              disabled={outOfStock}
              className="mt-7 w-full sm:w-auto sm:min-w-[260px] bg-burgundy text-white rounded-[28px] h-[54px] px-10 text-[16px] font-semibold hover:bg-burgundy-dark transition-all hover:-translate-y-0.5 shadow-[0_10px_25px_-10px_rgba(217,45,32,0.6)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Add to Cart · {formatPrice(item.price * quantity)}
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-20">
          <ProductReviews menuItemId={item._id} />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display font-semibold text-3xl sm:text-4xl">
              You may also <span className="italic text-burgundy font-medium">like</span>
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((rel) => (
                <MenuCard key={rel._id} item={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuItemDetails;

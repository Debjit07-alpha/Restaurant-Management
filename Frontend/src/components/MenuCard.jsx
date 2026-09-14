import { Link } from "react-router-dom";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../hooks/useFavorites";
import { formatRating } from "./ProductReviews";
import { isHidden, isOrderable } from "../utils/availability";
import MenuImage from "./MenuImage";

function MenuCard({ item }) {
  const { cartItems, addItem, increaseQty, decreaseQty, removeItem } = useCart();
  const { isFavorite, toggleFavorite, pendingId } = useFavorites();
  // Hidden items never render on customer surfaces.
  if (isHidden(item)) return null;
  const outOfStock = !isOrderable(item);
  const favorite = isFavorite(item._id);
  const toggling = pendingId === item._id;
  // The inline stepper reflects plain (non-customized) cart lines only;
  // customized configurations are managed via the Cart -> Customize flow.
  const plainEntry = cartItems.find(
    (entry) => entry.id === item._id && !entry.customization
  );
  const cartQty = plainEntry?.quantity || 0;
  const shortDescription =
    item.description && item.description.length > 80
      ? item.description.slice(0, 80) + "..."
      : item.description;

  return (
    <article className="group h-full flex flex-col bg-white overflow-hidden border border-charcoal/10 shadow-[0_18px_40px_-24px_rgba(23,23,23,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-24px_rgba(23,23,23,0.4)] rounded-[20px]">
      <div className="block relative overflow-hidden bg-cream-dark">
        <Link to={`/menu/${item._id}`} className="block" aria-label={`View ${item.name}`}>
          <div className="h-56 w-full overflow-hidden">
            {item.image ? (
              <span className="block h-full w-full transition-transform duration-500 group-hover:scale-105">
                <MenuImage
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </span>
            ) : (
              <span className="flex h-full w-full items-center justify-center text-charcoal/30 italic font-display text-xl">
                TastyBites
              </span>
            )}
          </div>
        </Link>
        {item.category && (
          <span className="absolute top-3 left-3 rounded-full bg-cream/95 px-3 py-1 text-xs font-medium text-charcoal shadow-sm">
            {item.category}
          </span>
        )}
          <button
            onClick={() => toggleFavorite(item._id)}
            disabled={toggling}
            aria-label={favorite ? `Remove ${item.name} from favorites` : `Save ${item.name} to favorites`}
            aria-pressed={favorite}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-cream/95 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
        >
          <svg
            className={`w-[18px] h-[18px] ${favorite ? "text-burgundy" : "text-charcoal/40"}`}
            viewBox="0 0 24 24"
            fill={favorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5C7 16.5 3.5 13.3 3.5 9.5A4.5 4.5 0 018 5c1.6 0 3.1.8 4 2.1A4.5 4.5 0 0116 5a4.5 4.5 0 014.5 4.5c0 3.8-3.5 7-8.5 11z" />
          </svg>
        </button>
        {formatRating(item.ratingAverage) && (item.ratingCount || 0) > 0 && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-cream/95 px-2.5 py-1 text-xs font-bold shadow-sm">
            <svg className="w-3.5 h-3.5 text-brand" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
            </svg>
            {formatRating(item.ratingAverage)} ({item.ratingCount})
          </span>
        )}
        {outOfStock && (
          <span className="absolute bottom-3 right-3 rounded-full bg-charcoal/85 px-3 py-1 text-xs font-medium text-cream">
            Sold Out
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <Link to={`/menu/${item._id}`} className="hover:text-burgundy transition-colors">
          <h3 className="text-[17px] font-bold leading-snug">{item.name}</h3>
        </Link>
        <p className="text-sm text-charcoal/55 mt-1.5 flex-1">{shortDescription}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[19px] font-bold text-burgundy">
            {formatPrice(item.price)}
          </p>
          {outOfStock ? (
            <span
              aria-label={`${item.name} is sold out`}
              className="h-11 px-5 rounded-full bg-charcoal/10 text-charcoal/55 text-sm font-semibold flex items-center justify-center whitespace-nowrap"
            >
              Sold Out
            </span>
          ) : cartQty === 0 ? (
            <button
              onClick={() => addItem(item, 1)}
              aria-label={`Add ${item.name} to cart`}
              className="w-11 h-11 rounded-full bg-burgundy text-white text-[22px] leading-none flex items-center justify-center hover:bg-burgundy-dark active:scale-95 transition-all shadow-[0_8px_18px_-8px_rgba(217,45,32,0.8)]"
            >
              +
            </button>
          ) : (
            <div
              className="flex items-center gap-1 h-11 pl-1.5 pr-1.5 rounded-full bg-burgundy text-white shadow-[0_8px_18px_-8px_rgba(217,45,32,0.8)]"
              role="group"
              aria-label={`${item.name} quantity in cart`}
            >
              <button
                onClick={() =>
                  cartQty <= 1 ? removeItem(plainEntry.key) : decreaseQty(plainEntry.key)
                }
                aria-label={
                  cartQty <= 1
                    ? `Remove ${item.name} from cart`
                    : `Decrease ${item.name} quantity`
                }
                className="w-8 h-8 rounded-full text-[20px] leading-none flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
              >
                −
              </button>
              <span
                aria-live="polite"
                className="min-w-6 text-center text-[15px] font-bold tabular-nums"
              >
                {cartQty}
              </span>
              <button
                onClick={() => increaseQty(plainEntry.key)}
                aria-label={`Increase ${item.name} quantity`}
                className="w-8 h-8 rounded-full text-[20px] leading-none flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default MenuCard;

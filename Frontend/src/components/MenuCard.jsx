import { Link } from "react-router-dom";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../hooks/useFavorites";
import MenuImage from "./MenuImage";

function MenuCard({ item }) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite, pendingId } = useFavorites();
  const outOfStock = !item.availability;
  const favorite = isFavorite(item._id);
  const toggling = pendingId === item._id;
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
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-cream/95 shadow-sm flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
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
        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-cream/95 px-2.5 py-1 text-xs font-bold shadow-sm">
          <svg className="w-3.5 h-3.5 text-brand" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
          </svg>
          4.8
        </span>
        {outOfStock && (
          <span className="absolute bottom-3 right-3 rounded-full bg-charcoal/85 px-3 py-1 text-xs font-medium text-cream">
            Out of Stock
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
          <button
            onClick={() => addItem(item, 1)}
            disabled={outOfStock}
            aria-label={`Add ${item.name} to cart`}
            className="w-11 h-11 rounded-full bg-burgundy text-white text-[22px] leading-none flex items-center justify-center hover:bg-burgundy-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_8px_18px_-8px_rgba(217,45,32,0.8)]"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

export default MenuCard;

import { Link } from "react-router-dom";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../context/CartContext";
import MenuImage from "./MenuImage";

function MenuCard({ item }) {
  const { addItem } = useCart();
  const outOfStock = !item.availability;
  const shortDescription =
    item.description && item.description.length > 80
      ? item.description.slice(0, 80) + "..."
      : item.description;

  return (
    <article className="group flex flex-col bg-white overflow-hidden border border-charcoal/10 shadow-[0_18px_40px_-24px_rgba(23,21,21,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-24px_rgba(23,21,21,0.4)] rounded-[20px]">
      <Link to={`/menu/${item._id}`} className="block relative overflow-hidden bg-cream-dark">
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
        {item.category && (
          <span className="absolute top-3 left-3 rounded-full bg-cream/95 px-3 py-1 text-xs font-medium text-charcoal shadow-sm">
            {item.category}
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-3 right-3 rounded-full bg-charcoal/85 px-3 py-1 text-xs font-medium text-cream">
            Out of Stock
          </span>
        )}
      </Link>

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
            className="w-11 h-11 rounded-full bg-burgundy text-cream text-2xl leading-none flex items-center justify-center hover:bg-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

export default MenuCard;

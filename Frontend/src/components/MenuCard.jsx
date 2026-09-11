import { Link } from "react-router-dom";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../context/CartContext";
import MenuImage from "./MenuImage";

function MenuCard({ item }) {
  const { addItem } = useCart();
  const outOfStock = !item.availability;
  const shortDescription =
    item.description && item.description.length > 90
      ? item.description.slice(0, 90) + "..."
      : item.description;

  return (
    <article className="group flex flex-col">
      <Link
        to={`/menu/${item._id}`}
        className="block overflow-hidden rounded-2xl bg-cream-dark"
      >
        <div className="h-64 w-full overflow-hidden">
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

      <div className="pt-4 flex flex-col flex-1">
        <p className="text-xs uppercase tracking-[0.2em] text-burgundy">
          {item.category}
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl leading-snug">{item.name}</h3>
          <p className="font-display text-lg text-burgundy whitespace-nowrap">
            {formatPrice(item.price)}
          </p>
        </div>
        <p className="text-sm text-charcoal/60 mt-1 flex-1">{shortDescription}</p>

        {outOfStock ? (
          <p className="text-burgundy font-medium text-sm mt-3">Out of Stock</p>
        ) : (
          <p className="text-charcoal/50 text-sm mt-3">Available now</p>
        )}

        <div className="mt-3 flex gap-3">
          <Link
            to={`/menu/${item._id}`}
            className="flex-1 text-center border border-charcoal/20 rounded-full py-2 text-sm hover:border-burgundy hover:text-burgundy transition-colors"
          >
            View Details
          </Link>
          <button
            onClick={() => addItem(item, 1)}
            disabled={outOfStock}
            className="flex-1 bg-charcoal text-cream rounded-full py-2 text-sm hover:bg-burgundy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

export default MenuCard;

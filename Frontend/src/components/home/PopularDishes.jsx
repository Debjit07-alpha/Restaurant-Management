import MenuCard from "../MenuCard";
import { scrollToId } from "../../utils/scroll";

function PopularDishes({ items }) {
  const top = items.slice(0, 4);

  if (top.length === 0) return null;

  return (
    <section className="max-w-[1520px] mx-auto px-6 lg:px-12 pt-16 sm:pt-20 pb-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-3 mb-4">
            <span className="inline-block w-10 h-[2.5px] rounded-full bg-burgundy" />
          </p>
          <h2 className="font-display font-semibold text-4xl sm:text-[44px] leading-tight">
            Popular <span className="italic text-burgundy font-medium">Dishes</span>
          </h2>
          <p className="text-cocoa mt-3 text-[16px]">
            Customer favorites, made just for you.
          </p>
        </div>
        <button
          onClick={() => scrollToId("menu")}
          className="shrink-0 text-[15px] font-semibold text-burgundy hover:text-burgundy-dark transition-colors pb-1"
        >
          View all →
        </button>
      </div>

      <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {top.map((item) => (
          <MenuCard key={item._id} item={item} />
        ))}
      </div>
    </section>
  );
}

export default PopularDishes;

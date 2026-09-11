import { useRef } from "react";
import MenuCard from "../MenuCard";
import { scrollToId } from "../../utils/scroll";

function PopularDishes({ items, expanded, onToggleExpanded }) {
  const rowRef = useRef(null);
  const visible = expanded ? items : items.slice(0, 4);

  const scrollRow = (direction) => {
    rowRef.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <section id="menu" className="max-w-[1520px] mx-auto px-6 lg:px-12 pt-14 sm:pt-16 pb-4 scroll-mt-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-3 mb-4">
            <span className="inline-block w-10 h-[2.5px] rounded-full bg-burgundy" />
          </p>
          <h2 className="font-display font-semibold text-4xl sm:text-[44px] leading-tight">
            Popular <span className="italic text-burgundy font-medium">Today</span>
          </h2>
          <p className="text-cocoa mt-3 text-[16px]">
            Most loved dishes, chosen by our customers
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pb-1">
          <button
            onClick={() => {
              if (expanded) {
                onToggleExpanded();
              } else {
                onToggleExpanded();
                setTimeout(() => scrollToId("menu"), 100);
              }
            }}
            className="text-[15px] font-semibold text-burgundy hover:text-burgundy-dark transition-colors whitespace-nowrap"
          >
            {expanded ? "Show less" : "View All →"}
          </button>
          <button
            onClick={() => scrollRow(-1)}
            aria-label="Scroll dishes left"
            className="hidden sm:flex w-10 h-10 rounded-full border border-charcoal/15 bg-white items-center justify-center text-lg hover:border-burgundy hover:text-burgundy transition-colors shadow-sm"
          >
            ←
          </button>
          <button
            onClick={() => scrollRow(1)}
            aria-label="Scroll dishes right"
            className="hidden sm:flex w-10 h-10 rounded-full border border-charcoal/15 bg-white items-center justify-center text-lg hover:border-burgundy hover:text-burgundy transition-colors shadow-sm"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="mt-9 flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible"
      >
        {visible.map((item) => (
          <div key={item._id} className="min-w-[270px] sm:min-w-[300px] snap-start lg:min-w-0">
            <MenuCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default PopularDishes;

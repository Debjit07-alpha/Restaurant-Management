const CATEGORY_TABS = [
  { label: "All", value: "All" },
  { label: "Starters", value: "Starter" },
  { label: "Main Course", value: "Main Course" },
  { label: "Desserts", value: "Dessert" },
  { label: "Beverages", value: "Beverage" },
];

function CategoryFilter({ active, onChange }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
      {CATEGORY_TABS.map((tab) => {
        const selected = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm transition-all ${
              selected
                ? "bg-charcoal text-cream shadow-md"
                : "bg-white text-charcoal/70 border border-charcoal/15 hover:border-burgundy hover:text-burgundy"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;

import { useEffect, useState } from "react";
import { CATEGORY_TABS } from "../utils/categories";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "popular", label: "Popular" },
  { value: "rating", label: "Rating" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

const RATING_OPTIONS = [
  { value: "", label: "Any" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "4.5", label: "4.5+" },
];

// Filter drawer: right-side panel on desktop, bottom sheet on mobile.
// Controlled by Home (filters object + onChange). No data fetching here.
function FilterDrawer({ open, onClose, filters, onChange, onClear }) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  if (!open) return null;

  const set = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const toggleType = (value) => {
    const current = draft.type || [];
    set({
      type: current.includes(value)
        ? current.filter((t) => t !== value)
        : [...current, value],
    });
  };

  const toggleAvailability = (value) => {
    const current = draft.availability;
    const next = new Set(Array.isArray(current) ? current : ["available", "sold_out"]);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    // Empty = everything still visible (same as both checked).
    set({ availability: [...next] });
  };

  const checkedAvailability = Array.isArray(draft.availability)
    ? draft.availability
    : ["available", "sold_out"];

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Filters">
      <button
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-charcoal/50 cursor-default"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-cream rounded-t-[24px] p-6 sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[360px] sm:max-h-none sm:rounded-none sm:rounded-l-[24px] animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-2xl">Filters</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-white border border-charcoal/10 flex items-center justify-center hover:border-burgundy hover:text-burgundy transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <p className="text-sm font-bold">Category</p>
            <div className="mt-2 space-y-1.5">
              {CATEGORY_TABS.map((tab) => (
                <label key={tab.value} className="flex items-center gap-2.5 text-[15px] cursor-pointer">
                  <input
                    type="radio"
                    name="filter-category"
                    checked={(draft.category || "All") === tab.value}
                    onChange={() => set({ category: tab.value })}
                    className="w-4 h-4 accent-burgundy"
                  />
                  {tab.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold">Food Type</p>
            <div className="mt-2 space-y-1.5">
              {[
                { value: "veg", label: "Vegetarian" },
                { value: "non_veg", label: "Non-Vegetarian" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2.5 text-[15px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(draft.type || []).includes(option.value)}
                    onChange={() => toggleType(option.value)}
                    className="w-4 h-4 accent-burgundy"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold">Price</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={draft.minPrice || ""}
                onChange={(e) => set({ minPrice: e.target.value })}
                placeholder="Min ₹"
                aria-label="Minimum price"
                className="w-full border border-charcoal/15 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-burgundy"
              />
              <span className="text-charcoal/40">–</span>
              <input
                type="number"
                min="0"
                value={draft.maxPrice || ""}
                onChange={(e) => set({ maxPrice: e.target.value })}
                placeholder="Max ₹"
                aria-label="Maximum price"
                className="w-full border border-charcoal/15 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-burgundy"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-bold">Minimum Rating</p>
            <div className="mt-2 space-y-1.5">
              {RATING_OPTIONS.map((option) => (
                <label key={option.label} className="flex items-center gap-2.5 text-[15px] cursor-pointer">
                  <input
                    type="radio"
                    name="filter-rating"
                    checked={(draft.rating || "") === option.value}
                    onChange={() => set({ rating: option.value })}
                    className="w-4 h-4 accent-burgundy"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-charcoal/50 mt-1.5">
              Unrated dishes are excluded when a rating is selected.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold">Availability</p>
            <div className="mt-2 space-y-1.5">
              {[
                { value: "available", label: "Available" },
                { value: "sold_out", label: "Sold Out" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2.5 text-[15px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedAvailability.includes(option.value)}
                    onChange={() => toggleAvailability(option.value)}
                    className="w-4 h-4 accent-burgundy"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-2.5 sticky bottom-0 bg-cream pt-2 pb-1">
          <button
            onClick={() => {
              onChange(draft);
              onClose();
            }}
            className="flex-1 bg-burgundy text-white rounded-full py-3 text-sm font-semibold hover:bg-burgundy-dark transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              onClear();
              onClose();
            }}
            className="flex-1 border border-charcoal/20 rounded-full py-3 text-sm font-semibold hover:border-burgundy hover:text-burgundy transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterDrawer;
export { SORT_OPTIONS };

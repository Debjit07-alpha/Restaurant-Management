import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Hero from "../components/home/Hero";
import CategoryFilter from "../components/home/CategoryFilter";
import PopularDishes from "../components/home/PopularDishes";
import OfferBanner from "../components/home/OfferBanner";
import ServiceFeatures from "../components/home/ServiceFeatures";
import Testimonials from "../components/home/Testimonials";
import SiteFooter from "../components/home/SiteFooter";
import FilterDrawer, { SORT_OPTIONS } from "../components/FilterDrawer";
import { formatPrice } from "../utils/formatPrice";

const PAGE_LIMIT = 20;
const DEFAULT_AVAILABILITY = ["available", "sold_out"];

function DishSkeleton() {
  return (
    <div className="bg-white rounded-[20px] overflow-hidden border border-charcoal/10">
      <div className="h-56 bg-cream-dark animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-2/3 bg-cream-dark rounded-full animate-pulse" />
        <div className="h-4 w-full bg-cream-dark rounded-full animate-pulse" />
        <div className="h-4 w-1/3 bg-cream-dark rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// Read filter state from the URL (single source of truth, shareable).
function filtersFromParams(searchParams) {
  const get = (key) => (searchParams.get(key) || "").trim();
  const availability = get("availability")
    ? get("availability").split(",").filter((v) => v === "available" || v === "sold_out")
    : [...DEFAULT_AVAILABILITY];
  return {
    search: get("search"),
    category: get("category") || "All",
    type: get("type")
      ? get("type").split(",").filter((t) => t === "veg" || t === "non_veg")
      : [],
    minPrice: get("minPrice"),
    maxPrice: get("maxPrice"),
    rating: get("rating"),
    availability: availability.length > 0 ? availability : [...DEFAULT_AVAILABILITY],
    sort: get("sort") || "relevance",
  };
}

function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const requestId = useRef(0);

  const filters = filtersFromParams(searchParams);

  const isFiltering =
    Boolean(filters.search) ||
    filters.category !== "All" ||
    filters.type.length > 0 ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    Boolean(filters.rating) ||
    filters.availability.length !== 2 ||
    filters.sort !== "relevance";

  const activeFilterCount =
    (filters.category !== "All" ? 1 : 0) +
    filters.type.length +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    (filters.availability.length !== 2 ? 1 : 0);

  const toQuery = (pageNum) => {
    const params = { page: pageNum, limit: PAGE_LIMIT, sort: filters.sort };
    if (filters.search) params.search = filters.search;
    // Canonical category equality server-side; Healthy is the separate
    // isHealthy flag, never a category value.
    if (filters.category === "Healthy") {
      params.healthy = "true";
    } else if (filters.category !== "All") {
      params.category = filters.category.toLowerCase();
    }
    if (filters.type.length > 0) params.type = filters.type.join(",");
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.rating) params.rating = filters.rating;
    if (filters.availability.length === 1) {
      params.availability = filters.availability[0];
    }
    return params;
  };

  // Backend search: debounced, stale responses ignored (one request per
  // state change). Page resets to 1 whenever filters change.
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/menu-items/search", { params: toQuery(1) });
        if (requestId.current !== id) return;
        setItems(res.data.menuItems || []);
        setTotal(Number(res.data.total) || 0);
        setPage(1);
        setPages(Number(res.data.pages) || 1);
      } catch {
        if (requestId.current !== id) return;
        setError("Unable to load food results. Please try again.");
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchParams.toString(),
    retryKey,
  ]);

  const loadMore = async () => {
    if (loadingMore || page >= pages) return;
    const id = ++requestId.current;
    setLoadingMore(true);
    try {
      const res = await api.get("/menu-items/search", { params: toQuery(page + 1) });
      if (requestId.current !== id) return;
      setItems((prev) => [...prev, ...(res.data.menuItems || [])]);
      setTotal(Number(res.data.total) || 0);
      setPage((p) => p + 1);
      setPages(Number(res.data.pages) || 1);
    } catch {
      if (requestId.current !== id) return;
      setError("Unable to load food results. Please try again.");
    } finally {
      if (requestId.current === id) setLoadingMore(false);
    }
  };

  const writeParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    const setOrDelete = (key, value, isDefault) => {
      if (!value || isDefault) next.delete(key);
      else next.set(key, value);
    };
    if (patch.search !== undefined) setOrDelete("search", patch.search.trim(), true);
    if (patch.category !== undefined) setOrDelete("category", patch.category, patch.category === "All");
    if (patch.type !== undefined) setOrDelete("type", patch.type.join(","), patch.type.length === 0);
    if (patch.minPrice !== undefined) setOrDelete("minPrice", patch.minPrice, true);
    if (patch.maxPrice !== undefined) setOrDelete("maxPrice", patch.maxPrice, true);
    if (patch.rating !== undefined) setOrDelete("rating", patch.rating, true);
    if (patch.availability !== undefined) {
      const both = patch.availability.length !== 1;
      setOrDelete("availability", patch.availability.join(","), both);
    }
    if (patch.sort !== undefined) setOrDelete("sort", patch.sort, patch.sort === "relevance");
    setSearchParams(next, { replace: false });
    setExpanded(false);
  };

  const clearAll = () => {
    setSearchParams({}, { replace: false });
    setExpanded(false);
  };

  const chips = [];
  if (filters.search) {
    chips.push({ key: "search", label: `“${filters.search}”`, clear: () => writeParams({ search: "" }) });
  }
  if (filters.category !== "All") {
    chips.push({ key: "category", label: filters.category, clear: () => writeParams({ category: "All" }) });
  }
  filters.type.forEach((t) => {
    chips.push({
      key: `type-${t}`,
      label: t === "veg" ? "Vegetarian" : "Non-Vegetarian",
      clear: () => writeParams({ type: filters.type.filter((x) => x !== t) }),
    });
  });
  if (filters.minPrice || filters.maxPrice) {
    const range = `${filters.minPrice ? formatPrice(Number(filters.minPrice)) : "₹0"}–${filters.maxPrice ? formatPrice(Number(filters.maxPrice)) : "∞"}`;
    chips.push({
      key: "price",
      label: range,
      clear: () => writeParams({ minPrice: "", maxPrice: "" }),
    });
  }
  if (filters.rating) {
    chips.push({ key: "rating", label: `${filters.rating}★+`, clear: () => writeParams({ rating: "" }) });
  }
  if (filters.availability.length === 1) {
    chips.push({
      key: "availability",
      label: filters.availability[0] === "available" ? "Available" : "Sold Out",
      clear: () => writeParams({ availability: [...DEFAULT_AVAILABILITY] }),
    });
  }

  const showGrid = !loading && !error && items.length > 0;
  const showEmpty = !loading && !error && items.length === 0;

  return (
    <div className="bg-cream text-charcoal overflow-x-hidden">
      {/* 2. HERO */}
      <Hero items={items} />

      {/* 3. FOOD CATEGORIES */}
      <section className="max-w-[1520px] mx-auto px-6 lg:px-12 pt-4 pb-2">
        <CategoryFilter
          active={filters.category}
          onChange={(value) => writeParams({ category: value })}
        />
      </section>

      {/* 4. SEARCH TOOLBAR: filters, sort, count, chips */}
      <section className="max-w-[1520px] mx-auto px-6 lg:px-12 pt-6">
        <div className="flex flex-wrap items-center gap-3 bg-white border border-burgundy/20 rounded-[20px] px-4 sm:px-5 py-3.5 shadow-[0_12px_30px_-18px_rgba(217,45,32,0.45)]">
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold bg-burgundy text-white hover:bg-burgundy-dark active:scale-95 transition-all shadow-[0_8px_18px_-8px_rgba(217,45,32,0.8)]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-white text-burgundy text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-charcoal font-bold">Sort By</span>
            <select
              value={filters.sort}
              onChange={(e) => writeParams({ sort: e.target.value })}
              aria-label="Sort results"
              className="border-2 border-burgundy/30 rounded-full px-4 py-2 text-sm font-bold bg-cream text-charcoal focus:outline-none focus:border-burgundy cursor-pointer"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!loading && !error && (
          <p className="mt-3 text-[15px] font-semibold text-charcoal" aria-live="polite">
            <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-burgundy text-white text-sm font-bold mr-2">
              {total}
            </span>
            food{total === 1 ? "" : "s"} found
            {loadingMore ? " · Loading more..." : ""}
          </p>
        )}

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.clear}
                aria-label={`Remove ${chip.label} filter`}
                className="inline-flex items-center gap-1.5 border border-charcoal/15 bg-white rounded-full px-3.5 py-1.5 text-[13px] font-medium hover:border-burgundy hover:text-burgundy transition-colors"
              >
                {chip.label} <span aria-hidden>×</span>
              </button>
            ))}
            <button
              onClick={clearAll}
              className="text-[13px] font-semibold text-burgundy hover:text-burgundy-dark"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* 5. RESULTS (key replays the existing page fade on every
          category/filter/sort/search change — no reload, same visual
          language as route navigation) */}
      {showGrid && (
        <div key={searchParams.toString()} className="animate-fade-in">
          <PopularDishes
            items={items}
            expanded={expanded || isFiltering}
            onToggleExpanded={() => setExpanded((v) => !v)}
          />
          {page < pages && (
            <div className="max-w-[1520px] mx-auto px-6 lg:px-12 pb-4 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="border border-charcoal/20 rounded-full px-10 py-3 text-sm font-semibold hover:border-burgundy hover:text-burgundy transition-colors disabled:opacity-50 bg-white"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}

      {(loading || error || showEmpty) && (
        <section className="max-w-[1520px] mx-auto px-6 lg:px-12 py-10">
          {loading && items.length === 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <DishSkeleton key={i} />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="text-center py-8">
              <p className="text-burgundy">{error}</p>
              <button
                onClick={() => setRetryKey((k) => k + 1)}
                className="mt-4 border border-charcoal/20 rounded-full px-8 py-2.5 text-sm hover:border-burgundy hover:text-burgundy transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
          {showEmpty && (
            <div className="text-center py-8">
              <p className="text-5xl" aria-hidden>🔍</p>
              <p className="font-display font-semibold text-3xl mt-4">No dishes found.</p>
              <p className="text-charcoal/60 mt-2">
                {filters.category === "Healthy"
                  ? "No healthy dishes are currently available."
                  : filters.category !== "All"
                    ? "No dishes found in this category."
                    : "Try changing your filters or search term."}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={clearAll}
                  className="bg-burgundy text-white px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={clearAll}
                  className="border border-charcoal/20 px-8 py-2.5 rounded-full text-sm font-semibold hover:border-burgundy hover:text-burgundy transition-colors"
                >
                  Browse All
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {filters.search && items.length > 0 && !loading && (
        <div className="max-w-[1520px] mx-auto px-6 lg:px-12 pb-2 flex items-center justify-center gap-3 text-sm">
          <p className="text-charcoal/60">
            Showing results for{" "}
            <span className="font-semibold text-charcoal">&ldquo;{filters.search}&rdquo;</span>
          </p>
          <button
            onClick={() => writeParams({ search: "" })}
            className="text-burgundy hover:text-burgundy-dark font-semibold"
          >
            Clear
          </button>
        </div>
      )}

      {/* 6. SPECIAL OFFER BANNER */}
      <OfferBanner items={items} />

      {/* 7. SERVICE FEATURES */}
      <ServiceFeatures />

      {/* 8. CUSTOMER REVIEWS */}
      <div className="bg-cream-dark/40">
        <Testimonials />
      </div>

      {/* 9. FOOTER */}
      <SiteFooter />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={{
          category: filters.category,
          type: filters.type,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          rating: filters.rating,
          availability: filters.availability,
        }}
        onChange={(draft) => writeParams(draft)}
        onClear={clearAll}
      />
    </div>
  );
}

export default Home;

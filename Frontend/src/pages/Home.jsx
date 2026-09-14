import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Hero from "../components/home/Hero";
import CategoryFilter from "../components/home/CategoryFilter";
import PopularDishes from "../components/home/PopularDishes";
import OfferBanner from "../components/home/OfferBanner";
import ServiceFeatures from "../components/home/ServiceFeatures";
import Testimonials from "../components/home/Testimonials";
import SiteFooter from "../components/home/SiteFooter";
import { matchesCategory } from "../utils/categories";
import { isHidden } from "../utils/availability";

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

function Home() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("search") || "").trim();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/menu-items");
        // Hidden items never reach customer surfaces (backend filters
        // too; this guards search/category/hero lists alike).
        setMenuItems((res.data.menuItems || []).filter((m) => !isHidden(m)));
      } catch {
        setError("Unable to load today's menu.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [retryKey]);

  const q = query.toLowerCase();
  const filtered = menuItems.filter((item) => {
    const matchesQuery =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q);
    return matchesCategory(item, category) && matchesQuery;
  });

  const clearSearch = () => {
    setSearchParams({}, { replace: true });
  };

  const showGridStates = loading || error || filtered.length === 0;

  return (
    <div className="bg-cream text-charcoal overflow-x-hidden">
      {/* 2. HERO */}
      <Hero items={menuItems} />

      {/* 3. FOOD CATEGORIES */}
      <section className="max-w-[1520px] mx-auto px-6 lg:px-12 pt-4 pb-2">
        <CategoryFilter
          active={category}
          onChange={(value) => {
            setCategory(value);
            setExpanded(false);
          }}
        />
      </section>

      {/* 4. POPULAR TODAY (+ full results when filtering/searching) */}
      {!showGridStates && (
        <PopularDishes
          items={filtered}
          expanded={expanded || Boolean(query)}
          onToggleExpanded={() => setExpanded((v) => !v)}
        />
      )}

      {(loading || error || filtered.length === 0) && (
        <section className="max-w-[1520px] mx-auto px-6 lg:px-12 py-10">
          {loading && (
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
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="font-display font-semibold text-3xl">No dishes available yet.</p>
              <p className="text-charcoal/60 mt-2">Please check back soon.</p>
              {(query || category !== "All") && (
                <button
                  onClick={() => {
                    clearSearch();
                    setCategory("All");
                  }}
                  className="mt-4 text-sm text-burgundy hover:text-burgundy-dark font-semibold"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {query && filtered.length > 0 && (
        <div className="max-w-[1520px] mx-auto px-6 lg:px-12 pb-2 flex items-center justify-center gap-3 text-sm">
          <p className="text-charcoal/60">
            Showing results for{" "}
            <span className="font-semibold text-charcoal">&ldquo;{query}&rdquo;</span>
          </p>
          <button
            onClick={clearSearch}
            className="text-burgundy hover:text-burgundy-dark font-semibold"
          >
            Clear
          </button>
        </div>
      )}

      {/* 5. SPECIAL OFFER BANNER */}
      <OfferBanner items={menuItems} />

      {/* 6. SERVICE FEATURES */}
      <ServiceFeatures />

      {/* 7. CUSTOMER REVIEWS */}
      <div className="bg-cream-dark/40">
        <Testimonials />
      </div>

      {/* 8. FOOTER */}
      <SiteFooter />
    </div>
  );
}

export default Home;

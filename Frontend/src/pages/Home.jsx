import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import MenuCard from "../components/MenuCard";
import MenuImage from "../components/MenuImage";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../context/CartContext";
import { scrollToId } from "../utils/scroll";
import Hero from "../components/home/Hero";
import CategoryFilter from "../components/home/CategoryFilter";
import PopularDishes from "../components/home/PopularDishes";
import SiteFooter from "../components/home/SiteFooter";

function Stats({ items }) {
  const available = items.filter((item) => item.availability).length;
  const categories = new Set(items.map((item) => item.category)).size;

  const stats = [
    { value: items.length, label: "On the menu" },
    { value: available, label: "Available now" },
    { value: categories, label: "Categories" },
  ];

  return (
    <section className="border-y border-charcoal/10 bg-cream-dark/40">
      <div className="max-w-[1520px] mx-auto px-6 lg:px-12 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-display text-4xl text-burgundy">{s.value}</p>
            <p className="mt-1 text-sm uppercase tracking-[0.2em] text-charcoal/60">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DishSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-charcoal/10">
      <div className="h-52 bg-cream-dark animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-2/3 bg-cream-dark rounded-full animate-pulse" />
        <div className="h-4 w-full bg-cream-dark rounded-full animate-pulse" />
        <div className="h-4 w-1/3 bg-cream-dark rounded-full animate-pulse" />
      </div>
    </div>
  );
}

function Featured({ item }) {
  const { addItem } = useCart();
  if (!item) return null;
  const outOfStock = !item.availability;

  return (
      <section id="featured" className="max-w-[1520px] mx-auto px-6 lg:px-12 py-16 sm:py-24">
      <p className="text-sm uppercase tracking-[0.25em] text-burgundy">
        Made fresh today
      </p>
      <div className="mt-6 grid gap-10 md:grid-cols-2 items-center">
        <div className="overflow-hidden rounded-3xl bg-cream-dark h-80 sm:h-[28rem] shadow-lg">
          {item.image ? (
            <MenuImage
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display italic text-charcoal/30 text-2xl">
              TastyBites
            </span>
          )}
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-charcoal/50">
            {item.category}
          </p>
          <h3 className="font-display text-4xl sm:text-5xl mt-2">{item.name}</h3>
          <p className="font-display text-2xl text-burgundy mt-3">
            {formatPrice(item.price)}
          </p>
          <p className="text-charcoal/70 mt-4 leading-relaxed">
            {item.description}
          </p>
          <p className="mt-3 text-sm">
            {outOfStock ? (
              <span className="text-burgundy font-medium">Out of Stock</span>
            ) : (
              <span className="text-charcoal/50">Available now</span>
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/menu/${item._id}`}
              className="border border-charcoal/20 rounded-full px-7 py-2.5 text-sm hover:border-burgundy hover:text-burgundy transition-colors"
            >
              View details
            </Link>
            <button
              onClick={() => addItem(item, 1)}
              disabled={outOfStock}
              className="bg-charcoal text-cream rounded-full px-7 py-2.5 text-sm hover:bg-burgundy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [category, setCategory] = useState("All");
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("search") || "").trim();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/menu-items");
        setMenuItems(res.data.menuItems || []);
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
    const matchesCategory = category === "All" || item.category === category;
    const matchesQuery =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const featuredItem =
    menuItems.find((item) => item.image) || menuItems[0] || null;
  const aboutImage =
    menuItems.find((item) => item.image && item._id !== featuredItem?._id)?.image ||
    featuredItem?.image ||
    "";

  const clearSearch = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="bg-cream text-charcoal overflow-x-hidden">
      <Hero items={menuItems} />

      <Stats items={menuItems} />

      <PopularDishes items={filtered} />

      {/* FULL MENU */}
      <section
        id="menu"
        className="max-w-[1520px] mx-auto px-6 lg:px-12 pt-4 pb-16 sm:pb-24 scroll-mt-20"
      >
        <p className="text-sm uppercase tracking-[0.25em] text-burgundy text-center">
          Our kitchen
        </p>
        <h2 className="font-display text-4xl sm:text-5xl text-center mt-3">
          Today&apos;s <span className="italic text-burgundy">menu</span>
        </h2>
        <p className="text-center text-charcoal/60 mt-4 max-w-xl mx-auto">
          Everything below is prepared fresh today. Pick what you love and add
          it to your cart.
        </p>

        <div className="mt-8 max-w-3xl mx-auto">
          <CategoryFilter active={category} onChange={setCategory} />
        </div>

        {query && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <p className="text-charcoal/60">
              Showing results for{" "}
              <span className="font-semibold text-charcoal">
                &ldquo;{query}&rdquo;
              </span>
            </p>
            <button
              onClick={clearSearch}
              className="text-burgundy hover:text-burgundy-dark font-medium"
            >
              Clear
            </button>
          </div>
        )}

        <div className="mt-10">
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <DishSkeleton key={i} />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="text-center">
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
              <p className="font-display text-2xl">No dishes available yet.</p>
              <p className="text-charcoal/60 mt-2">Please check back soon.</p>
              {(query || category !== "All") && (
                <button
                  onClick={() => {
                    clearSearch();
                    setCategory("All");
                  }}
                  className="mt-4 text-sm text-burgundy hover:text-burgundy-dark font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => (
                <MenuCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ABOUT */}
      <div className="bg-cream-dark/50">
        <section
          id="about"
          className="max-w-[1520px] mx-auto px-6 lg:px-12 py-16 sm:py-24 grid gap-10 md:grid-cols-2 items-center scroll-mt-20"
        >
          <div className="overflow-hidden rounded-3xl bg-cream-dark h-72 sm:h-96 shadow-md order-2 md:order-1">
            {aboutImage ? (
              <MenuImage
                src={aboutImage}
                alt="Fresh from the TastyBites kitchen"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display italic text-charcoal/30 text-2xl">
                TastyBites
              </span>
            )}
          </div>
          <div className="order-1 md:order-2">
            <p className="text-sm uppercase tracking-[0.25em] text-burgundy">
              Our story
            </p>
            <h2 className="font-display text-4xl sm:text-5xl mt-3 leading-tight">
              A small kitchen with a{" "}
              <span className="italic text-burgundy">big love</span> for food.
            </h2>
            <p className="text-charcoal/70 mt-5 leading-relaxed">
              TastyBites started with a simple idea: cook every dish like
              it&apos;s for family. Our menu stays short on purpose — a
              careful selection of starters, mains, desserts and beverages,
              prepared fresh through the day and served with care.
            </p>
            <button
              onClick={() => scrollToId("menu")}
              className="mt-7 border border-charcoal/20 rounded-full px-8 py-3 text-sm hover:border-burgundy hover:text-burgundy transition-colors"
            >
              Explore menu →
            </button>
          </div>
        </section>
      </div>

      <div className="bg-cream-dark/50">
        <Featured item={featuredItem} />
      </div>

      {/* CTA */}
      <section className="max-w-[1520px] mx-auto px-6 lg:px-12 py-20 sm:py-28 text-center">
        <h2 className="font-display text-4xl sm:text-6xl">
          Hungry <span className="italic text-burgundy">already?</span>
        </h2>
        <p className="text-charcoal/60 mt-4 max-w-md mx-auto">
          Pick something you love from today&apos;s menu.
        </p>
        <button
          onClick={() => scrollToId("menu")}
          className="mt-8 bg-burgundy text-cream rounded-full px-10 py-3.5 text-sm hover:bg-burgundy-dark transition-all hover:-translate-y-0.5 shadow-md"
        >
          Order now
        </button>
      </section>

      <SiteFooter />
    </div>
  );
}

export default Home;

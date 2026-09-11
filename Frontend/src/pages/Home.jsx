import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import MenuCard from "../components/MenuCard";
import MenuImage from "../components/MenuImage";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../context/CartContext";

function scrollToMenu() {
  document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
}

function HeroCollage({ items }) {
  const withImages = items.filter((item) => item.image);
  const [featured, ...rest] = withImages;
  const small = rest.slice(0, 2);

  const overlay = (item) => (
    <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-full bg-cream/95 px-4 py-2 text-sm">
      <span className="truncate font-medium">{item.name}</span>
      <span className="font-display text-burgundy whitespace-nowrap">
        {formatPrice(item.price)}
      </span>
    </span>
  );

  const placeholder = (label) => (
    <span className="flex h-full w-full items-center justify-center bg-cream-dark font-display italic text-charcoal/30 text-xl">
      {label}
    </span>
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="relative col-span-2 h-72 sm:h-96 overflow-hidden rounded-3xl bg-cream-dark">
        {featured ? (
          <>
            <MenuImage
              src={featured.image}
              alt={featured.name}
              className="h-full w-full object-cover"
            />
            {overlay(featured)}
          </>
        ) : (
          placeholder("TastyBites")
        )}
      </div>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="relative h-40 sm:h-52 overflow-hidden rounded-3xl bg-cream-dark"
        >
          {small[i] ? (
            <>
              <MenuImage
                src={small[i].image}
                alt={small[i].name}
                className="h-full w-full object-cover"
              />
              {overlay(small[i])}
            </>
          ) : (
            placeholder("Fresh")
          )}
        </div>
      ))}
    </div>
  );
}

function Stats({ items }) {
  const available = items.filter((item) => item.availability).length;
  const categories = new Set(items.map((item) => item.category)).size;

  const stats = [
    { value: items.length, label: "On the menu" },
    { value: available, label: "Available now" },
    { value: categories, label: "Categories" },
  ];

  return (
    <section className="border-y border-charcoal/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
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

function Featured({ item }) {
  const { addItem } = useCart();
  if (!item) return null;
  const outOfStock = !item.availability;

  return (
    <section id="featured" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <p className="text-sm uppercase tracking-[0.25em] text-burgundy">
        Made fresh today
      </p>
      <div className="mt-6 grid gap-10 md:grid-cols-2 items-center">
        <div className="overflow-hidden rounded-3xl bg-cream-dark h-80 sm:h-[28rem]">
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

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await api.get("/menu-items");
        setMenuItems(res.data.menuItems || []);
      } catch {
        setError("Unable to load menu items.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const featuredItem =
    menuItems.find((item) => item.image) || menuItems[0] || null;

  return (
    <div className="bg-cream text-charcoal">
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-burgundy">
            Freshly prepared. Made for you.
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mt-4">
            Food worth
            <br />
            <span className="italic text-burgundy">coming back</span>
            <br />
            for.
          </h1>
          <p className="mt-6 text-charcoal/70 leading-relaxed max-w-md">
            A carefully prepared menu of starters, mains, desserts and
            beverages, made fresh and served with care.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={scrollToMenu}
              className="bg-charcoal text-cream rounded-full px-8 py-3 text-sm hover:bg-burgundy transition-colors"
            >
              Order now
            </button>
            <button
              onClick={scrollToMenu}
              className="border border-charcoal/20 rounded-full px-8 py-3 text-sm hover:border-burgundy hover:text-burgundy transition-colors"
            >
              Explore menu
            </button>
          </div>
        </div>
        <HeroCollage items={menuItems} />
      </section>

      <Stats items={menuItems} />

      {/* MENU */}
      <section id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
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

        <div className="mt-12">
          {loading && <p className="text-center">Loading menu...</p>}
          {!loading && error && (
            <p className="text-center text-burgundy">{error}</p>
          )}
          {!loading && !error && menuItems.length === 0 && (
            <p className="text-center text-charcoal/60">No menu items available.</p>
          )}
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => (
              <MenuCard key={item._id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <div className="bg-cream-dark/50">
        <Featured item={featuredItem} />
      </div>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <h2 className="font-display text-4xl sm:text-6xl">
          Hungry <span className="italic text-burgundy">already?</span>
        </h2>
        <p className="text-charcoal/60 mt-4 max-w-md mx-auto">
          Pick something you love from today&apos;s menu.
        </p>
        <button
          onClick={scrollToMenu}
          className="mt-8 bg-charcoal text-cream rounded-full px-10 py-3.5 text-sm hover:bg-burgundy transition-colors"
        >
          Order now
        </button>
      </section>

      {/* FOOTER */}
      <footer className="bg-charcoal text-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl">
              Tasty<span className="italic text-cream/70">Bites</span>
            </p>
            <p className="mt-4 text-sm text-cream/60 leading-relaxed max-w-xs">
              A small kitchen with a carefully prepared menu. Fresh
              ingredients, honest food, and great taste.
            </p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cream/50">
              Kitchen
            </p>
            <p className="mt-4 text-sm text-cream/70 leading-relaxed">
              Starters, mains, desserts and beverages, prepared fresh every day.
            </p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cream/50">
              Explore
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <a href="#menu" onClick={(e) => { e.preventDefault(); scrollToMenu(); }} className="hover:text-cream text-cream/70 w-fit">
                Menu
              </a>
              <Link to="/cart" className="hover:text-cream text-cream/70 w-fit">
                Cart
              </Link>
              <Link to="/login" className="hover:text-cream text-cream/70 w-fit">
                Login
              </Link>
              <Link to="/register" className="hover:text-cream text-cream/70 w-fit">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-cream/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cream/50">
            <p>© 2026 TastyBites</p>
            <p>All prices in INR.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

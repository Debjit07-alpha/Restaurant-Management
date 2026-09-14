import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import MenuCard from "../components/MenuCard";
import CategoryFilter from "../components/home/CategoryFilter";
import { matchesCategory } from "../utils/categories";
import { isHidden } from "../utils/availability";
import { useDineInCart } from "../context/DineInCartContext";

// Public dine-in landing: scan /dine-in/:tableNumber?token=...
// Guests can browse without login; ordering requires login (existing
// auth flow) at cart/checkout time.
function DineIn() {
  const { tableNumber } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const dineInCart = useDineInCart();
  const { setTable, totalQuantity } = dineInCart;

  const [table, setTableState] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const resolve = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/tables/resolve", {
          params: { tableNumber, token },
        });
        setTableState(res.data.table);
        setSessionId(res.data.session?.sessionId || "");
        setTable({
          tableNumber: res.data.table.tableNumber,
          capacity: res.data.table.capacity,
          section: res.data.table.section,
          sessionId: res.data.session?.sessionId || "",
          qrToken: token,
        });
        const menuRes = await api.get("/menu-items");
        setMenuItems(
          (menuRes.data.menuItems || []).filter((m) => !isHidden(m))
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to resolve this table. Please scan the QR code again."
        );
      } finally {
        setLoading(false);
      }
    };
    resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNumber, token]);

  if (loading) {
    return (
      <div className="bg-cream text-charcoal min-h-screen">
        <p className="p-6 text-center text-charcoal/50 text-sm">
          Loading your table...
        </p>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="bg-cream text-charcoal min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-burgundy font-medium">{error}</p>
          <Link
            to="/"
            className="inline-block mt-6 bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const filtered = menuItems.filter((item) => matchesCategory(item, category));

  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <div className="max-w-[1520px] mx-auto px-6 lg:px-12 pt-8 pb-2 text-center">
        <p className="font-display text-xl">
          Tasty<span className="italic text-burgundy">Bites</span>
        </p>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-2">
          Dine-in <span className="italic text-burgundy font-medium">Table {table.tableNumber}</span>
        </h1>
        <p className="text-charcoal/60 mt-2 text-[15px]">
          You&apos;re ordering for this table
          {table.section ? ` · ${table.section}` : ""}.
        </p>
        {sessionId && (
          <p className="text-xs text-charcoal/45 mt-1">Session: {sessionId}</p>
        )}
        <div className="mt-5 flex items-center justify-center gap-3">
          <a
            href="#dine-in-menu"
            className="bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
          >
            Browse Menu
          </a>
          <Link
            to="/dine-in/cart"
            className="border border-charcoal/20 px-8 py-3 rounded-full text-sm font-semibold hover:border-burgundy hover:text-burgundy transition-colors"
          >
            Dine-In Cart ({totalQuantity})
          </Link>
        </div>
      </div>

      <section className="max-w-[1520px] mx-auto px-6 lg:px-12 pt-4 pb-2">
        <CategoryFilter active={category} onChange={setCategory} />
      </section>

      <section id="dine-in-menu" className="max-w-[1520px] mx-auto px-6 lg:px-12 py-8 scroll-mt-24">
        {filtered.length === 0 ? (
          <p className="text-center text-charcoal/60 py-8">
            No dishes in this category right now.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((item) => (
              <MenuCard key={item._id} item={item} cart={dineInCart} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default DineIn;

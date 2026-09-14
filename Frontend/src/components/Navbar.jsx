import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import NotificationBell from "./NotificationBell";

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function ChefHatIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 13.5A3.5 3.5 0 017.5 6.6a5 5 0 019.74 1.42A3.75 3.75 0 0117.5 15H7m0 0V6.75M7 13.5h10.5M7 16.5h10.5M9.5 19.5h5"
      />
    </svg>
  );
}

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalQuantity } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const closeMenu = () => setOpen(false);

  // Section links live on the homepage: scroll in place, or go home first.
  const goToSection = (id) => (e) => {
    e.preventDefault();
    closeMenu();
    if (location.pathname === "/") {
      scrollToId(id);
    } else {
      navigate("/");
      setTimeout(() => scrollToId(id), 150);
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    closeMenu();
    const q = search.trim();
    if (location.pathname === "/") {
      navigate(q ? `/?search=${encodeURIComponent(q)}` : "/", { replace: true });
      setTimeout(() => scrollToId("menu"), 100);
    } else {
      navigate(q ? `/?search=${encodeURIComponent(q)}` : "/");
    }
  };

  const searchBox = (extraClass) => (
    <form onSubmit={submitSearch} className={extraClass} role="search">
      <svg
        className="w-[18px] h-[18px] text-charcoal/40 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
        />
      </svg>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search for your favorite dishes..."
        aria-label="Search menu"
        className="bg-transparent outline-none text-[15px] w-full placeholder:text-charcoal/40"
      />
    </form>
  );

  const navLink = (label, active, onClick, href = "#") => (
    <a
      href={href}
      onClick={onClick}
      className={`relative pb-1 transition-colors ${
        active ? "text-burgundy font-semibold" : "text-charcoal/80 hover:text-burgundy"
      }`}
    >
      {label}
      {active && (
        <span className="absolute left-0 right-0 -bottom-0.5 h-[2.5px] rounded-full bg-burgundy" />
      )}
    </a>
  );

  return (
    <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-charcoal/10">
      <div className="max-w-[1520px] mx-auto px-6 lg:px-12 h-[76px] flex items-center gap-8">
        {/* Brand lockup */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={closeMenu}>
          <span className="w-11 h-11 rounded-full bg-burgundy text-cream flex items-center justify-center shadow-sm">
            <ChefHatIcon className="w-6 h-6" />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[26px] font-semibold tracking-tight">
              Tasty<span className="italic text-burgundy">Bites</span>
            </span>
            <span className="hidden sm:block text-[9px] tracking-[0.22em] text-charcoal/50 mt-1">
              GOOD FOOD, HAPPY PEOPLE
            </span>
          </span>
        </Link>

        {/* Center nav */}
        <div className="hidden lg:flex items-center gap-8 text-[16px] ml-4">
          <Link
            to="/"
            onClick={closeMenu}
            className="relative pb-1 text-burgundy font-semibold"
          >
            Home
            <span className="absolute left-0 right-0 -bottom-0.5 h-[2.5px] rounded-full bg-burgundy" />
          </Link>
          {navLink("Menu", false, goToSection("menu"))}
          {navLink("About", false, goToSection("about"))}
          {navLink("Offers", false, goToSection("offers"))}
          {navLink("Contact", false, goToSection("contact"))}
        </div>

        {/* Search */}
        {searchBox("hidden xl:flex items-center gap-2.5 bg-white border border-charcoal/10 rounded-full pl-5 pr-4 h-[48px] w-[420px] ml-auto shadow-sm")}

        {/* Right cluster */}
        <div className="hidden md:flex items-center gap-5 text-[15px] shrink-0 ml-auto xl:ml-0">
          {isAdmin && (
            <Link to="/admin/dashboard" className="hover:text-burgundy transition-colors font-medium">
              Dashboard
            </Link>
          )}

          {!user ? (
            <>
              <Link to="/login" className="hover:text-burgundy transition-colors font-medium">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-charcoal text-cream px-6 py-2.5 rounded-full hover:bg-burgundy transition-colors font-medium"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <span className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-full bg-burgundy text-cream flex items-center justify-center font-semibold text-lg">
                {(user.name || "U").charAt(0).toUpperCase()}
              </span>
              <span className="leading-tight hidden lg:block">
                <span className="block text-sm font-semibold whitespace-nowrap">
                  Hi, {user.name}
                </span>
              </span>
              <svg className="w-4 h-4 text-charcoal/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </span>
          )}

          {user && <NotificationBell />}

          <Link
            to="/cart"
            className="flex items-center gap-2 bg-burgundy text-white rounded-full pl-4 pr-5 h-[46px] font-medium hover:bg-burgundy-dark transition-colors shadow-[0_8px_20px_-8px_rgba(217,45,32,0.7)]"
          >
            <span className="relative">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {totalQuantity > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-burgundy text-[11px] font-bold flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </span>
            Cart ({totalQuantity})
          </Link>

          {user && (
            <>
              {!isAdmin && (
                <>
                  <Link to="/orders" className="hover:text-burgundy transition-colors font-medium whitespace-nowrap">
                    My Orders
                  </Link>
                  <Link to="/favorites" className="hover:text-burgundy transition-colors font-medium whitespace-nowrap">
                    My Favorites
                  </Link>
                  <Link to="/rewards" className="hover:text-burgundy transition-colors font-medium whitespace-nowrap">
                    Rewards
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="hover:text-burgundy transition-colors font-medium">
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-4 ml-auto">
          {user && <NotificationBell onNavigate={closeMenu} />}
          <Link to="/cart" className="relative" onClick={closeMenu} aria-label="Cart">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {totalQuantity > 0 && (
              <span className="absolute -top-2 -right-3 min-w-5 h-5 px-1 rounded-full bg-burgundy text-cream text-xs flex items-center justify-center">
                {totalQuantity}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5"
          >
            <span className="block w-6 h-0.5 bg-charcoal" />
            <span className="block w-6 h-0.5 bg-charcoal" />
            <span className="block w-6 h-0.5 bg-charcoal" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-charcoal/10 bg-cream px-4 py-4 flex flex-col gap-4 text-[15px]">
          {searchBox("flex items-center gap-2 bg-white border border-charcoal/10 rounded-full px-4 py-2.5")}
          <Link to="/" onClick={closeMenu} className="text-burgundy font-semibold">
            Home
          </Link>
          <a href="#menu" onClick={goToSection("menu")}>
            Menu
          </a>
          <a href="#about" onClick={goToSection("about")}>
            About
          </a>
          <a href="#offers" onClick={goToSection("offers")}>
            Offers
          </a>
          <a href="#contact" onClick={goToSection("contact")}>
            Contact
          </a>
          {isAdmin && (
            <Link to="/admin/dashboard" onClick={closeMenu} className="font-medium">
              Dashboard
            </Link>
          )}
          {!user && (
            <>
              <Link to="/login" onClick={closeMenu}>
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="bg-charcoal text-cream px-5 py-2 rounded-full text-center"
              >
                Sign Up
              </Link>
            </>
          )}
          {user && (
            <>
              <span className="text-charcoal/60 text-sm">Hi, {user.name}</span>
              {!isAdmin && (
                <>
                  <Link to="/orders" onClick={closeMenu}>
                    My Orders
                  </Link>
                  <Link to="/favorites" onClick={closeMenu}>
                    My Favorites
                  </Link>
                  <Link to="/rewards" onClick={closeMenu}>
                    Rewards
                  </Link>
                  <Link to="/notifications" onClick={closeMenu}>
                    Notifications
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="text-left">
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;

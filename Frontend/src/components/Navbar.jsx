import { useEffect, useRef, useState } from "react";
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

function PinIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

const SOCIALS = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="4" y="4" width="16" height="16" rx="4.5" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17" cy="7" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://x.com",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 4h3l-6.6 7.6L21.5 20h-6.1l-4.8-6.2L4.9 20h-3l7.1-8.1L2.5 4H9l4.3 5.7L17.5 4zm-1.1 14.3h1.7L7.6 5.5H5.8l10.6 12.8z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="6" width="18" height="12" rx="3.5" />
        <path d="M10.5 9.8v4.4L14.5 12l-4-2.2z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalQuantity } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  // Pathname the profile menu was opened on — any route change
  // auto-invalidates it with no effect (and no cascading render).
  const [menuAnchor, setMenuAnchor] = useState(null);
  const userMenuOpen = menuAnchor !== null && menuAnchor === location.pathname;
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  // Which homepage section is currently in view (drives the underline
  // for Menu/About/Offers/Contact, which are in-page scrolls).
  const [activeSection, setActiveSection] = useState("home");
  const userMenuRef = useRef(null);

  const closeUserMenu = () => setMenuAnchor(null);
  const toggleUserMenu = () =>
    setMenuAnchor((a) => (a === location.pathname ? null : location.pathname));

  const handleLogout = () => {
    logout();
    setOpen(false);
    closeUserMenu();
    navigate("/");
  };

  const closeMenu = () => setOpen(false);

  // Sticky intensify: slightly stronger dark background/shadow on scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the profile dropdown on outside click / Escape.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeUserMenu();
    };
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        closeUserMenu();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [userMenuOpen]);

  // Keep the underline in sync with the visible homepage section.
  useEffect(() => {
    if (location.pathname !== "/") return;
    const ids = ["menu", "about", "offers", "contact"];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [location.pathname]);

  // Section links live on the homepage: scroll in place, or go home first.
  const goToSection = (id) => (e) => {
    e.preventDefault();
    closeMenu();
    closeUserMenu();
    setActiveSection(id);
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
    setMobileSearchOpen(false);
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
        className="w-[18px] h-[18px] text-cream/45 shrink-0"
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
        placeholder="Search for your favorite food..."
        aria-label="Search menu"
        className="bg-transparent outline-none text-[14.5px] w-full text-cream placeholder:text-cream/40 [&::-webkit-search-cancel-button]:invert"
      />
    </form>
  );

  const isHome = location.pathname === "/" && activeSection === "home";

  const navLink = (label, active, onClick, href = "#") => (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative pb-1.5 transition-colors whitespace-nowrap ${
        active ? "text-cream font-semibold" : "text-cream/70 hover:text-cream"
      }`}
    >
      {label}
      {active && (
        <span className="absolute left-0 right-0 -bottom-0.5 h-[2.5px] rounded-full bg-burgundy shadow-[0_0_12px_rgba(217,45,32,0.9)]" />
      )}
    </a>
  );

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  const dropdownItemClass =
    "flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-[14px] text-cream/80 transition-colors hover:bg-white/[0.06] hover:text-cream";

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled
          ? "shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)]"
          : "shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)]"
      }`}
    >
      {/* ── LEVEL 1 — top utility bar ─────────────────────────────── */}
      <div className="hidden md:block bg-[#0b0a09] border-b border-white/[0.06]">
        <div className="max-w-[1520px] mx-auto px-6 lg:px-12 h-[34px] flex items-center justify-between gap-4 text-[12px]">
          <div
            className="flex items-center gap-1.5 text-cream/60"
            aria-label="Delivery location: Kolkata, 700091"
            title="Delivery location: Kolkata, 700091"
          >
            <PinIcon className="w-3.5 h-3.5 text-cream/45" />
            <span className="text-cream/45">Deliver to</span>
            <span className="font-semibold text-cream/85">Kolkata, 700091</span>
            <svg className="w-3 h-3 text-cream/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
          <nav className="flex items-center gap-3 text-cream/55" aria-label="Utility">
            <a href="#contact" onClick={goToSection("contact")} className="hover:text-cream transition-colors">
              Help
            </a>
            <span className="text-cream/20" aria-hidden>|</span>
            <Link to="/orders" onClick={closeMenu} className="hover:text-cream transition-colors">
              Track Order
            </Link>
            <span className="text-cream/20" aria-hidden>|</span>
            <a href="#contact" onClick={goToSection("contact")} className="hover:text-cream transition-colors">
              Partner with us
            </a>
            <span className="hidden lg:flex items-center gap-1.5 ml-2 pl-3 border-l border-white/10">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-cream/45 hover:text-cream hover:bg-white/10 transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </span>
          </nav>
        </div>
      </div>

      {/* ── LEVEL 2 — main navbar ─────────────────────────────────── */}
      {/* NOTE: never add overflow-hidden here — the user + notification
          dropdowns are absolutely positioned descendants and must be
          allowed to escape this container. Decorative layers below are
          inset-0 so they need no clipping. */}
      <nav
        aria-label="Primary"
        className="relative overflow-visible border-b border-white/[0.07]"
        style={{
          backgroundColor: "#14120f",
          backgroundImage:
            "radial-gradient(900px 220px at 12% -40%, rgba(64,84,58,0.28), transparent 60%), radial-gradient(700px 200px at 88% -30%, rgba(217,45,32,0.10), transparent 60%), linear-gradient(180deg, rgba(255,249,241,0.03), rgba(0,0,0,0) 55%)",
        }}
      >
        {/* Very subtle dark food-inspired texture wash — decorative only,
            low opacity + dark overlay so text always stays readable. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(2px 2px at 8% 30%, rgba(214,178,110,0.35), transparent 70%), radial-gradient(3px 3px at 22% 70%, rgba(120,140,100,0.3), transparent 70%), radial-gradient(2px 2px at 45% 20%, rgba(214,178,110,0.28), transparent 70%), radial-gradient(3px 3px at 63% 65%, rgba(150,110,70,0.3), transparent 70%), radial-gradient(2px 2px at 78% 30%, rgba(120,140,100,0.28), transparent 70%), radial-gradient(3px 3px at 92% 60%, rgba(214,178,110,0.25), transparent 70%)",
            filter: "blur(1px)",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

        <div className="relative max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-12 h-[72px] flex items-center gap-4 lg:gap-7">
          {/* Brand lockup */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={closeMenu} aria-label="TastyBites home">
            <span className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-burgundy text-cream flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(217,45,32,0.8)]">
              <ChefHatIcon className="w-5 h-5 lg:w-6 lg:h-6" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[22px] lg:text-[26px] font-semibold tracking-tight text-cream">
                Tasty<span className="italic text-burgundy">Bites</span>
              </span>
              <span className="hidden sm:block text-[9px] tracking-[0.22em] text-cream/45 mt-1">
                GOOD FOOD, HAPPY PEOPLE
              </span>
            </span>
          </Link>

          {/* Center nav (desktop) */}
          <div className="hidden lg:flex items-center gap-7 text-[15.5px] shrink-0">
            <Link
              to="/"
              onClick={() => {
                closeMenu();
                setActiveSection("home");
              }}
              aria-current={isHome ? "page" : undefined}
              className={`relative pb-1.5 transition-colors whitespace-nowrap ${
                isHome ? "text-cream font-semibold" : "text-cream/70 hover:text-cream"
              }`}
            >
              Home
              {isHome && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-[2.5px] rounded-full bg-burgundy shadow-[0_0_12px_rgba(217,45,32,0.9)]" />
              )}
            </Link>
            {navLink("Menu", location.pathname === "/" && activeSection === "menu", goToSection("menu"))}
            {navLink("About", location.pathname === "/" && activeSection === "about", goToSection("about"))}
            {navLink("Offers", location.pathname === "/" && activeSection === "offers", goToSection("offers"))}
            {navLink("Contact", location.pathname === "/" && activeSection === "contact", goToSection("contact"))}
          </div>

          {/* Search (desktop / tablet) */}
          {searchBox("hidden md:flex flex-1 max-w-[300px] xl:max-w-[420px] mx-auto items-center gap-2.5 bg-white/[0.06] border border-white/10 rounded-full pl-5 pr-4 h-[44px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] focus-within:border-burgundy/60 focus-within:ring-2 focus-within:ring-burgundy/20 transition-all")}

          {/* Right cluster (tablet / desktop) */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0 ml-auto xl:ml-0">
            {isAdmin && (
              <Link to="/admin/dashboard" className="text-cream/75 hover:text-cream transition-colors font-medium text-[14.5px] whitespace-nowrap">
                Dashboard
              </Link>
            )}

            {!user ? (
              <>
                <Link to="/login" className="text-cream/80 hover:text-cream transition-colors font-medium text-[14.5px] whitespace-nowrap">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-burgundy text-white px-5 lg:px-6 py-2.5 rounded-full hover:bg-burgundy-dark transition-colors font-medium text-[14.5px] shadow-[0_8px_20px_-8px_rgba(217,45,32,0.7)]"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={toggleUserMenu}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className={`flex items-center gap-2.5 rounded-full pl-1.5 pr-2.5 py-1.5 transition-colors ${
                    userMenuOpen ? "bg-white/10" : "hover:bg-white/[0.07]"
                  }`}
                >
                  <span className="w-9 h-9 rounded-full bg-burgundy text-cream flex items-center justify-center font-semibold text-[15px] shadow-[0_6px_16px_-6px_rgba(217,45,32,0.8)]">
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </span>
                  <span className="leading-tight hidden lg:block text-left">
                    <span className="block text-[13.5px] font-semibold text-cream whitespace-nowrap">
                      Hi, {firstName}
                    </span>
                  </span>
                  <svg
                    className={`w-4 h-4 text-cream/50 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2.5 w-60 rounded-2xl border border-white/10 bg-[#1d1b17]/95 backdrop-blur-md shadow-[0_25px_50px_-20px_rgba(0,0,0,0.8)] p-2 z-[70]"
                  >
                    {isAdmin ? (
                      <Link
                        to="/admin/dashboard"
                        role="menuitem"
                        onClick={closeUserMenu}
                        className={dropdownItemClass}
                      >
                        Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link to="/orders" role="menuitem" onClick={closeUserMenu} className={dropdownItemClass}>
                          My Orders
                        </Link>
                        <Link to="/favorites" role="menuitem" onClick={closeUserMenu} className={dropdownItemClass}>
                          My Favorites
                        </Link>
                        <Link to="/rewards" role="menuitem" onClick={closeUserMenu} className={dropdownItemClass}>
                          Rewards
                        </Link>
                        <Link to="/book-table" role="menuitem" onClick={closeUserMenu} className={dropdownItemClass}>
                          Book a Table
                        </Link>
                        <Link to="/reservations" role="menuitem" onClick={closeUserMenu} className={dropdownItemClass}>
                          My Reservations
                        </Link>
                      </>
                    )}
                    <div className="my-2 h-px bg-white/10" />
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-[14px] font-medium text-red-400 transition-colors hover:bg-burgundy/15 hover:text-red-300"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {user && (
              <span className="[&_button]:text-cream/85 [&_button]:hover:bg-white/10 [&_button]:hover:text-cream">
                <NotificationBell />
              </span>
            )}

            <Link
              to="/cart"
              className="flex items-center gap-2 bg-burgundy text-white rounded-full pl-4 pr-5 h-[44px] text-[14.5px] font-semibold hover:bg-burgundy-dark transition-colors shadow-[0_8px_20px_-8px_rgba(217,45,32,0.7)]"
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
          </div>

          {/* Mobile cluster */}
          <div className="flex md:hidden items-center gap-1.5 ml-auto">
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Toggle search"
              aria-expanded={mobileSearchOpen}
              className="w-10 h-10 rounded-full flex items-center justify-center text-cream/85 hover:bg-white/10 transition-colors"
            >
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
              </svg>
            </button>
            {user && (
              <span className="[&_button]:text-cream/85 [&_button]:hover:bg-white/10 [&_button]:hover:text-cream">
                <NotificationBell onNavigate={closeMenu} />
              </span>
            )}
            <Link to="/cart" className="relative w-10 h-10 rounded-full flex items-center justify-center text-cream/85 hover:bg-white/10 transition-colors" onClick={closeMenu} aria-label="Cart">
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {totalQuantity > 0 && (
                <span className="absolute top-0.5 right-0 min-w-5 h-5 px-1 rounded-full bg-burgundy text-white text-xs font-bold flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <span className="block w-5 h-0.5 bg-cream rounded-full" />
              <span className="block w-5 h-0.5 bg-cream rounded-full" />
              <span className="block w-5 h-0.5 bg-cream rounded-full" />
            </button>
          </div>
        </div>

        {/* Mobile expanding search row */}
        {mobileSearchOpen && (
          <div className="relative md:hidden px-4 pb-3">
            {searchBox("flex items-center gap-2.5 bg-white/[0.06] border border-white/10 rounded-full px-4 h-[44px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] focus-within:border-burgundy/60 transition-all")}
          </div>
        )}
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#14120f]/98 backdrop-blur-md px-5 py-5 flex flex-col gap-1 text-[15px] max-h-[calc(100dvh-72px)] overflow-y-auto">
          <Link
            to="/"
            onClick={() => {
              closeMenu();
              setActiveSection("home");
            }}
            className={`rounded-xl px-3 py-2.5 transition-colors ${isHome ? "text-cream font-semibold bg-white/[0.06]" : "text-cream/75 hover:text-cream hover:bg-white/[0.05]"}`}
          >
            Home
          </Link>
          <a href="#menu" onClick={goToSection("menu")} className="rounded-xl px-3 py-2.5 text-cream/75 hover:text-cream hover:bg-white/[0.05] transition-colors">
            Menu
          </a>
          <a href="#about" onClick={goToSection("about")} className="rounded-xl px-3 py-2.5 text-cream/75 hover:text-cream hover:bg-white/[0.05] transition-colors">
            About
          </a>
          <a href="#offers" onClick={goToSection("offers")} className="rounded-xl px-3 py-2.5 text-cream/75 hover:text-cream hover:bg-white/[0.05] transition-colors">
            Offers
          </a>
          <a href="#contact" onClick={goToSection("contact")} className="rounded-xl px-3 py-2.5 text-cream/75 hover:text-cream hover:bg-white/[0.05] transition-colors">
            Contact
          </a>
          {isAdmin && (
            <Link to="/admin/dashboard" onClick={closeMenu} className="rounded-xl px-3 py-2.5 font-medium text-cream/85 hover:bg-white/[0.05] transition-colors">
              Dashboard
            </Link>
          )}
          <div className="my-2 h-px bg-white/10" />
          {!user && (
            <>
              <Link to="/login" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-cream/85 hover:bg-white/[0.05] transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="mt-1 bg-burgundy text-white px-5 py-2.5 rounded-full text-center font-semibold hover:bg-burgundy-dark transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
          {user && (
            <>
              <span className="px-3 py-1 text-cream/50 text-sm">Hi, {user.name}</span>
              {!isAdmin && (
                <>
                  <Link to="/orders" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/[0.05] transition-colors">
                    My Orders
                  </Link>
                  <Link to="/favorites" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/[0.05] transition-colors">
                    My Favorites
                  </Link>
                  <Link to="/rewards" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/[0.05] transition-colors">
                    Rewards
                  </Link>
                  <Link to="/book-table" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/[0.05] transition-colors">
                    Book a Table
                  </Link>
                  <Link to="/reservations" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/[0.05] transition-colors">
                    My Reservations
                  </Link>
                  <Link to="/notifications" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/[0.05] transition-colors">
                    Notifications
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="rounded-xl px-3 py-2.5 text-left font-medium text-red-400 hover:bg-burgundy/15 hover:text-red-300 transition-colors">
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;

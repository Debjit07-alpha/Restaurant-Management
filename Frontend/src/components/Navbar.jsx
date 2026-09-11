import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalQuantity } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const closeMenu = () => setOpen(false);

  const scrollToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  // From any page: go home first, then scroll to the menu section.
  const goToMenu = (e) => {
    e.preventDefault();
    closeMenu();
    if (location.pathname === "/") {
      scrollToMenu();
    } else {
      navigate("/");
      setTimeout(scrollToMenu, 150);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-charcoal/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="font-display text-2xl tracking-tight" onClick={closeMenu}>
          Tasty<span className="italic text-burgundy">Bites</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7 text-[15px]">
          <a href="#menu" onClick={goToMenu} className="hover:text-burgundy transition-colors">
            Menu
          </a>
          <Link
            to="/cart"
            className="relative hover:text-burgundy transition-colors"
          >
            Cart
            {totalQuantity > 0 && (
              <span className="absolute -top-2 -right-5 min-w-5 h-5 px-1 rounded-full bg-burgundy text-cream text-xs flex items-center justify-center">
                {totalQuantity}
              </span>
            )}
          </Link>

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="hover:text-burgundy transition-colors font-medium"
            >
              Dashboard
            </Link>
          )}

          {!user && (
            <>
              <Link to="/login" className="hover:text-burgundy transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-charcoal text-cream px-5 py-2 rounded-full hover:bg-burgundy transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}

          {user && (
            <>
              <span className="text-charcoal/60">Hi, {user.name}</span>
              {!isAdmin && (
                <Link to="/orders" className="hover:text-burgundy transition-colors">
                  My Orders
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="hover:text-burgundy transition-colors"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-4">
          <Link to="/cart" className="relative text-[15px]" onClick={closeMenu}>
            Cart
            {totalQuantity > 0 && (
              <span className="absolute -top-2 -right-4 min-w-5 h-5 px-1 rounded-full bg-burgundy text-cream text-xs flex items-center justify-center">
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

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-charcoal/10 bg-cream px-4 py-4 flex flex-col gap-4 text-[15px]">
          <a href="#menu" onClick={goToMenu} className="hover:text-burgundy">
            Menu
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
              <span className="text-charcoal/60">Hi, {user.name}</span>
              {!isAdmin && (
                <Link to="/orders" onClick={closeMenu}>
                  My Orders
                </Link>
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

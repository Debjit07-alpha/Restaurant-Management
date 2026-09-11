import { Link } from "react-router-dom";
import { scrollToId } from "../../utils/scroll";

function SiteFooter() {
  return (
    <footer id="contact" className="bg-charcoal text-cream scroll-mt-20">
      <div className="max-w-[1520px] mx-auto px-6 lg:px-12 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl">
            Tasty<span className="italic text-cream/70">Bites</span>
          </p>
          <p className="mt-4 text-sm text-cream/60 leading-relaxed">
            Fresh food. Great moments.
          </p>
          <p className="mt-2 text-sm text-cream/60 leading-relaxed max-w-xs">
            A small kitchen with a carefully prepared menu. Fresh ingredients,
            honest food, and great taste.
          </p>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cream/50">
            Quick Links
          </p>
          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            <Link to="/" className="text-cream/70 hover:text-cream w-fit transition-colors">
              Home
            </Link>
            <a
              href="#menu"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("menu");
              }}
              className="text-cream/70 hover:text-cream w-fit transition-colors"
            >
              Menu
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("about");
              }}
              className="text-cream/70 hover:text-cream w-fit transition-colors"
            >
              About
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("contact");
              }}
              className="text-cream/70 hover:text-cream w-fit transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cream/50">
            Customer
          </p>
          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            <Link to="/orders" className="text-cream/70 hover:text-cream w-fit transition-colors">
              My Orders
            </Link>
            <Link to="/cart" className="text-cream/70 hover:text-cream w-fit transition-colors">
              Cart
            </Link>
            <Link to="/login" className="text-cream/70 hover:text-cream w-fit transition-colors">
              Account
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cream/50">
            Contact
          </p>
          <p className="mt-4 text-sm text-cream/70 leading-relaxed">
            Questions about your order? Log in and visit My Orders to track
            your meals.
          </p>
          <p className="mt-2 text-sm text-cream/70">All prices in INR.</p>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="max-w-[1520px] mx-auto px-6 lg:px-12 py-5 text-center text-xs text-cream/50">
          <p>© 2026 TastyBites. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

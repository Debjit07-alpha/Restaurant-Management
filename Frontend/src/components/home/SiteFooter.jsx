import { Link } from "react-router-dom";
import { scrollToId } from "../../utils/scroll";

function SiteFooter() {
  return (
    <footer id="contact" className="bg-pine text-cream scroll-mt-20">
      <div className="max-w-[1520px] mx-auto px-6 lg:px-12 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-[26px] font-semibold">
            Tasty<span className="italic text-cream/70">Bites</span>
          </p>
          <p className="mt-1 text-[11px] tracking-[0.28em] text-cream/50">
            GOOD FOOD, HAPPY PEOPLE
          </p>
          <p className="mt-4 text-sm text-cream/65 leading-relaxed max-w-xs">
            Delicious food for a happier you. Made with love, served with a
            smile.
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
              About Us
            </a>
            <a
              href="#offers"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("offers");
              }}
              className="text-cream/70 hover:text-cream w-fit transition-colors"
            >
              Offers
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
            Help & Support
          </p>
          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            <Link to="/orders" className="text-cream/70 hover:text-cream w-fit transition-colors">
              Track Order
            </Link>
            <Link to="/cart" className="text-cream/70 hover:text-cream w-fit transition-colors">
              My Cart
            </Link>
            <Link to="/login" className="text-cream/70 hover:text-cream w-fit transition-colors">
              Account
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cream/50">
            Contact Us
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

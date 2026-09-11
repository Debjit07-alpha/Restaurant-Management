import { useState } from "react";
import { Link } from "react-router-dom";
import { scrollToId } from "../../utils/scroll";

const SOCIALS = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
      <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 4h3l-6.6 7.6L21.5 20h-6.1l-4.8-6.2L4.9 20h-3l7.1-8.1L2.5 4H9l4.3 5.7L17.5 4zm-1.1 14.3h1.7L7.6 5.5H5.8l10.6 12.8z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="6" width="18" height="12" rx="3.5" />
        <path d="M10.5 9.8v4.4L14.5 12l-4-2.2z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Front-end only confirmation. There is no newsletter backend yet —
    // wire this form to a mailing-list API when one exists.
    setSubscribed(true);
  };

  return (
    <footer id="contact" className="bg-pine text-cream scroll-mt-20">
      <div className="max-w-[1520px] mx-auto px-6 lg:px-12 pt-14 pb-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div id="about" className="scroll-mt-24">
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
          <div className="mt-5 flex gap-2.5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-full border border-cream/25 flex items-center justify-center text-cream/75 hover:bg-cream hover:text-pine transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
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
          {/* Placeholder business details — replace with the real
              restaurant phone, email and address before going live. */}
          <div className="mt-4 space-y-2.5 text-sm text-cream/70">
            <p>+91 98765 43210</p>
            <p>hello@tastybites.in</p>
            <p>Kolkata, West Bengal, India</p>
          </div>
          <p className="mt-6 text-sm font-semibold">Subscribe for Updates</p>
          {subscribed ? (
            <p className="mt-2.5 text-sm text-cream/80">
              You&apos;re on the list. Welcome!
            </p>
          ) : (
            <form onSubmit={subscribe} className="mt-2.5 flex items-center gap-2 max-w-xs">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                className="bg-transparent border border-cream/25 rounded-full px-4 py-2.5 text-sm w-full placeholder:text-cream/40 outline-none focus:border-cream/60"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="shrink-0 w-11 h-11 rounded-full bg-burgundy text-white flex items-center justify-center hover:bg-burgundy-dark transition-colors"
              >
                →
              </button>
            </form>
          )}
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

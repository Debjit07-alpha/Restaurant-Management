import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuImage from "../MenuImage";
import { formatPrice } from "../../utils/formatPrice";
import { scrollToId } from "../../utils/scroll";

const trustItems = [
  {
    title: "Fresh Ingredients",
    sub: "Locally sourced",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.5-2.5-7-6-7-11 4.5 0 8 1.5 10.5 4C18 11.5 19.5 9 20 6c-1 5-3.5 11-8 15zm0 0c0-4 1-7 3-9" />
      </svg>
    ),
  },
  {
    title: "Expertly Cooked",
    sub: "With love",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 13.5A3.5 3.5 0 017.5 6.6a5 5 0 019.74 1.42A3.75 3.75 0 0117.5 15H7m0 0V6.75M7 13.5h10.5M7 16.5h10.5" />
      </svg>
    ),
  },
  {
    title: "Great Taste",
    sub: "Every time",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5C7 16.5 3.5 13.3 3.5 9.5A4.5 4.5 0 018 5c1.6 0 3.1.8 4 2.1A4.5 4.5 0 0116 5a4.5 4.5 0 014.5 4.5c0 3.8-3.5 7-8.5 11z" />
      </svg>
    ),
  },
];

const avatarColors = ["bg-burgundy", "bg-pine", "bg-brand-dark", "bg-charcoal"];
const avatarInitials = ["A", "R", "S", "P"];

function Leaf({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <path
        d="M20 35C11 29 7 20 8 8c9 1 17 6 20 15 2-4 2-9 1-15 4 6 5 15 1 24-2 2-5 3-10 3z"
        fill="currentColor"
      />
      <path d="M12 32C16 24 22 18 30 14" stroke="#fff9f1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Hero({ items }) {
  const navigate = useNavigate();
  const gallery = items.filter((item) => item.image).slice(0, 5);
  const count = gallery.length;
  const [index, setIndex] = useState(0);
  const [heroQuery, setHeroQuery] = useState("");
  const current = count === 0 ? 0 : index % count;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => clearInterval(timer);
  }, [count]);

  const featured = gallery[current] || null;

  const submitHeroSearch = (e) => {
    e.preventDefault();
    const q = heroQuery.trim();
    navigate(q ? `/?search=${encodeURIComponent(q)}` : "/", { replace: true });
    setTimeout(() => scrollToId("menu"), 100);
  };

  return (
    <section className="relative overflow-hidden">
      <Leaf className="hidden lg:block absolute top-20 left-2 w-14 h-14 text-pine opacity-25 rotate-[24deg] pointer-events-none" />
      <Leaf className="hidden lg:block absolute bottom-24 left-6 w-20 h-20 text-pine opacity-15 -rotate-[30deg] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 grid gap-10 lg:grid-cols-[42fr_58fr] lg:gap-6 items-center py-8 lg:py-10 animate-fade-in">
        {/* ============ LEFT CONTENT (single aligned column) ============ */}
        <div>
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white border border-charcoal/10 px-4 py-1.5 text-[13px] font-medium text-charcoal/70 shadow-sm">
            Fresh Ingredients&nbsp;&nbsp;•&nbsp;&nbsp;Great Taste&nbsp;&nbsp;•&nbsp;&nbsp;Faster Delivery
          </p>
          <h1 className="font-display font-semibold text-[56px] sm:text-[72px] xl:text-[84px] leading-[1.03] mt-6 text-charcoal">
            Good Food.
            <br />
            <span className="italic font-medium text-burgundy">Happy People.</span>
          </h1>
          <p className="mt-6 text-[16px] text-cocoa leading-[1.75] max-w-[520px]">
            Delicious meals, made with love and the freshest ingredients.
            Order your favorite food and enjoy great taste at your doorstep.
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <button
              onClick={() => scrollToId("menu")}
              className="min-w-[190px] h-[54px] rounded-[28px] bg-burgundy text-white text-[16px] font-semibold hover:bg-burgundy-dark transition-all hover:-translate-y-0.5 shadow-[0_10px_25px_-10px_rgba(217,45,32,0.6)] px-8"
            >
              Order Now&nbsp;&nbsp;→
            </button>
            <button
              onClick={() => scrollToId("menu")}
              className="min-w-[190px] h-[54px] rounded-[28px] bg-white/85 border border-charcoal/15 text-charcoal text-[16px] font-semibold hover:border-burgundy hover:text-burgundy transition-all hover:-translate-y-0.5 px-8 shadow-sm"
            >
              Explore Menu
            </button>
          </div>

          <div className="mt-7 flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {avatarInitials.map((initial, i) => (
                <span
                  key={initial}
                  className={`w-10 h-10 rounded-full ${avatarColors[i]} text-white text-sm font-semibold flex items-center justify-center ring-[2.5px] ring-cream`}
                >
                  {initial}
                </span>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold">10K+ Happy Customers</p>
              <p className="text-sm text-charcoal/60 flex items-center gap-1.5 mt-0.5">
                <svg className="w-4 h-4 text-brand" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                </svg>
                <span className="font-bold text-charcoal">4.8</span> (2.5K reviews)
              </p>
            </div>
          </div>

          <div className="mt-7 flex items-stretch max-w-[520px]">
            {trustItems.map((t, i) => (
              <div
                key={t.title}
                className={`flex items-center gap-3 pr-5 ${
                  i < trustItems.length - 1 ? "mr-5 border-r border-charcoal/10" : ""
                }`}
              >
                <span className="text-pine shrink-0">{t.icon}</span>
                <span>
                  <span className="block text-[13px] sm:text-[14px] font-semibold leading-tight">
                    {t.title}
                  </span>
                  <span className="block text-xs sm:text-[13px] text-cocoa mt-0.5">
                    {t.sub}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ============ RIGHT VISUAL (owns all floating elements) ============ */}
        <div className="relative h-[440px] sm:h-[520px] lg:h-[620px] lg:-mr-10 min-[1520px]:-mr-[calc((100vw-1440px)/2+40px)]">
          {featured ? (
            <>
              {/* photograph with a broad feathered melt into cream */}
              <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_50%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_50%)] max-lg:[mask-image:linear-gradient(to_bottom,transparent_0%,black_26%)] max-lg:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_26%)]">
                <MenuImage
                  key={featured._id}
                  src={featured.image}
                  alt={featured.name}
                  className="h-full w-full object-cover animate-fade-in"
                />
              </div>
              {/* cream melt along the left edge (desktop) / top edge (mobile) */}
              <div className="absolute inset-y-0 left-0 w-3/5 max-lg:hidden bg-gradient-to-r from-cream via-cream/60 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-28 lg:hidden bg-gradient-to-b from-cream via-cream/50 to-transparent pointer-events-none" />
              {/* cream melt along the bottom edge */}
              <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-cream via-cream/45 to-transparent pointer-events-none" />
              {/* faint steam over the food */}
              <svg
                className="absolute right-[34%] top-[14%] w-14 h-24 text-white/50 pointer-events-none"
                viewBox="0 0 40 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.7"
              >
                <path d="M14 95 C 8 75, 20 65, 14 45 C 8 25, 20 18, 14 4" />
                <path d="M28 95 C 22 75, 34 65, 28 45 C 22 25, 34 18, 28 4" opacity="0.6" />
              </svg>

              {/* mood badge, upper right of the visual */}
              <div className="absolute top-5 right-5 sm:right-8">
                <span className="absolute -top-2 -left-3 text-burgundy text-lg font-bold select-none">+</span>
                <span className="absolute top-1/2 -right-3 text-burgundy text-sm font-bold select-none">•</span>
                <span className="absolute -bottom-2 left-8 text-burgundy text-lg font-bold select-none">+</span>
                <div className="w-[124px] h-[124px] rounded-full bg-pine text-cream flex flex-col items-center justify-center text-center shadow-[0_18px_35px_-12px_rgba(23,61,45,0.65)] rotate-[7deg] ring-4 ring-cream">
                  <span className="font-display italic text-[17px] leading-[1.3] px-2">
                    Good
                    <br />
                    Food
                    <br />
                    Brighter
                    <br />
                    Mood
                  </span>
                </div>
              </div>

              {/* handwritten tagline in the transition zone */}
              <div className="absolute left-1 sm:left-4 bottom-[210px] sm:bottom-[220px] -rotate-3">
                <p className="font-display italic font-semibold text-charcoal text-[22px] leading-[1.35] drop-shadow-[0_2px_8px_rgba(255,249,241,0.95)]">
                  Food
                  <br />
                  Brings
                  <br />
                  People
                  <br />
                  Together{" "}
                  <svg className="inline w-[18px] h-[18px] text-burgundy -mt-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20.5C7 16.5 3.5 13.3 3.5 9.5A4.5 4.5 0 018 5c1.6 0 3.1.8 4 2.1A4.5 4.5 0 0116 5a4.5 4.5 0 014.5 4.5c0 3.8-3.5 7-8.5 11z" />
                  </svg>
                </p>
                <svg
                  className="w-24 h-[70px] text-burgundy/80 mt-1 ml-12"
                  viewBox="0 0 110 80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M8 10 C 45 12, 75 25, 88 62" strokeDasharray="1 7" />
                  <path d="M78 52 L88 62 L74 68" />
                </svg>
              </div>

              {/* dish label, lower-left of the food */}
              <span className="absolute bottom-[104px] left-4 sm:left-6 flex items-center justify-between gap-5 rounded-2xl bg-cream/95 pl-5 pr-4 py-3 shadow-md z-10 max-w-[calc(100%-2rem)]">
                <span className="truncate font-semibold text-[16px]">{featured.name}</span>
                <span className="font-display text-burgundy whitespace-nowrap text-lg">
                  {formatPrice(featured.price)}
                </span>
              </span>

              {/* delivery bar across the lower food area */}
              <form
                onSubmit={submitHeroSearch}
                role="search"
                className="absolute bottom-2 left-2 right-2 sm:left-6 sm:right-6 flex items-center gap-3 bg-white rounded-[20px] pl-4 pr-2 py-2 shadow-[0_20px_45px_-18px_rgba(23,23,23,0.4)] border border-charcoal/10 z-10"
              >
                <svg className="w-6 h-6 text-burgundy shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.14-7.5 11.25-7.5 11.25S4.5 17.64 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="flex-1 min-w-0 text-left">
                  <span className="block text-[13px] font-bold leading-tight">Deliver to</span>
                  <input
                    type="search"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Enter your location"
                    aria-label="Enter your location or a dish"
                    className="bg-transparent outline-none text-sm w-full placeholder:text-charcoal/40 truncate"
                  />
                </span>
                <button
                  type="submit"
                  className="shrink-0 bg-burgundy text-white text-[15px] font-semibold rounded-2xl px-6 sm:px-7 py-3.5 hover:bg-burgundy-dark transition-colors"
                >
                  Find Food
                </button>
              </form>
            </>
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display italic text-charcoal/30 text-3xl">
              TastyBites
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;

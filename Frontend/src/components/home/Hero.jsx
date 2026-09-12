import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuImage from "../MenuImage";
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

// Layers: content (z-30) > decoration overlay (z-20, pointer-events none
// except interactive children) > photo (unmasked parent, mask ONLY on
// the <img> via .hero-food-img). No cream wash anywhere.
function Hero({ items }) {
  const navigate = useNavigate();
  // Hero curation: prefer a Main Course dish (biryani-style mains carry
  // the reference look); fall back to any item with an image. Real data
  // only — this only changes display order, never the dishes themselves.
  const CATEGORY_ORDER = { "Main Course": 0, Starter: 1, Beverage: 2, Dessert: 3 };
  const gallery = items
    .filter((item) => item.image)
    .sort(
      (a, b) =>
        (CATEGORY_ORDER[a.category] ?? 4) - (CATEGORY_ORDER[b.category] ?? 4)
    )
    .slice(0, 5);
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
      <div className="relative max-w-[1500px] mx-auto px-6 lg:px-10 min-h-[560px] lg:min-h-[650px] py-12 lg:py-0 lg:flex lg:items-center animate-fade-in">
        {/* ============ LEFT CONTENT ============ */}
        <div className="relative z-30 w-full lg:w-[48%] lg:max-w-[700px] lg:pt-9 lg:pb-16">
          <div
            aria-hidden="true"
            className="absolute -inset-x-8 -inset-y-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgba(217,45,32,0.07),rgba(224,123,0,0.05)_55%,transparent_75%)] pointer-events-none"
          />
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white border border-charcoal/10 px-4 py-1.5 text-[13px] font-medium text-charcoal/70 shadow-sm">
            <svg className="w-4 h-4 text-pine" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.5-2.5-7-6-7-11 4.5 0 8 1.5 10.5 4C18 11.5 19.5 9 20 6c-1 5-3.5 11-8 15zm0 0c0-4 1-7 3-9" />
            </svg>
            Fresh Ingredients&nbsp;&nbsp;•&nbsp;&nbsp;Great Taste&nbsp;&nbsp;•&nbsp;&nbsp;Faster Delivery
          </p>
          <h1 className="font-display font-bold text-[62px] sm:text-[80px] xl:text-[92px] leading-[1.04] mt-6 text-charcoal">
            Good Food.
            <br />
            <span className="italic font-medium text-burgundy">Happy People.</span>
          </h1>
          <p className="mt-6 text-[16px] text-cocoa leading-[1.75] max-w-[520px]">
            Delicious meals, made with love and the freshest ingredients.
            Order your favorite food and enjoy great taste at your doorstep.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
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

          <div className="mt-8 flex items-center gap-4">
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
              <p className="text-sm text-charcoal/60 flex items-center gap-1.5 mt-1">
                <span className="flex gap-0.5" aria-label="Rated 4.8 out of 5 stars">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} className="w-4 h-4 text-brand" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                    </svg>
                  ))}
                </span>
                <span className="font-bold text-charcoal">4.8</span> (2.5K reviews)
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-stretch max-w-[520px]">
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

        {/* ============ RIGHT VISUAL (opaque; only the <img> is masked) ============ */}
        <div className="relative h-[480px] sm:h-[540px] mt-10 lg:mt-0 lg:absolute lg:inset-y-0 lg:left-[38%] lg:right-[-80px] lg:h-auto">
          {featured ? (
            <>
              <div className="absolute inset-0 overflow-hidden z-[1] hero-food-frame">
                <MenuImage
                  key={featured._id}
                  src={featured.image}
                  alt={featured.name}
                  className="hero-food-img h-full w-full object-cover object-[68%_center] scale-[0.88] origin-right animate-fade-in"
                />
              </div>
              {/* faint steam over the food */}
              <svg
                className="absolute right-[26%] top-[10%] w-14 h-24 text-white/50 pointer-events-none"
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

              {/* decoration overlay: fully opaque, never masked */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="absolute top-[calc(7%+20px)] right-[calc(6%+60px)]">
                  <span className="absolute top-6 -right-2.5 flex flex-col gap-2" aria-hidden="true">
                    <span className="block w-7 h-1.5 rounded-full bg-burgundy rotate-[24deg]" />
                    <span className="block w-7 h-1.5 rounded-full bg-burgundy rotate-[24deg]" />
                    <span className="block w-7 h-1.5 rounded-full bg-burgundy rotate-[24deg]" />
                  </span>
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

                <div className="absolute left-[10%] top-[25%] z-10 -rotate-3">
                  <p className="font-display italic font-semibold text-charcoal text-[23px] leading-[1.35] drop-shadow-[0_2px_8px_rgba(255,249,241,0.95)]">
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

                <form
                  onSubmit={submitHeroSearch}
                  role="search"
                  className="absolute bottom-[8%] left-[9%] right-[4%] sm:left-auto sm:right-[calc(5%+130px)] sm:w-[460px] flex items-center gap-3 bg-white rounded-[20px] pl-4 pr-2 py-2 shadow-[0_20px_45px_-18px_rgba(23,23,23,0.4)] border border-charcoal/10 pointer-events-auto"
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
                  <svg className="w-5 h-5 text-burgundy shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                  <button
                    type="submit"
                    className="shrink-0 bg-burgundy text-white text-[15px] font-semibold rounded-2xl px-6 sm:px-7 py-3.5 hover:bg-burgundy-dark transition-colors flex items-center gap-2"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                    </svg>
                    Find Food
                  </button>
                </form>
              </div>
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

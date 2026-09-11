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
      {/* edge decorations */}
      <Leaf className="hidden lg:block absolute top-20 -left-4 w-14 h-14 text-pine opacity-25 rotate-[24deg]" />
      <Leaf className="hidden lg:block absolute bottom-32 -left-6 w-20 h-20 text-pine opacity-15 -rotate-[30deg]" />
      <Leaf className="hidden lg:block absolute top-28 -right-5 w-16 h-16 text-pine opacity-20 rotate-[140deg]" />
      <div className="hidden lg:block absolute top-44 right-[42%] w-24 h-24 rounded-full bg-brand/10" />
      <div className="hidden lg:block absolute bottom-16 left-[43%] w-10 h-10 rounded-full bg-burgundy/10" />

      <div className="max-w-[1520px] mx-auto px-6 lg:px-12 grid gap-14 lg:grid-cols-[45fr_55fr] lg:gap-16 items-center min-h-[540px] py-14 lg:py-20 animate-fade-in">
        {/* Left copy */}
        <div className="flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white border border-charcoal/10 px-4 py-1.5 text-[13px] font-medium text-charcoal/70 shadow-sm">
            Fresh Ingredients&nbsp;&nbsp;•&nbsp;&nbsp;Great Taste&nbsp;&nbsp;•&nbsp;&nbsp;Faster Delivery
          </p>
          <h1 className="font-display font-semibold text-[60px] sm:text-[76px] leading-[1.05] mt-6 text-charcoal">
            Good Food.
            <br />
            <span className="italic font-medium text-burgundy">Happy People.</span>
          </h1>
          <p className="mt-6 text-[16px] sm:text-[17px] text-cocoa leading-[1.75] max-w-[440px]">
            Delicious meals, made with love and the freshest ingredients.
            Order your favorite food and enjoy great taste at your doorstep.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <button
              onClick={() => scrollToId("menu")}
              className="min-w-[200px] h-[54px] rounded-[28px] bg-burgundy text-white text-[16px] font-semibold hover:bg-burgundy-dark transition-all hover:-translate-y-0.5 shadow-[0_10px_25px_-10px_rgba(217,45,32,0.6)] px-8"
            >
              Order Now&nbsp;&nbsp;→
            </button>
            <button
              onClick={() => scrollToId("menu")}
              className="min-w-[200px] h-[54px] rounded-[28px] bg-white border border-charcoal/15 text-charcoal text-[16px] font-semibold hover:border-burgundy hover:text-burgundy transition-all hover:-translate-y-0.5 px-8 shadow-sm"
            >
              Explore Menu
            </button>
          </div>

          {/* Social proof */}
          <div className="mt-9 flex items-center gap-4">
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

          {/* Trust features */}
          <div className="mt-9 flex items-stretch max-w-[540px]">
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

        {/* Right visual */}
        <div className="relative pb-10">
          <div className="relative h-[360px] sm:h-[440px] overflow-hidden bg-cream-dark shadow-[0_25px_50px_-20px_rgba(23,23,23,0.35)] rounded-[26px]">
            {featured ? (
              <>
                <MenuImage
                  key={featured._id}
                  src={featured.image}
                  alt={featured.name}
                  className="h-full w-full object-cover animate-fade-in"
                />
                <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl bg-cream/95 pl-5 pr-4 py-3 shadow-md">
                  <span className="truncate font-semibold text-[17px]">{featured.name}</span>
                  <span className="font-display text-burgundy whitespace-nowrap text-xl">
                    {formatPrice(featured.price)}
                  </span>
                </span>
              </>
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display italic text-charcoal/30 text-3xl">
                TastyBites
              </span>
            )}
          </div>

          {/* Dark-green badge, upper right */}
          <div className="absolute -top-7 right-8 sm:right-12 w-[118px] h-[118px] rounded-full bg-pine text-cream flex flex-col items-center justify-center text-center shadow-[0_15px_30px_-10px_rgba(23,61,45,0.6)] rotate-[7deg] ring-4 ring-cream">
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

          {/* Handwritten note */}
          <p className="hidden md:block absolute top-[46%] -left-3 font-display italic text-cocoa/85 text-[21px] leading-[1.4] -rotate-3">
            Food
            <br />
            Brings
            <br />
            People
            <br />
            Together{" "}
            <svg className="inline w-4 h-4 text-burgundy -mt-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 20.5C7 16.5 3.5 13.3 3.5 9.5A4.5 4.5 0 018 5c1.6 0 3.1.8 4 2.1A4.5 4.5 0 0116 5a4.5 4.5 0 014.5 4.5c0 3.8-3.5 7-8.5 11z" />
            </svg>
          </p>

          {/* Location / order bar overlapping bottom */}
          <form
            onSubmit={submitHeroSearch}
            role="search"
            className="absolute -bottom-2 sm:bottom-0 right-4 sm:right-8 left-4 sm:left-auto sm:w-[430px] flex items-center gap-3 bg-white rounded-[20px] pl-4 pr-2 py-2 shadow-[0_20px_45px_-18px_rgba(23,23,23,0.4)] border border-charcoal/10"
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
              className="shrink-0 bg-burgundy text-white text-[15px] font-semibold rounded-2xl px-7 py-3.5 hover:bg-burgundy-dark transition-colors"
            >
              Find Food
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Hero;

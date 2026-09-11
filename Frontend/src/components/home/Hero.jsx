import { useEffect, useState } from "react";
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

function Leaf({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <path
        d="M20 35C11 29 7 20 8 8c9 1 17 6 20 15 2-4 2-9 1-15 4 6 5 15 1 24-2 2-5 3-10 3z"
        fill="currentColor"
      />
      <path d="M12 32C16 24 22 18 30 14" stroke="#faf7f0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Hero({ items }) {
  const gallery = items.filter((item) => item.image).slice(0, 5);
  const count = gallery.length;
  const [index, setIndex] = useState(0);
  const current = count === 0 ? 0 : index % count;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => clearInterval(timer);
  }, [count]);

  const featured = gallery[current] || null;
  const small =
    count > 1
      ? [gallery[(current + 1) % count], gallery[(current + 2) % count]].filter(Boolean)
      : [];

  const overlay = (item, large) => (
    <span
      className={`absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl bg-cream/95 pl-5 pr-4 shadow-md ${
        large ? "py-3" : "py-2.5"
      }`}
    >
      <span className={`truncate font-semibold ${large ? "text-[17px]" : "text-[15px]"}`}>
        {item.name}
      </span>
      <span className={`font-display text-burgundy whitespace-nowrap ${large ? "text-xl" : "text-lg"}`}>
        {formatPrice(item.price)}
      </span>
    </span>
  );

  return (
    <section className="relative overflow-hidden">
      {/* edge decorations */}
      <Leaf className="hidden lg:block absolute top-16 -left-4 w-14 h-14 text-[#7d9b6a] opacity-40 rotate-[24deg]" />
      <Leaf className="hidden lg:block absolute bottom-24 -left-6 w-20 h-20 text-[#7d9b6a] opacity-25 -rotate-[30deg]" />
      <Leaf className="hidden lg:block absolute top-24 -right-5 w-16 h-16 text-[#7d9b6a] opacity-30 rotate-[140deg]" />
      <div className="hidden lg:block absolute top-40 right-[44%] w-24 h-24 rounded-full bg-brand/10" />
      <div className="hidden lg:block absolute bottom-10 left-[42%] w-10 h-10 rounded-full bg-burgundy/10" />

      <div className="max-w-[1520px] mx-auto px-6 lg:px-12 grid gap-14 lg:grid-cols-[45fr_55fr] lg:gap-16 items-center min-h-[540px] py-14 lg:py-20 animate-fade-in">
        {/* Left copy */}
        <div className="flex flex-col justify-center">
          <p className="flex items-center gap-3 text-[13px] uppercase tracking-[0.28em] text-burgundy font-semibold">
            <span className="inline-block w-10 h-[2.5px] rounded-full bg-burgundy" />
            Freshly prepared. Made for you.
          </p>
          <h1 className="font-display font-semibold text-[64px] sm:text-[76px] leading-[1.04] mt-6 text-charcoal">
            Food worth
            <br />
            <span className="italic font-medium text-burgundy">coming back</span>
            <br />
            for.
          </h1>
          <p className="mt-7 text-[17px] text-cocoa leading-[1.75] max-w-[440px]">
            A carefully prepared menu of starters, mains, desserts and
            beverages, made fresh and served with care.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <button
              onClick={() => scrollToId("menu")}
              className="w-[215px] h-[54px] rounded-[28px] bg-burgundy text-white text-[16px] font-medium hover:bg-burgundy-dark transition-all hover:-translate-y-0.5 shadow-[0_10px_25px_-10px_rgba(132,47,58,0.6)]"
            >
              Order now&nbsp;&nbsp;→
            </button>
            <button
              onClick={() => scrollToId("menu")}
              className="w-[215px] h-[54px] rounded-[28px] border border-charcoal/20 text-charcoal text-[16px] font-medium hover:border-burgundy hover:text-burgundy transition-all hover:-translate-y-0.5"
            >
              Explore menu&nbsp;&nbsp;→
            </button>
          </div>

          {/* Trust features */}
          <div className="mt-12 flex items-stretch max-w-[520px]">
            {trustItems.map((t, i) => (
              <div
                key={t.title}
                className={`flex items-center gap-3 pr-6 ${
                  i < trustItems.length - 1 ? "mr-6 border-r border-charcoal/10" : ""
                }`}
              >
                <span className="text-burgundy shrink-0">{t.icon}</span>
                <span>
                  <span className="block text-[14px] font-semibold leading-tight whitespace-nowrap">
                    {t.title}
                  </span>
                  <span className="block text-[13px] text-cocoa mt-0.5 whitespace-nowrap">
                    {t.sub}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right visual */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-5">
            <div className="relative col-span-2 h-[380px] sm:h-[440px] overflow-hidden bg-cream-dark shadow-[0_25px_50px_-20px_rgba(23,21,21,0.35)] rounded-[26px]">
              {featured ? (
                <>
                  <MenuImage
                    key={featured._id}
                    src={featured.image}
                    alt={featured.name}
                    className="h-full w-full object-cover animate-fade-in"
                  />
                  {overlay(featured, true)}
                </>
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display italic text-charcoal/30 text-3xl">
                  TastyBites
                </span>
              )}
            </div>
            {[0, 1].map((i) => (
              <div
                key={i}
                className="relative h-[180px] sm:h-[195px] overflow-hidden bg-cream-dark shadow-[0_15px_35px_-18px_rgba(23,21,21,0.35)] rounded-[22px]"
              >
                {small[i] ? (
                  <>
                    <MenuImage
                      src={small[i].image}
                      alt={small[i].name}
                      className="h-full w-full object-cover"
                    />
                    {overlay(small[i], false)}
                  </>
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-display italic text-charcoal/25 text-xl">
                    Fresh
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Seal badge */}
          <div className="absolute -bottom-7 left-8 sm:left-12 w-[112px] h-[112px] rounded-full bg-burgundy text-cream flex flex-col items-center justify-center text-center shadow-[0_15px_30px_-10px_rgba(132,47,58,0.65)] rotate-[-8deg] ring-4 ring-cream">
            <span className="font-display italic text-[17px] leading-[1.25] px-2">
              Taste
              <br />
              the
              <br />
              Difference
            </span>
          </div>

          {/* Handwritten note */}
          <p className="hidden md:block absolute -top-4 right-4 font-display italic text-cocoa/80 text-[21px] leading-[1.35] rotate-2 text-right">
            Good
            <br />
            Food
            <br />
            Brighter
            <br />
            Mood
          </p>

          {/* Carousel controls */}
          {count > 1 && (
            <div className="mt-5 flex items-center justify-end gap-4 pr-1">
              <div className="flex items-center gap-2.5">
                {gallery.slice(0, 5).map((g, i) => (
                  <button
                    key={g._id}
                    onClick={() => setIndex(i)}
                    aria-label={`Show ${g.name}`}
                    className={`font-display transition-colors ${
                      i === current
                        ? "text-burgundy text-[17px] font-semibold"
                        : "text-charcoal/30 text-[15px] hover:text-charcoal/60"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </button>
                ))}
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setIndex((current - 1 + count) % count)}
                  aria-label="Previous dish"
                  className="w-10 h-10 rounded-full border border-charcoal/15 bg-white flex items-center justify-center text-lg hover:border-burgundy hover:text-burgundy transition-colors shadow-sm"
                >
                  ←
                </button>
                <button
                  onClick={() => setIndex((current + 1) % count)}
                  aria-label="Next dish"
                  className="w-10 h-10 rounded-full border border-charcoal/15 bg-white flex items-center justify-center text-lg hover:border-burgundy hover:text-burgundy transition-colors shadow-sm"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;

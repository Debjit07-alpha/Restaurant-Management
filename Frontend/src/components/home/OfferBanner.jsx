import { useState } from "react";
import { scrollToId } from "../../utils/scroll";

function Sparkle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z" />
    </svg>
  );
}

// Banner visual mirrors the reference (full-bleed red strip, serif
// headline, gold accents, food photo right), but the offer itself is
// the application's REAL delivery perk — there is no coupon system in
// the backend, so no code is advertised.
// Banner photo priority:
// 1. Your reference file at Frontend/public/images/offer-banner.jpg
//    (save it there and it appears automatically, no code change needed)
// 2. Until then, a burger photo from your real menu data so the red
//    area is never empty.
const BANNER_IMAGE = "/images/offer-banner.jpg";

function OfferBanner({ items = [] }) {
  const menuFallback =
    items.find((item) => item.image && item.name?.toLowerCase().includes("burger"))?.image ||
    items.find((item) => item.image)?.image ||
    "";
  const [src, setSrc] = useState(BANNER_IMAGE);
  const [showPhoto, setShowPhoto] = useState(true);

  const handlePhotoError = () => {
    if (src !== menuFallback && menuFallback) {
      setSrc(menuFallback);
    } else {
      setShowPhoto(false);
    }
  };

  return (
    <section className="max-w-[1520px] mx-auto px-6 lg:px-12 py-6 sm:py-8">
      <div className="bg-burgundy text-white overflow-hidden rounded-[28px] shadow-[0_30px_60px_-25px_rgba(217,45,32,0.5)]">
      <div className="grid md:grid-cols-2 items-stretch">
        <div className="relative px-6 sm:px-10 lg:px-16 py-10 sm:py-14 flex flex-col justify-center">
          <div className="absolute -top-14 -left-14 w-52 h-52 rounded-full bg-white/10" />
          <Sparkle className="absolute top-8 left-[46%] w-5 h-5 text-[#F5C93F]" />
          <Sparkle className="absolute bottom-10 left-[38%] w-3.5 h-3.5 text-white/50" />
          <p className="text-sm font-semibold tracking-[0.22em] text-[#F5C93F]">
            Special Offer
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-[54px] leading-[1.08] mt-3">
            FREE DELIVERY
          </h2>
          <p className="text-lg sm:text-xl mt-2 text-white/90">
            On Your Order Above ₹499
          </p>
          <p className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#F5C93F] text-[#7A2E0E] px-5 py-2 text-sm font-bold">
            No code needed — applied automatically
          </p>
          <div>
            <button
              onClick={() => scrollToId("menu")}
              className="mt-7 bg-white text-burgundy font-bold rounded-full px-10 h-[52px] text-[16px] hover:bg-cream transition-all hover:-translate-y-0.5 shadow-lg"
            >
              Order Now →
            </button>
          </div>
        </div>

        <div className="relative min-h-[260px] md:min-h-[340px]">
          {showPhoto && src ? (
            <img
              src={src}
              onError={handlePhotoError}
              alt="Burger and fries special offer"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-burgundy via-burgundy/30 to-transparent" />
          <Sparkle className="absolute top-8 right-[38%] w-5 h-5 text-[#F5C93F]" />
          <p className="absolute bottom-6 right-6 font-display italic text-white text-[22px] leading-snug rotate-2 text-right drop-shadow-md">
            Good Food
            <br />
            Great Deals!
          </p>
        </div>
        </div>
      </div>
    </section>
  );
}

export default OfferBanner;

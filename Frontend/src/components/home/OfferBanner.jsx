import MenuImage from "../MenuImage";
import { scrollToId } from "../../utils/scroll";

// Banner visual mirrors the reference (big red promo card with food image
// on the right), but the offer itself is the application's REAL delivery
// perk — there is no coupon system in the backend, so no code is advertised.
function OfferBanner({ items }) {
  const dish = items.find((item) => item.image) || null;

  return (
    <section className="max-w-[1520px] mx-auto px-6 lg:px-12 py-8 sm:py-12">
      <div className="relative overflow-hidden rounded-[28px] bg-burgundy text-white grid md:grid-cols-2 shadow-[0_30px_60px_-25px_rgba(217,45,32,0.55)]">
        {/* decorative circles */}
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute top-8 right-[46%] w-10 h-10 rounded-full bg-brand/60 hidden md:block" />

        <div className="relative px-8 sm:px-12 lg:px-16 py-12 sm:py-16 flex flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.3em] text-white/75 font-medium">
            Special Offer
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-[54px] leading-[1.1] mt-4">
            FREE DELIVERY
          </h2>
          <p className="text-xl sm:text-2xl mt-3 text-white/90">
            On Your Order Above ₹499
          </p>
          <p className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border-2 border-dashed border-white/60 px-5 py-2 text-sm font-semibold tracking-wide">
            No code needed — applied automatically
          </p>
          <div>
            <button
              onClick={() => scrollToId("menu")}
              className="mt-8 bg-white text-burgundy font-bold rounded-full px-10 h-[54px] text-[16px] hover:bg-cream transition-all hover:-translate-y-0.5 shadow-lg"
            >
              Order Now →
            </button>
          </div>
        </div>

        <div className="relative min-h-[280px] md:min-h-[380px]">
          {dish ? (
            <MenuImage
              src={dish.image}
              alt={dish.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-display italic text-white/40 text-3xl bg-burgundy-dark">
              TastyBites
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-burgundy via-burgundy/20 to-transparent" />
          <p className="absolute bottom-6 right-6 font-display italic text-white/90 text-[22px] leading-snug rotate-2 text-right drop-shadow-md">
            Good Food
            <br />
            Great Deals!
          </p>
        </div>
      </div>
    </section>
  );
}

export default OfferBanner;

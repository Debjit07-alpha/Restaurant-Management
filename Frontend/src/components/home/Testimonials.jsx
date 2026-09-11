// NOTE: The backend has no review system, so these are static
// placeholder marketing cards. Replace with real review data if a
// review API is added later.
const TESTIMONIALS = [
  {
    name: "Priya S.",
    initial: "P",
    color: "bg-burgundy",
    text: "The butter chicken was rich, creamy and arrived hot. Easily the best food delivery experience I've had in the city.",
  },
  {
    name: "Rahul M.",
    initial: "R",
    color: "bg-pine",
    text: "Ordered for the whole family and everything reached on time. Fresh ingredients you can actually taste in every bite.",
  },
  {
    name: "Ananya K.",
    initial: "A",
    color: "bg-brand-dark",
    text: "Cash on delivery makes it so convenient, and the desserts are a must-try. TastyBites is now our weekend default.",
  },
];

function Stars() {
  return (
    <span className="flex gap-1" aria-label="5 out of 5 stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} className="w-4 h-4 text-brand" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

function Testimonials() {
  return (
    <section className="max-w-[1520px] mx-auto px-6 lg:px-12 py-14 sm:py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-3 mb-4">
            <span className="inline-block w-10 h-[2.5px] rounded-full bg-burgundy" />
          </p>
          <h2 className="font-display font-semibold text-4xl sm:text-[44px] leading-tight">
            What Our <span className="italic text-burgundy font-medium">Customers Say</span>
          </h2>
          <p className="text-cocoa mt-3 text-[16px]">
            Real stories from real food lovers
          </p>
        </div>
        <span className="hidden sm:block shrink-0 text-[15px] font-semibold text-burgundy pb-1 whitespace-nowrap">
          View All Reviews →
        </span>
      </div>

      <div className="mt-9 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="bg-white rounded-[20px] border border-charcoal/10 p-7 shadow-[0_18px_40px_-24px_rgba(23,23,23,0.3)] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-3.5">
              <span className={`w-12 h-12 rounded-full ${t.color} text-white font-bold text-lg flex items-center justify-center shrink-0`}>
                {t.initial}
              </span>
              <div>
                <figcaption className="font-bold">{t.name}</figcaption>
                <Stars />
              </div>
            </div>
            <blockquote className="text-[15px] text-charcoal/70 leading-[1.75] mt-4">
              &ldquo;{t.text}&rdquo;
            </blockquote>
          </figure>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;

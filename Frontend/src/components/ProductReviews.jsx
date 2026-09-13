import { useEffect, useState } from "react";
import api from "../api/axios";

export function formatRating(value) {
  const num = Number(value);
  if (!num || num <= 0) return null;
  return (Math.round(num * 10) / 10).toFixed(1).replace(/\.0$/, "");
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Stars({ value, className = "w-4 h-4" }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${className} ${star <= Math.round(value) ? "text-brand" : "text-charcoal/20"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

// Self-contained customer reviews block for a menu item: average, count,
// review cards, and the empty state. Refreshes when `refreshKey` changes.
function ProductReviews({ menuItemId, refreshKey = 0 }) {
  const [data, setData] = useState({ average: 0, count: 0, reviews: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/reviews/menu/${menuItemId}`);
        if (!cancelled) {
          setData({
            average: res.data.average || 0,
            count: res.data.count || 0,
            reviews: res.data.reviews || [],
          });
        }
      } catch {
        if (!cancelled) setData({ average: 0, count: 0, reviews: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (menuItemId) fetchReviews();
    return () => {
      cancelled = true;
    };
  }, [menuItemId, refreshKey]);

  const formatted = formatRating(data.average);

  return (
    <section aria-label="Customer reviews">
      <h2 className="font-display font-semibold text-3xl sm:text-4xl">
        Customer <span className="italic text-burgundy font-medium">Reviews</span>
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-charcoal/50">Loading reviews...</p>
      ) : data.count === 0 ? (
        <div className="mt-4 bg-white border border-charcoal/10 rounded-[20px] px-6 py-10 text-center">
          <p className="font-display font-semibold text-xl">No reviews yet.</p>
          <p className="text-charcoal/60 mt-1.5 text-[15px]">
            Be the first to review this dish.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-display font-semibold text-5xl">
              ⭐ {formatted}
            </span>
            <span className="text-charcoal/60 text-[15px]">
              {data.count} review{data.count === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {data.reviews.map((review) => (
              <article
                key={review._id}
                className="bg-white border border-charcoal/10 rounded-[20px] p-4 sm:p-5 shadow-[0_15px_35px_-24px_rgba(23,23,23,0.35)]"
              >
                <Stars value={review.rating} />
                {review.comment && (
                  <p className="mt-2 text-[15px] leading-relaxed">
                    {review.comment}
                  </p>
                )}
                {review.images?.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {review.images.map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt="Review photo"
                        className="w-20 h-20 object-cover rounded-xl bg-cream-dark"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                <p className="mt-3 text-sm text-charcoal/55">
                  — {review.user?.name || "Customer"} · {formatDate(review.createdAt)}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default ProductReviews;
export { Stars };

import { useEffect, useState } from "react";
import api from "../api/axios";

const MAX_COMMENT_LENGTH = 500;
const MAX_PHOTOS = 3;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Write/edit a review for one delivered order item. Submits FormData only
// when photos are attached (otherwise plain JSON); the backend confirms
// before onSubmitted() runs, so success is never shown on failure.
function ReviewModal({ menuItemId, orderId, initial, onClose, onSubmitted }) {
  const [rating, setRating] = useState(Number(initial?.rating) || 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(
    String(initial?.comment || "").slice(0, MAX_COMMENT_LENGTH)
  );
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS);
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only image files are allowed (jpg, jpeg, png, webp).");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Each photo must be 5MB or smaller.");
        return;
      }
    }
    setError("");
    setPhotos(files);
  };

  const handleSubmit = async () => {
    setError("");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Please select a star rating.");
      return;
    }
    setSaving(true);
    try {
      let res;
      if (photos.length > 0) {
        const data = new FormData();
        data.append("menuItemId", menuItemId);
        data.append("orderId", orderId);
        data.append("rating", String(rating));
        data.append("comment", comment.trim());
        photos.forEach((file) => data.append("images", file));
        res = initial?._id
          ? await api.put(`/reviews/${initial._id}`, data)
          : await api.post("/reviews", data);
      } else if (initial?._id) {
        res = await api.put(`/reviews/${initial._id}`, {
          rating,
          comment: comment.trim(),
        });
      } else {
        res = await api.post("/reviews", {
          menuItemId,
          orderId,
          rating,
          comment: comment.trim(),
        });
      }
      onSubmitted(res.data.review);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit your review. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={initial?._id ? "Edit your review" : "Write a review"}
    >
      <button
        aria-label="Close review"
        onClick={onClose}
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-[2px] cursor-default"
      />
      <div className="relative w-full sm:max-w-lg bg-cream text-charcoal rounded-t-[24px] sm:rounded-[24px] border border-charcoal/10 shadow-[0_25px_60px_-20px_rgba(23,23,23,0.5)] max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        <div className="flex items-start gap-4 p-5 sm:p-6 pb-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold text-2xl leading-tight">
              {initial?._id ? "Edit your review" : "Rate your order"}
            </h2>
            <div className="mt-3 flex items-center gap-1.5" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-0.5 hover:scale-110 active:scale-95 transition-transform"
                >
                  <svg
                    className={`w-9 h-9 ${(hovered || rating) >= star ? "text-brand" : "text-charcoal/20"}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-9 h-9 rounded-full bg-white border border-charcoal/10 flex items-center justify-center hover:border-burgundy hover:text-burgundy transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4 space-y-4">
          <div>
            <label htmlFor="review-comment" className="text-sm font-bold">
              Review <span className="font-medium text-charcoal/50">(optional)</span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              maxLength={MAX_COMMENT_LENGTH}
              rows={3}
              placeholder="Very tasty and fresh."
              className="mt-2 w-full bg-white border border-charcoal/15 rounded-2xl px-4 py-3 text-[15px] placeholder:text-charcoal/35 focus:outline-none focus:border-burgundy resize-none"
            />
            <p className="text-xs text-charcoal/45 mt-1 text-right">
              {comment.length}/{MAX_COMMENT_LENGTH}
            </p>
          </div>

          <div>
            <label htmlFor="review-photos" className="text-sm font-bold">
              Photos <span className="font-medium text-charcoal/50">(optional, up to 3)</span>
            </label>
            <input
              id="review-photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFiles}
              className="mt-2 w-full bg-white border border-charcoal/15 rounded-2xl px-4 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-cream-dark file:px-4 file:py-1.5 file:text-sm file:font-medium"
            />
            {photos.length > 0 && (
              <p className="text-xs text-charcoal/55 mt-1.5">
                {photos.length} photo{photos.length === 1 ? "" : "s"} selected
                {initial?._id ? " (replaces existing photos)" : ""}.
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="bg-red-100 text-red-700 text-sm p-3 rounded-xl">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-charcoal/10 bg-cream px-5 sm:px-6 py-4 sticky bottom-0">
          <button
            onClick={handleSubmit}
            disabled={saving || rating < 1}
            className="w-full bg-burgundy text-white rounded-[28px] h-[52px] text-[15px] font-semibold hover:bg-burgundy-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_10px_25px_-10px_rgba(217,45,32,0.6)]"
          >
            {saving ? "Submitting..." : initial?._id ? "Save Changes" : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewModal;

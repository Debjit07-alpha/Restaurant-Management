import { useEffect } from "react";
import { useFavorites } from "../hooks/useFavorites";

// Single global toast for favorite toggle feedback.
// Mounted once in App; invisible unless there is a notice.
function FavoriteNotice() {
  const { notice, clearNotice } = useFavorites();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(clearNotice, 2600);
    return () => clearTimeout(timer);
  }, [notice, clearNotice]);

  if (!notice) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] text-sm font-medium px-5 py-3 rounded-full shadow-lg border flex items-center gap-3 max-w-[calc(100vw-2rem)] ${
        notice.type === "success"
          ? "bg-pine text-cream border-pine"
          : "bg-red-100 text-red-700 border-red-200"
      }`}
    >
      <span className="truncate">{notice.text}</span>
      <button
        onClick={clearNotice}
        aria-label="Dismiss message"
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

export default FavoriteNotice;

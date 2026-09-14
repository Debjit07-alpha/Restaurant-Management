import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";

// Checkout loyalty redemption. All amounts come from the backend
// (/rewards/summary + /rewards/quote); the frontend only displays.
// Props: onRewards({ points, discount } | null).
function RewardsRedeem({ onRewards }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [wanted, setWanted] = useState(0);
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const onRewardsRef = useRef(onRewards);
  onRewardsRef.current = onRewards;

  useEffect(() => {
    let cancelled = false;
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get("/rewards/summary");
        if (!cancelled) {
          setSummary(res.data);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const step = useCallback(
    (delta) => {
      if (!summary) return;
      const max = Math.min(
        summary.balance,
        summary.rules?.maximumRedemptionPoints || summary.balance
      );
      setError("");
      setWanted((prev) => Math.max(0, Math.min(max, prev + delta)));
    },
    [summary]
  );

  const useMaximum = useCallback(() => {
    if (!summary) return;
    setError("");
    setWanted(
      Math.min(
        summary.balance,
        summary.rules?.maximumRedemptionPoints || summary.balance
      )
    );
  }, [summary]);

  const handleApply = async () => {
    if (wanted <= 0) {
      setError("Choose how many points to redeem.");
      return;
    }
    setApplying(true);
    setError("");
    try {
      const res = await api.post("/rewards/quote", { points: wanted });
      const result = { points: res.data.points, discount: res.data.discount };
      setApplied(result);
      onRewardsRef.current?.(result);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to redeem points. Please try again."
      );
    } finally {
      setApplying(false);
    }
  };

  const handleRemove = () => {
    setApplied(null);
    setWanted(0);
    setError("");
    onRewardsRef.current?.(null);
  };

  if (loading || failed || !summary || summary.balance <= 0) return null;

  const minimum = summary.rules?.minimumRedemptionPoints || 0;
  const max = Math.min(
    summary.balance,
    summary.rules?.maximumRedemptionPoints || summary.balance
  );

  return (
    <div className="mt-4 pt-4 border-t border-charcoal/10">
      {applied ? (
        <div className="bg-pine/10 border border-pine/20 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-pine">
            ✓ {applied.points} points applied
          </p>
          <p className="text-sm text-pine/80 mt-0.5">
            You saved {formatPrice(applied.discount)}
          </p>
          <button
            type="button"
            onClick={handleRemove}
            className="mt-1.5 text-sm font-medium text-charcoal/60 hover:text-burgundy hover:underline underline-offset-2 transition-colors"
          >
            Remove points
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold">Use Reward Points</p>
          <p className="text-sm text-charcoal/60 mt-1">
            Available: {summary.balance} points
            <span className="text-charcoal/45">
              {" "}
              (Value: {formatPrice(summary.value)})
            </span>
          </p>
          {summary.balance < minimum ? (
            <p className="text-sm text-charcoal/55 mt-2">
              You need at least {minimum} points to redeem.
            </p>
          ) : (
            <>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => step(-10)}
                  aria-label="Redeem fewer points"
                  className="w-8 h-8 rounded-full border border-charcoal/20 hover:border-burgundy hover:text-burgundy transition-colors"
                >
                  -
                </button>
                <span className="min-w-16 text-center font-bold tabular-nums">
                  {wanted}
                </span>
                <button
                  type="button"
                  onClick={() => step(10)}
                  aria-label="Redeem more points"
                  className="w-8 h-8 rounded-full border border-charcoal/20 hover:border-burgundy hover:text-burgundy transition-colors"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={useMaximum}
                  className="ml-1 text-sm font-medium text-burgundy hover:underline underline-offset-2"
                >
                  Use Maximum
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying || wanted <= 0}
                  className="ml-auto shrink-0 bg-charcoal text-cream rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-burgundy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {applying ? "Applying..." : `Use ${wanted} Points`}
                </button>
              </div>
              <p className="text-[13px] text-charcoal/50 mt-1.5">
                Redeem between {minimum} and {max} points.
              </p>
            </>
          )}
        </div>
      )}
      {error && !applied && (
        <p role="alert" className="mt-2 text-sm text-red-700 bg-red-100 rounded-xl px-3.5 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

export default RewardsRedeem;

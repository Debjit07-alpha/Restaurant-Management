import { useEffect, useState } from "react";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";

// Live delivery availability for the checkout pincode. The backend
// quotes fee/ETA from DB settings + zones; the frontend only displays.
// Props: pincode, subtotal, discount, onQuote(quote|null).
function DeliveryCheck({ pincode, subtotal, discount, onQuote }) {
  const [quote, setQuote] = useState(null);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  const code = String(pincode || "").trim();

  useEffect(() => {
    onQuote?.(null);
    setQuote(null);
    setFailed(false);
    if (!/^\d{6}$/.test(code)) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/delivery/check", {
          params: {
            pincode: code,
            subtotal: Math.round(Number(subtotal) || 0),
            discount: Math.round(Number(discount) || 0),
          },
          timeout: 15000,
        });
        if (cancelled) return;
        setQuote(res.data);
        onQuote?.(res.data);
      } catch {
        if (cancelled) return;
        setFailed(true);
        onQuote?.(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, Math.round(Number(subtotal) || 0), Math.round(Number(discount) || 0)]);

  if (!/^\d{6}$/.test(code)) return null;

  return (
    <div className="mt-4 pt-4 border-t border-charcoal/10" aria-live="polite">
      {checking && (
        <p className="text-sm text-charcoal/60">Loading delivery information...</p>
      )}
      {!checking && failed && (
        <p role="alert" className="text-sm text-red-700">
          Unable to calculate delivery.
        </p>
      )}
      {!checking && !failed && quote && quote.deliverable && (
        <div className="bg-pine/10 border border-pine/20 rounded-2xl px-4 py-3 text-sm">
          <p className="font-semibold text-pine">✓ Delivering to your location</p>
          <p className="text-pine/80 mt-0.5">
            Delivery Fee:{" "}
            {quote.deliveryCharge === 0 ? "Free" : formatPrice(quote.deliveryCharge)}
            {quote.zoneName ? ` · ${quote.zoneName}` : ""}
          </p>
          {quote.estimatedDeliveryTime && (
            <p className="text-pine/80 mt-0.5">
              Estimated Time: {quote.estimatedDeliveryTime}
            </p>
          )}
        </div>
      )}
      {!checking && !failed && quote && !quote.deliverable && (
        <div className="bg-red-100 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">✕ Delivery unavailable in this area</p>
          <p className="mt-0.5">
            {quote.reason || "Delivery is currently unavailable to this location."}
          </p>
        </div>
      )}
    </div>
  );
}

export default DeliveryCheck;

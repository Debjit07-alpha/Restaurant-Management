import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";
import { toOrderCustomization } from "../utils/customization";

export const COUPON_STORAGE_KEY = "tastybites_coupon";

// Convert cart entries (incl. customization) into the backend coupon
// payload. Uses live cart lines so add-ons count toward the subtotal.
export function toCouponItems(entries) {
  return (entries || []).map((entry) => ({
    menuItem: entry.id,
    quantity: entry.quantity,
    ...(entry.customization
      ? {
          customization: toOrderCustomization(
            entry.customization.selections,
            entry.customization.specialInstructions
          ),
        }
      : {}),
  }));
}

export function loadStoredCouponCode() {
  try {
    return String(localStorage.getItem(COUPON_STORAGE_KEY) || "").trim().toUpperCase();
  } catch {
    return "";
  }
}

export function storeCouponCode(code) {
  try {
    if (code) localStorage.setItem(COUPON_STORAGE_KEY, code);
    else localStorage.removeItem(COUPON_STORAGE_KEY);
  } catch {
    // Storage unavailable: coupon simply won't persist across pages.
  }
}

// Promo-code box. All amounts come from the backend (/coupons/validate);
// the frontend only displays the backend result.
// Props: cartItems (live cart), onCoupon(result|null).
function CouponBox({ cartItems, onCoupon }) {
  const [code, setCode] = useState(loadStoredCouponCode);
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const appliedRef = useRef(null);
  appliedRef.current = applied;
  const onCouponRef = useRef(onCoupon);
  onCouponRef.current = onCoupon;

  const cartSignature = JSON.stringify(
    (cartItems || []).map((e) => [e.id, e.quantity, e.price])
  );

  const applyCode = useCallback(
    async (rawCode, { silent = false } = {}) => {
      const normalized = String(rawCode || "").trim().toUpperCase();
      if (!normalized) {
        if (!silent) setError("Enter a promo code.");
        return null;
      }
      if (!cartItems || cartItems.length === 0) {
        if (!silent) setError("Your cart is empty.");
        return null;
      }
      if (!silent) {
        setApplying(true);
        setError("");
      }
      try {
        const res = await api.post("/coupons/validate", {
          code: normalized,
          items: toCouponItems(cartItems),
        });
        const result = {
          couponCode: res.data.couponCode,
          discountType: res.data.discountType,
          discountValue: res.data.discountValue,
          subtotal: res.data.subtotal,
          eligibleSubtotal: res.data.eligibleSubtotal,
          discountAmount: res.data.discountAmount,
          deliveryCharge: res.data.deliveryCharge,
          totalAmount: res.data.totalAmount,
        };
        setApplied(result);
        setCode(normalized);
        storeCouponCode(normalized);
        onCouponRef.current?.(result);
        return result;
      } catch (err) {
        let message = err.response?.data?.message;
        if (!message) {
          message =
            err.response?.status === 404
              ? "Coupon service is unavailable (backend not deployed). Please try again later."
              : "Unable to apply coupon. Please try again.";
        }
        if (!silent) setError(message);
        return null;
      } finally {
        if (!silent) setApplying(false);
      }
    },
    [cartItems]
  );

  const handleRemove = () => {
    setApplied(null);
    setError("");
    storeCouponCode("");
    onCouponRef.current?.(null);
  };

  // Recalculate whenever the cart changes (quantity / remove /
  // customization). Never silently change totals: a coupon that no
  // longer validates is removed with its backend reason shown.
  useEffect(() => {
    const current = appliedRef.current;
    if (!current) return;
    if (!cartItems || cartItems.length === 0) {
      setApplied(null);
      storeCouponCode("");
      onCouponRef.current?.(null);
      return;
    }
    let cancelled = false;
    const revalidate = async () => {
      setRevalidating(true);
      try {
        const res = await api.post("/coupons/validate", {
          code: current.couponCode,
          items: toCouponItems(cartItems),
        });
        if (cancelled) return;
        const result = {
          couponCode: res.data.couponCode,
          discountType: res.data.discountType,
          discountValue: res.data.discountValue,
          subtotal: res.data.subtotal,
          eligibleSubtotal: res.data.eligibleSubtotal,
          discountAmount: res.data.discountAmount,
          deliveryCharge: res.data.deliveryCharge,
          totalAmount: res.data.totalAmount,
        };
        setApplied(result);
        setError("");
        onCouponRef.current?.(result);
      } catch (err) {
        if (cancelled) return;
        setApplied(null);
        storeCouponCode("");
        onCouponRef.current?.(null);
        setError(
          err.response?.data?.message ||
            `Coupon ${current.couponCode} is no longer valid for this cart.`
        );
      } finally {
        if (!cancelled) setRevalidating(false);
      }
    };
    revalidate();
    return () => {
      cancelled = true;
    };
    // Re-run when the cart contents change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature]);

  return (
    <div className="mt-4 pt-4 border-t border-charcoal/10">
      {applied ? (
        <div className="bg-pine/10 border border-pine/20 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-pine">
            ✓ {applied.couponCode} applied
          </p>
          <p className="text-sm text-pine/80 mt-0.5">
            You saved {formatPrice(applied.discountAmount)}
            {revalidating ? " · updating..." : ""}
          </p>
          <button
            type="button"
            onClick={handleRemove}
            className="mt-1.5 text-sm font-medium text-charcoal/60 hover:text-burgundy hover:underline underline-offset-2 transition-colors"
          >
            Remove coupon
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold">Have a promo code?</p>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
              aria-label="Promo code"
              maxLength={30}
              className="flex-1 min-w-0 border border-charcoal/20 rounded-xl px-3.5 py-2.5 text-sm uppercase placeholder:normal-case placeholder:text-charcoal/35 bg-cream focus:outline-none focus:border-burgundy"
            />
            <button
              type="button"
              onClick={() => applyCode(code)}
              disabled={applying || !code.trim()}
              className="shrink-0 bg-charcoal text-cream rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-burgundy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {applying ? "Applying..." : "Apply"}
            </button>
          </div>
        </div>
      )}
      {error && !applied && (
        <p role="alert" className="mt-2 text-sm text-red-700 bg-red-100 rounded-xl px-3.5 py-2">
          {error}
        </p>
      )}
      {error && applied && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default CouponBox;

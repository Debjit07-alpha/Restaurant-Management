import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatPrice";
import { getDeliveryCharge } from "../utils/delivery";
import { toOrderCustomization } from "../utils/customization";
import MenuImage from "../components/MenuImage";
import CustomizationLines from "../components/CustomizationLines";
import CouponBox, { storeCouponCode } from "../components/CouponBox";
import DeliveryCheck from "../components/DeliveryCheck";
import RewardsRedeem from "../components/RewardsRedeem";

const inputClass =
  "mt-1 w-full border border-charcoal/20 rounded-xl px-3 py-2 bg-cream focus:outline-none focus:border-burgundy";

function Checkout() {
  const { user } = useAuth();
  const { cartItems, totalPrice, clearCart } = useCart();

  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    flat: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    instructions: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  // idle → loading → success | error. Success is shown ONLY after the
  // backend confirms the order is stored in the database.
  const [status, setStatus] = useState("idle");
  const [placedOrder, setPlacedOrder] = useState(null);
  const [locationNote, setLocationNote] = useState("");
  const [detectedLabel, setDetectedLabel] = useState("");
  // Temporary development readout of the raw GPS fix (removed later).
  const [debugCoords, setDebugCoords] = useState(null);
  const [locationOk, setLocationOk] = useState(false);
  // Address search fallback (Geoapify Autocomplete via our backend, no
  // GPS needed). Independent of the location button above.
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedSearch, setSelectedSearch] = useState("");
  // Last gate-passed GPS fix (memory only, never stored): used solely
  // as proximity bias for address search, never for autofill.
  const goodFixRef = useRef(null);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchText("");
    setSuggestions([]);
    setSearching(false);
    setSearchError("");
    setSelectedSearch("");
  };

  const selectSuggestion = (suggestion) => {
    applyDetectedAddress(suggestion);
    const labelParts = [
      suggestion.street,
      suggestion.area,
      suggestion.city,
      suggestion.postcode,
    ].filter(
      (part, index, all) =>
        part && part.trim() !== "" && all.indexOf(part) === index
    );
    const label =
      labelParts.length > 0
        ? labelParts.join(", ")
        : suggestion.displayName || "";
    setDetectedLabel(label);
    setDebugCoords(null);
    setLocationOk(true);
    setLocationNote("Address selected.");
    if (restoreTimer.current) clearTimeout(restoreTimer.current);
    restoreTimer.current = setTimeout(() => setLocationOk(false), 3500);
    // Keep the chosen address visible in the search field (still
    // editable for refining); checkout fields below are filled.
    setSearchText(suggestion.displayName || label);
    setSuggestions([]);
    setSearchError("");
    setSelectedSearch(suggestion.displayName || label);
  };

  // Debounced backend search (min 3 chars, 400ms, stale responses
  // ignored). Works with no GPS; biased toward the good fix when one
  // exists from the location button.
  useEffect(() => {
    const query = searchText.trim();
    if (!searchOpen || query.length < 3) {
      setSuggestions([]);
      setSearching(false);
      setSearchError("");
      return;
    }
    // Don't re-search the address the user just selected.
    if (selectedSearch && query === selectedSearch) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError("");
    setSelectedSearch("");
    const timer = setTimeout(async () => {
      try {
        const bias = goodFixRef.current;
        const res = await api.get("/location/autocomplete", {
          params: bias
            ? { text: query, lat: bias.latitude, lng: bias.longitude }
            : { text: query },
          timeout: 15000,
        });
        if (!cancelled) setSuggestions(res.data.suggestions || []);
      } catch (err) {
        if (!cancelled) {
          setSuggestions([]);
          setSearchError(
            err.response?.data?.message ||
              "Address search is temporarily unavailable. Please enter your address manually."
          );
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchText, searchOpen, selectedSearch]);
  const [locating, setLocating] = useState(false);
  const restoreTimer = useRef(null);

  // Restore the location button text after a successful detection.
  useEffect(() => {
    return () => {
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
    };
  }, []);
  // Backend-validated coupon (amounts come from /coupons/validate).
  const [coupon, setCoupon] = useState(null);
  // Backend-validated loyalty redemption ({ points, discount } | null).
  const [rewards, setRewards] = useState(null);
  // Live delivery quote for the checkout pincode (/delivery/check).
  // The backend re-quotes at order time; this only drives display +
  // the unavailable-address gate.
  const [deliveryQuote, setDeliveryQuote] = useState(null);

  // Pre-fill name from the logged-in user (stays editable)
  useEffect(() => {
    if (user?.name) {
      setForm((prev) =>
        prev.fullName ? prev : { ...prev, fullName: user.name }
      );
    }
  }, [user]);

  const discount = coupon?.discountAmount || 0;
  const rewardsDiscount = rewards?.discount || 0;
  // Live zone quote wins when present; otherwise the coupon validation
  // response (zone-aware when a pincode was sent); otherwise the legacy
  // display rule. The backend always recalculates at order time.
  const deliveryCharge = deliveryQuote
    ? deliveryQuote.deliveryCharge
    : (coupon?.deliveryCharge ?? getDeliveryCharge(totalPrice - discount));
  const grandTotal = Math.max(
    0,
    totalPrice - discount - rewardsDiscount + deliveryCharge
  );
  const minimumBlocked = Boolean(
    deliveryQuote &&
      deliveryQuote.deliverable &&
      deliveryQuote.meetsMinimum === false
  );
  const deliveryBlocked = Boolean(
    deliveryQuote &&
      (!deliveryQuote.deliverable || deliveryQuote.meetsMinimum === false)
  );

  // Success screen stays on this same page after the backend confirms.
  // It must render before the empty-cart guard because the cart is
  // cleared only after a confirmed order.
  if (status === "success" && placedOrder) {
    return (
      <div className="bg-cream text-charcoal">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center animate-fade-in">
          <span className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-pine text-cream text-3xl shadow-md">
            ✓
          </span>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-6">
            Order Placed <span className="italic text-burgundy">Successfully!</span>
          </h1>
          <p className="text-charcoal/65 mt-4 leading-relaxed">
            Thank you for your order.
            <br />
            Your order has been received and is being processed.
          </p>
          <p className="mt-6 inline-block border border-charcoal/15 rounded-full px-6 py-2.5 text-[15px] bg-white">
            Order ID:{" "}
            <span className="font-bold">#{placedOrder.orderId}</span>
          </p>
          {placedOrder.couponCode && (
            <p className="mt-3 text-[15px] text-pine font-medium">
              ✓ {placedOrder.couponCode} applied — you saved{" "}
              {formatPrice(placedOrder.discountAmount || 0)}
            </p>
          )}
          <p className="mt-3 text-[15px] text-charcoal/60">
            ⭐ Reward points will be credited after your order is delivered.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="flex-1 sm:flex-none bg-burgundy text-white rounded-[28px] px-8 py-3.5 text-[15px] font-semibold hover:bg-burgundy-dark transition-all hover:-translate-y-0.5 text-center"
            >
              Continue Browsing
            </Link>
            <Link
              to="/cart"
              className="flex-1 sm:flex-none border border-charcoal/20 rounded-[28px] px-8 py-3.5 text-[15px] font-semibold hover:border-burgundy hover:text-burgundy transition-all hover:-translate-y-0.5 text-center"
            >
              Continue Carting
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="bg-cream text-charcoal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="font-display text-4xl">Checkout</h1>
          <p className="text-charcoal/60 mt-4">Your cart is empty.</p>
          <Link
            to="/cart"
            className="inline-block mt-6 bg-charcoal text-cream px-8 py-3 rounded-full text-sm hover:bg-burgundy transition-colors"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Merge a reverse-geocoded address into the existing form.
  // Explicit location request: detected values fill their fields, but
  // fields the geocoder cannot determine keep the user's input.
  // Flat is never invented: it only fills from an actual house number
  // when the user hasn't typed one. Everything stays editable.
  const applyDetectedAddress = (detected) => {
    setForm((prev) => {
      const streetParts = [detected.street, detected.area].filter(
        (part, index, all) =>
          part && part.trim() !== "" && all.indexOf(part) === index
      );
      return {
        ...prev,
        flat:
          prev.flat.trim() !== ""
            ? prev.flat
            : detected.houseNumber || prev.flat,
        street:
          streetParts.length > 0 ? streetParts.join(", ") : prev.street,
        landmark: detected.landmark || prev.landmark,
        city: detected.city || prev.city,
        state: detected.state || prev.state,
        pincode: detected.postcode || prev.pincode,
      };
    });
  };

  // One-shot position request wrapped as a promise.
  const requestPosition = (options) =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

  // Device GPS only (never IP/network approximation, never cached):
  // fresh high-accuracy fixes, always maximumAge 0. Every reading is
  // logged; only the smallest accuracy wins — but even the best reading
  // must be <=100m. Anything worse is NEVER sent to Geoapify; desktop
  // users are redirected to Search Address instead.
  const GATE_M = 100;
  const MAX_READINGS = 3;

  const logRawPosition = (position) => {
    console.log("GPS LOCATION", {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });
  };

  const acquireAccuratePosition = async () => {
    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    };
    let best = null;
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_READINGS; attempt += 1) {
      try {
        if (attempt > 1) {
          setLocationNote(
            `Improving location accuracy... (attempt ${attempt} of ${MAX_READINGS})`
          );
        }
        const position = await requestPosition(options);
        logRawPosition(position);
        const accuracy = Number(position.coords.accuracy) || Infinity;
        if (!best || accuracy < Number(best.coords.accuracy)) {
          best = position;
        }
        if (accuracy <= GATE_M) return best;
      } catch (error) {
        // Permission denied never improves: stop immediately.
        if (error?.code === 1) throw error;
        lastError = error;
      }
    }
    if (best) {
      const bestAccuracy = Number(best.coords.accuracy) || Infinity;
      if (bestAccuracy > GATE_M) {
        const poor = new Error("Poor accuracy");
        poor.code = "LOW_ACCURACY";
        poor.accuracyM = Math.round(bestAccuracy);
        throw poor;
      }
      return best;
    }
    throw lastError || new Error("Position unavailable");
  };

  // One-time current-location lookup: browser geolocation (on click
  // only, never tracked) + backend reverse geocode -> autofill.
  const handleUseLocation = async () => {
    if (locating) return;
    if (!("geolocation" in navigator)) {
      setLocationOk(false);
      setDetectedLabel("");
      setLocationNote(
        "Location is not available on this device. Please enter your address manually."
      );
      return;
    }
    setLocating(true);
    setLocationOk(false);
    setDetectedLabel("");
    setDebugCoords(null);
    setLocationNote("Detecting your location...");
    try {
      const position = await acquireAccuratePosition();
      const { latitude, longitude, accuracy } = position.coords;
      // Gate-passed fix only: remembered for search proximity bias
      // (memory only). Never used for autofill without a fresh request.
      goodFixRef.current = { latitude, longitude };
      // Temporary development readout: verify on a map that these
      // coordinates point at the real location before trusting Geoapify.
      setDebugCoords({ latitude, longitude, accuracy });
      try {
        const res = await api.get("/location/reverse", {
          params: { lat: latitude, lng: longitude },
          timeout: 20000,
        });
        const detected = res.data.address || {};
        applyDetectedAddress(detected);
        const labelParts = [
          detected.street,
          detected.area,
          detected.city,
          detected.postcode,
        ].filter(
          (part, index, all) =>
            part && part.trim() !== "" && all.indexOf(part) === index
        );
        setDetectedLabel(
          labelParts.length > 0
            ? labelParts.join(", ")
            : detected.displayName || ""
        );
        setLocationOk(true);
        setLocationNote(
          detected.lowConfidence
            ? "Location detected, but address accuracy is low. Please verify."
            : "Location detected."
        );
        if (restoreTimer.current) clearTimeout(restoreTimer.current);
        restoreTimer.current = setTimeout(() => setLocationOk(false), 3500);
      } catch (err) {
        setLocationOk(false);
        setLocationNote(
          err.response?.data?.message ||
            "Location detected, but the address could not be resolved."
        );
      }
    } catch (geoError) {
      setLocationOk(false);
      setDetectedLabel("");
      if (geoError?.code === 1) {
        setLocationNote(
          "Location permission denied. Please allow location access or enter your address manually."
        );
      } else if (geoError?.code === "LOW_ACCURACY") {
        // Poor GPS (desktop-class fixes): never autofill, never invent.
        // The Search Address option beside the button covers this case.
        setLocationNote(
          "Precise location is unavailable on this device. Please search your address instead."
        );
      } else if (geoError?.code === 3) {
        setLocationNote("Location detection timed out. Please try again.");
      } else {
        setLocationNote(
          "Unable to detect your location. Please enter your address manually."
        );
      }
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Ignore duplicate clicks while a request is in flight or done.
    if (placing || status === "success") return;

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!form.fullName.trim() || !/^\d{10}$/.test(form.mobile.trim())) {
      setError("Enter your full name and a valid 10-digit mobile number.");
      return;
    }
    if (
      !form.flat.trim() ||
      !form.street.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !/^\d{6}$/.test(form.pincode.trim())
    ) {
      setError(
        "Enter flat, street, city, state and a valid 6-digit pincode."
      );
      return;
    }

    setPlacing(true);
    setStatus("loading");
    try {
      const res = await api.post("/orders", {
        customerName: form.fullName.trim(),
        mobile: form.mobile.trim(),
        address: {
          flat: form.flat.trim(),
          street: form.street.trim(),
          landmark: form.landmark.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          instructions: form.instructions.trim(),
        },
        paymentMethod,
        ...(coupon?.couponCode ? { couponCode: coupon.couponCode } : {}),
        ...(rewards?.points > 0 ? { rewardPoints: rewards.points } : {}),
        items: cartItems.map((entry) => ({
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
        })),
      });
      // The backend confirmed the order is stored: show inline success
      // on this same page, then clear the purchased cart + coupon.
      setPlacedOrder(res.data.order);
      setStatus("success");
      setCoupon(null);
      storeCouponCode("");
      setRewards(null);
      clearCart();
    } catch (err) {
      // Failure: stay on checkout, keep the cart, re-enable the button.
      setStatus("error");
      setError(
        err.response?.data?.message ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="bg-cream text-charcoal">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-sm uppercase tracking-[0.25em] text-burgundy">
          Almost there
        </p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2">Checkout</h1>

        {error && (
          <p className="mt-6 bg-red-100 text-red-700 text-sm p-3 rounded-xl">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] items-start"
        >
          {/* LEFT: contact + address + payment */}
          <div className="space-y-8">
            <section className="border border-charcoal/10 rounded-2xl p-6">
              <h2 className="font-display text-2xl">Contact information</h2>
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{10}"
                    title="Enter a 10-digit mobile number"
                    placeholder="9876543210"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="border border-charcoal/10 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl">Delivery address</h2>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="text-sm border border-charcoal/20 rounded-full px-4 py-1.5 hover:border-burgundy hover:text-burgundy transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                  {locating
                    ? "Detecting Location..."
                    : locationOk
                      ? "Location Detected ✓"
                      : "Use My Current Location"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen((open) => !open);
                    setSearchError("");
                  }}
                  aria-expanded={searchOpen}
                  className="text-sm border border-charcoal/20 rounded-full px-4 py-1.5 hover:border-burgundy hover:text-burgundy transition-colors inline-flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
                    />
                  </svg>
                  Search Address
                </button>
              </div>
              {searchOpen && (
                <div className="mt-3 border border-charcoal/15 rounded-2xl p-4 bg-cream">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Type street / area / landmark…"
                      aria-label="Search address"
                      maxLength={200}
                      className="flex-1 min-w-0 border border-charcoal/20 rounded-xl px-3.5 py-2.5 text-sm bg-white placeholder:text-charcoal/35 focus:outline-none focus:border-burgundy"
                    />
                    <button
                      type="button"
                      onClick={closeSearch}
                      aria-label="Close address search"
                      className="shrink-0 w-9 h-9 rounded-full bg-white border border-charcoal/10 flex items-center justify-center hover:border-burgundy hover:text-burgundy transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  {searching && (
                    <p className="mt-2 text-sm text-charcoal/60">Searching…</p>
                  )}
                  {searchError && (
                    <p role="alert" className="mt-2 text-sm text-red-700">
                      {searchError}
                    </p>
                  )}
                  {!searching && !searchError && suggestions.length > 0 && (
                    <ul className="mt-2 bg-white border border-charcoal/10 rounded-xl overflow-hidden divide-y divide-charcoal/10">
                      {suggestions.map((suggestion) => (
                        <li key={suggestion.id}>
                          <button
                            type="button"
                            onClick={() => selectSuggestion(suggestion)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream-dark transition-colors"
                          >
                            <span className="block font-medium">
                              {suggestion.displayName || suggestion.street}
                            </span>
                            <span className="block text-charcoal/55 text-[13px]">
                              {[suggestion.city, suggestion.state, suggestion.postcode]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!searching &&
                    !searchError &&
                    selectedSearch && (
                      <p className="mt-2 text-sm text-pine font-medium">
                        ✓ Selected — checkout fields filled below. You can
                        refine the search above or close.
                      </p>
                    )}
                  {!searching &&
                    !searchError &&
                    !selectedSearch &&
                    searchText.trim().length >= 3 &&
                    suggestions.length === 0 && (
                      <p className="mt-2 text-sm text-charcoal/60">
                        No matching addresses found.
                      </p>
                    )}
                </div>
              )}
              {locationNote && (
                <p
                  role="status"
                  className={`mt-3 text-sm ${locationOk ? "text-pine font-medium" : "text-charcoal/60"}`}
                >
                  {locationNote}
                </p>
              )}
              {locationOk && detectedLabel && (
                <p className="mt-1 text-sm text-charcoal/60">
                  Detected location:{" "}
                  <span className="font-medium text-charcoal">{detectedLabel}</span>
                </p>
              )}
              {import.meta.env.DEV && debugCoords && (
                <p className="mt-1 text-xs text-charcoal/50">
                  Latitude: {debugCoords.latitude} · Longitude:{" "}
                  {debugCoords.longitude} · Accuracy:{" "}
                  {Math.round(Number(debugCoords.accuracy))} m
                </p>
              )}
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Flat / House No. *
                  </label>
                  <input
                    type="text"
                    name="flat"
                    value={form.flat}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Street / Area *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={form.landmark}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{6}"
                    title="Enter a 6-digit pincode"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium">
                    Delivery Instructions (Optional)
                  </label>
                  <textarea
                    name="instructions"
                    value={form.instructions}
                    onChange={handleChange}
                    rows="2"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="border border-charcoal/10 rounded-2xl p-6">
              <h2 className="font-display text-2xl">Payment method</h2>
              <div className="mt-4 space-y-3">
                {[
                  {
                    value: "Cash on Delivery",
                    hint: "Pay the rider in cash when your food arrives.",
                  },
                  {
                    value: "UPI on Delivery",
                    hint: "Pay using UPI when your order arrives.",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${
                      paymentMethod === option.value
                        ? "border-burgundy"
                        : "border-charcoal/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.value}
                      checked={paymentMethod === option.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 accent-burgundy"
                    />
                    <span>
                      <span className="block font-medium">{option.value}</span>
                      <span className="block text-sm text-charcoal/60">
                        {option.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: order summary */}
          <aside className="border border-charcoal/10 rounded-2xl p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-2xl">Your Order</h2>
            <div className="mt-4 space-y-4">
              {cartItems.map((entry) => (
                <div key={entry.key} className="flex items-center gap-3">
                  <div className="w-14 h-14 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                    <MenuImage
                      src={entry.image}
                      alt={entry.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{entry.name}</p>
                    <p className="text-sm text-charcoal/60">
                      {formatPrice(entry.price)} × {entry.quantity}
                    </p>
                    <CustomizationLines
                      customization={entry.customization}
                      compact
                    />
                  </div>
                  <p className="font-medium whitespace-nowrap">
                    {formatPrice(entry.price * entry.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <CouponBox
              cartItems={cartItems}
              onCoupon={setCoupon}
              pincode={form.pincode}
            />
            <RewardsRedeem onRewards={setRewards} />
            <DeliveryCheck
              pincode={form.pincode}
              subtotal={totalPrice}
              discount={discount}
              onQuote={setDeliveryQuote}
            />
            <div className="mt-4 pt-4 border-t border-charcoal/10 space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-charcoal/60">Subtotal</span>
                <span className="font-medium">{formatPrice(totalPrice)}</span>
              </p>
              {discount > 0 && (
                <p className="flex justify-between text-pine">
                  <span>Discount{coupon?.couponCode ? ` (${coupon.couponCode})` : ""}</span>
                  <span className="font-medium">-{formatPrice(discount)}</span>
                </p>
              )}
              {rewardsDiscount > 0 && (
                <p className="flex justify-between text-pine">
                  <span>
                    Rewards{rewards?.points ? ` (${rewards.points} points)` : ""}
                  </span>
                  <span className="font-medium">-{formatPrice(rewardsDiscount)}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span className="text-charcoal/60">Delivery</span>
                <span className="font-medium">
                  {deliveryCharge === 0 ? "Free" : formatPrice(deliveryCharge)}
                </span>
              </p>
              <p className="flex justify-between font-display text-xl pt-2">
                <span>Total</span>
                <span className="text-burgundy">{formatPrice(grandTotal)}</span>
              </p>
            </div>
            <button
              type="submit"
              disabled={placing || deliveryBlocked}
              className="mt-6 w-full bg-charcoal text-cream rounded-full py-3 text-sm hover:bg-burgundy transition-colors disabled:opacity-50"
            >
              {placing ? "Placing order..." : "Place Order"}
            </button>
            {deliveryBlocked && (
              <p className="mt-2 text-[13px] text-red-700 text-center">
                {minimumBlocked && deliveryQuote
                  ? `Minimum order amount is ${formatPrice(deliveryQuote.minimumOrderAmount)}.`
                  : "Delivery is currently unavailable to this location. Please choose a supported address."}
              </p>
            )}
          </aside>
        </form>
      </div>
    </div>
  );
}

export default Checkout;

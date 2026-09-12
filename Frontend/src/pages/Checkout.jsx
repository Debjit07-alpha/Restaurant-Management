import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatPrice";
import { getDeliveryCharge } from "../utils/delivery";
import MenuImage from "../components/MenuImage";

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
  const [locating, setLocating] = useState(false);

  // Pre-fill name from the logged-in user (stays editable)
  useEffect(() => {
    if (user?.name) {
      setForm((prev) =>
        prev.fullName ? prev : { ...prev, fullName: user.name }
      );
    }
  }, [user]);

  const deliveryCharge = getDeliveryCharge(totalPrice);
  const grandTotal = totalPrice + deliveryCharge;

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

  const handleUseLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationNote(
        "Location is not available on this device. Please enter your address manually."
      );
      return;
    }
    setLocating(true);
    setLocationNote("");
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocating(false);
        setLocationNote(
          "Location access granted. Please still enter your delivery address manually so the kitchen has the full details."
        );
      },
      () => {
        setLocating(false);
        setLocationNote(
          "Location permission was denied or unavailable. Please enter your address manually."
        );
      }
    );
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
        items: cartItems.map((entry) => ({
          menuItem: entry.id,
          quantity: entry.quantity,
        })),
      });
      // The backend confirmed the order is stored: show inline success
      // on this same page, then clear the purchased cart.
      setPlacedOrder(res.data.order);
      setStatus("success");
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
                  className="text-sm border border-charcoal/20 rounded-full px-4 py-1.5 hover:border-burgundy hover:text-burgundy transition-colors disabled:opacity-50"
                >
                  {locating ? "Locating..." : "Use My Current Location"}
                </button>
              </div>
              {locationNote && (
                <p className="mt-3 text-sm text-charcoal/60">{locationNote}</p>
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
                <div key={entry.id} className="flex items-center gap-3">
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
                  </div>
                  <p className="font-medium whitespace-nowrap">
                    {formatPrice(entry.price * entry.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-charcoal/10 space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-charcoal/60">Subtotal</span>
                <span className="font-medium">{formatPrice(totalPrice)}</span>
              </p>
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
              disabled={placing}
              className="mt-6 w-full bg-charcoal text-cream rounded-full py-3 text-sm hover:bg-burgundy transition-colors disabled:opacity-50"
            >
              {placing ? "Placing order..." : "Place Order"}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default Checkout;

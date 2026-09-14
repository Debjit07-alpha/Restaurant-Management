import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useDineInCart } from "../context/DineInCartContext";
import { formatPrice } from "../utils/formatPrice";
import { toOrderCustomization } from "../utils/customization";
import MenuImage from "../components/MenuImage";
import CustomizationLines from "../components/CustomizationLines";
import CouponBox, { DINE_IN_COUPON_STORAGE_KEY, storeCouponCode } from "../components/CouponBox";
import RewardsRedeem from "../components/RewardsRedeem";

const DINE_IN_METHODS = [
  { value: "Cash at Counter", hint: "Pay at the counter when you finish." },
  { value: "UPI at Table", hint: "Pay using UPI at your table." },
];

function DineInCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, totalPrice, clearCart, tableInfo } = useDineInCart();

  const [guests, setGuests] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash at Counter");
  const [coupon, setCoupon] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    if (user?.name) setFullName((prev) => prev || user.name);
  }, [user]);

  const rewardsDiscount = rewards?.discount || 0;
  const discount = coupon?.discountAmount || 0;
  // Dine-in never charges delivery.
  const grandTotal = Math.max(0, totalPrice - discount - rewardsDiscount);

  if (!tableInfo) {
    return (
      <div className="bg-cream text-charcoal min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-charcoal/60">
            Scan your table&apos;s QR code to start a dine-in order.
          </p>
          <Link
            to="/"
            className="inline-block mt-6 bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (placedOrder) {
    return (
      <div className="bg-cream text-charcoal min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
          <span className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-pine text-cream text-3xl">
            ✓
          </span>
          <h1 className="font-display font-semibold text-4xl mt-6">
            Order Sent to <span className="italic text-burgundy">Kitchen!</span>
          </h1>
          <p className="text-charcoal/65 mt-4">
            Table {placedOrder.tableNumber}
            <br />
            Order #{placedOrder.orderId}
            <br />
            Your food is being prepared.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/orders/${placedOrder._id}`}
              className="bg-burgundy text-white rounded-full px-8 py-3.5 text-[15px] font-semibold hover:bg-burgundy-dark transition-colors text-center"
            >
              Track Order
            </Link>
            <Link
              to={`/dine-in/${tableInfo.tableNumber}?token=${tableInfo.qrToken || ""}`}
              className="border border-charcoal/20 rounded-full px-8 py-3.5 text-[15px] font-semibold hover:border-burgundy hover:text-burgundy transition-colors text-center"
            >
              Order More
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="bg-cream text-charcoal min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-charcoal/60">Your dine-in tray is empty.</p>
          <Link
            to={`/dine-in/${tableInfo.tableNumber}?token=${tableInfo.qrToken || ""}`}
            className="inline-block mt-6 bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (placing) return;
    if (!fullName.trim() || !/^\d{10}$/.test(mobile.trim())) {
      setError("Enter your full name and a valid 10-digit mobile number.");
      return;
    }
    if (guests !== "" && (!Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > 50)) {
      setError("Guest count must be 1–50.");
      return;
    }
    setPlacing(true);
    try {
      const res = await api.post("/orders", {
        orderType: "dine_in",
        tableNumber: tableInfo.tableNumber,
        qrToken: tableInfo.qrToken,
        ...(guests !== "" ? { guestCount: Number(guests) } : {}),
        customerName: fullName.trim(),
        mobile: mobile.trim(),
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
      setPlacedOrder(res.data.order);
      setCoupon(null);
      storeCouponCode("", DINE_IN_COUPON_STORAGE_KEY);
      setRewards(null);
      clearCart();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <p className="text-[13px] uppercase tracking-[0.25em] text-burgundy font-semibold">
          Dine-in · Table {tableInfo.tableNumber}
        </p>
        <h1 className="font-display font-semibold text-4xl mt-2">Dine-In Checkout</h1>

        {error && (
          <p className="mt-6 bg-red-100 text-red-700 text-sm p-3 rounded-xl">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <section className="bg-white border border-charcoal/10 rounded-[20px] p-6">
            <h2 className="font-display text-2xl">Table &amp; Contact</h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="mt-1 w-full border border-charcoal/20 rounded-xl px-3 py-2 bg-cream focus:outline-none focus:border-burgundy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Mobile Number *</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  pattern="[0-9]{10}"
                  title="Enter a 10-digit mobile number"
                  placeholder="9876543210"
                  className="mt-1 w-full border border-charcoal/20 rounded-xl px-3 py-2 bg-cream focus:outline-none focus:border-burgundy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Guests <span className="font-normal text-charcoal/50">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  placeholder={tableInfo.capacity ? `Up to ${tableInfo.capacity}` : "4"}
                  className="mt-1 w-full border border-charcoal/20 rounded-xl px-3 py-2 bg-cream focus:outline-none focus:border-burgundy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Table</label>
                <input
                  type="text"
                  value={tableInfo.tableNumber}
                  disabled
                  aria-label="Table number"
                  className="mt-1 w-full border border-charcoal/10 rounded-xl px-3 py-2 bg-cream-dark/50 text-charcoal/70"
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-charcoal/10 rounded-[20px] p-6">
            <h2 className="font-display text-2xl">Payment method</h2>
            <div className="mt-4 space-y-3">
              {DINE_IN_METHODS.map((option) => (
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

          <aside className="bg-white border border-charcoal/10 rounded-[20px] p-6">
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
                    <CustomizationLines customization={entry.customization} compact />
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
              storageKey={DINE_IN_COUPON_STORAGE_KEY}
            />
            <RewardsRedeem onRewards={setRewards} />
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
                <span className="font-medium">₹0</span>
              </p>
              <p className="flex justify-between font-display text-xl pt-2">
                <span>Total</span>
                <span className="text-burgundy">{formatPrice(grandTotal)}</span>
              </p>
            </div>
            <button
              type="submit"
              disabled={placing}
              className="mt-6 w-full bg-burgundy text-white rounded-full py-3.5 text-[15px] font-semibold hover:bg-burgundy-dark transition-colors disabled:opacity-50"
            >
              {placing ? "Sending to kitchen..." : "Send Order to Kitchen"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dine-in/cart")}
              className="mt-3 w-full border border-charcoal/20 rounded-full py-3 text-sm font-semibold hover:border-burgundy hover:text-burgundy transition-colors"
            >
              Back to Dine-In Cart
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default DineInCheckout;

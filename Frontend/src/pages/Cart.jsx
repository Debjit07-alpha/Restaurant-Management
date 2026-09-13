import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatPrice";
import { getDeliveryCharge } from "../utils/delivery";
import MenuImage from "../components/MenuImage";
import CustomizationModal from "../components/CustomizationModal";
import CustomizationLines from "../components/CustomizationLines";
import CouponBox from "../components/CouponBox";

function Cart() {
  const navigate = useNavigate();
  const { cartItems, increaseQty, decreaseQty, removeItem, updateCartItem, totalPrice } =
    useCart();
  const [customizeState, setCustomizeState] = useState(null);
  // { key, item (modal-compatible), initial, isEdit }
  // Backend-validated coupon (amounts come from /coupons/validate).
  const [coupon, setCoupon] = useState(null);

  const discount = coupon?.discountAmount || 0;
  const deliveryCharge =
    coupon?.deliveryCharge ?? getDeliveryCharge(totalPrice - discount);
  const grandTotal = totalPrice - discount + deliveryCharge;

  const optionGroupsOf = (entry) =>
    entry.customization?.optionGroups || entry.optionGroups || [];

  // Rebuild a modal-compatible item from the cart line. Groups were snapshotted
  // when the item was added, so both Customize and Edit restore correctly.
  const buildModalItem = (entry) => ({
    _id: entry.id,
    name: entry.name,
    price: entry.customization?.basePrice ?? entry.price,
    image: entry.image,
    category: entry.category,
    availability: true,
    customizationOptions: optionGroupsOf(entry),
  });

  // First-time customization of a plain cart line.
  const openCustomize = (entry) => {
    setCustomizeState({
      key: entry.key,
      item: buildModalItem(entry),
      initial: {
        quantity: entry.quantity,
        selections: [],
        specialInstructions: "",
      },
      isEdit: false,
    });
  };

  // Re-edit an already customized line with selections restored.
  const openEdit = (entry) => {
    setCustomizeState({
      key: entry.key,
      item: buildModalItem(entry),
      initial: {
        quantity: entry.quantity,
        selections: entry.customization?.selections || [],
        specialInstructions:
          entry.customization?.specialInstructions || "",
      },
      isEdit: true,
    });
  };

  const handleCustomizeConfirm = (data) => {
    if (!customizeState) return false;
    const ok = updateCartItem(customizeState.key, {
      ...data,
      menuItem: customizeState.item,
    });
    if (ok) setCustomizeState(null);
    return ok;
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-cream text-charcoal">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center animate-fade-in">
          <span className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-white border border-charcoal/10 shadow-sm">
            <svg className="w-9 h-9 text-charcoal/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </span>
          <h1 className="font-display font-semibold text-4xl mt-6">Your cart is empty</h1>
          <p className="text-charcoal/60 mt-3">
            Looks like you haven&apos;t added anything yet. Let&apos;s fix that.
          </p>
          <Link
            to="/"
            className="inline-block mt-8 bg-burgundy text-white px-10 py-3.5 rounded-[28px] text-[15px] font-semibold hover:bg-burgundy-dark transition-all hover:-translate-y-0.5 shadow-[0_10px_25px_-10px_rgba(217,45,32,0.6)]"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream text-charcoal">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-10 sm:py-14 animate-fade-in">
        <p className="text-[13px] uppercase tracking-[0.25em] text-burgundy font-semibold">
          Your selection
        </p>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-2">Your Cart</h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          {/* Items */}
          <div className="space-y-4">
            {cartItems.map((entry) => (
              <div
                key={entry.key}
                className="bg-white border border-charcoal/10 rounded-[20px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[0_15px_35px_-24px_rgba(23,23,23,0.35)]"
              >
                <div className="w-full sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-cream-dark">
                  <MenuImage
                    src={entry.image}
                    alt={entry.name}
                    className="h-28 w-full sm:w-28 object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-bold truncate">{entry.name}</h3>
                  {entry.category && (
                    <p className="text-xs uppercase tracking-[0.18em] text-charcoal/50 mt-0.5">
                      {entry.category}
                    </p>
                  )}
                  <p className="text-burgundy font-bold mt-1">
                    {formatPrice(entry.price)}
                  </p>
                  <CustomizationLines customization={entry.customization} />
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <div className="flex items-center gap-2 border border-charcoal/15 rounded-full px-1.5 py-1">
                      <button
                        onClick={() => decreaseQty(entry.key)}
                        className="w-7 h-7 rounded-full hover:bg-cream-dark transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-[15px]">
                        {entry.quantity}
                      </span>
                      <button
                        onClick={() => increaseQty(entry.key)}
                        className="w-7 h-7 rounded-full hover:bg-cream-dark transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    {entry.customization ? (
                      <button
                        onClick={() => openEdit(entry)}
                        className="text-sm font-medium text-pine hover:underline underline-offset-2"
                      >
                        Edit
                      </button>
                    ) : (
                      optionGroupsOf(entry).length > 0 && (
                        <button
                          onClick={() => openCustomize(entry)}
                          className="text-sm font-medium text-pine hover:underline underline-offset-2"
                        >
                          Customize
                        </button>
                      )
                    )}
                    <button
                      onClick={() => removeItem(entry.key)}
                      className="text-sm text-charcoal/50 hover:text-burgundy transition-colors ml-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <p className="font-bold text-[17px] sm:text-right whitespace-nowrap">
                  {formatPrice(entry.price * entry.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="bg-white border border-charcoal/10 rounded-[20px] p-6 shadow-[0_15px_35px_-24px_rgba(23,23,23,0.35)] lg:sticky lg:top-24">
            <h2 className="font-display font-semibold text-2xl">Order Summary</h2>
            <div className="mt-4 space-y-2.5 text-[15px]">
              <p className="flex justify-between">
                <span className="text-charcoal/60">Subtotal</span>
                <span className="font-semibold">{formatPrice(totalPrice)}</span>
              </p>
              {discount > 0 && (
                <p className="flex justify-between text-pine">
                  <span>Discount{coupon?.couponCode ? ` (${coupon.couponCode})` : ""}</span>
                  <span className="font-semibold">-{formatPrice(discount)}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span className="text-charcoal/60">Delivery</span>
                <span className="font-semibold">
                  {deliveryCharge === 0 ? "Free" : formatPrice(deliveryCharge)}
                </span>
              </p>
              {deliveryCharge > 0 && (
                <p className="text-xs text-charcoal/50">
                  Free delivery on orders above {formatPrice(499)}.
                </p>
              )}
              <p className="flex justify-between font-display text-[22px] font-semibold pt-3 border-t border-charcoal/10">
                <span>Total</span>
                <span className="text-burgundy">{formatPrice(grandTotal)}</span>
              </p>
            </div>
            <CouponBox cartItems={cartItems} onCoupon={setCoupon} />
            <button
              onClick={() => navigate("/checkout")}
              className="mt-6 w-full bg-burgundy text-white rounded-[28px] h-[52px] text-[15px] font-semibold hover:bg-burgundy-dark transition-all hover:-translate-y-0.5 shadow-[0_10px_25px_-10px_rgba(217,45,32,0.6)]"
            >
              Proceed to Checkout
            </button>
            <Link
              to="/"
              className="block text-center mt-3 border border-charcoal/20 rounded-[28px] h-[52px] leading-[52px] text-[15px] font-semibold hover:border-burgundy hover:text-burgundy transition-colors"
            >
              Continue Browsing
            </Link>
          </aside>
        </div>
      </div>
      {customizeState && (
        <CustomizationModal
          item={customizeState.item}
          mode="edit"
          initial={customizeState.initial}
          onClose={() => setCustomizeState(null)}
          onConfirm={handleCustomizeConfirm}
        />
      )}
    </div>
  );
}

export default Cart;

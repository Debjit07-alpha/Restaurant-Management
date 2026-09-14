import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDineInCart } from "../context/DineInCartContext";
import { formatPrice } from "../utils/formatPrice";
import MenuImage from "../components/MenuImage";
import CustomizationModal from "../components/CustomizationModal";
import CustomizationLines from "../components/CustomizationLines";

function DineInCart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    increaseQty,
    decreaseQty,
    removeItem,
    updateCartItem,
    totalPrice,
    tableInfo,
  } = useDineInCart();
  const [customizeState, setCustomizeState] = useState(null);

  const optionGroupsOf = (entry) =>
    entry.customization?.optionGroups || entry.optionGroups || [];

  const buildModalItem = (entry) => ({
    _id: entry.id,
    name: entry.name,
    price: entry.customization?.basePrice ?? entry.price,
    image: entry.image,
    category: entry.category,
    availability: true,
    customizationOptions: optionGroupsOf(entry),
  });

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

  const openEdit = (entry) => {
    setCustomizeState({
      key: entry.key,
      item: buildModalItem(entry),
      initial: {
        quantity: entry.quantity,
        selections: entry.customization?.selections || [],
        specialInstructions: entry.customization?.specialInstructions || "",
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

  const backToTable = tableInfo?.tableNumber
    ? `/dine-in/${tableInfo.tableNumber}?token=${tableInfo.qrToken || ""}`
    : "/";

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

  if (cartItems.length === 0) {
    return (
      <div className="bg-cream text-charcoal min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <h1 className="font-display font-semibold text-4xl">
            Dine-In Cart · Table {tableInfo.tableNumber}
          </h1>
          <p className="text-charcoal/60 mt-3">Your tray is empty.</p>
          <Link
            to={backToTable}
            className="inline-block mt-6 bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <p className="text-[13px] uppercase tracking-[0.25em] text-burgundy font-semibold">
          Dine-in · Table {tableInfo.tableNumber}
        </p>
        <h1 className="font-display font-semibold text-4xl mt-2">Dine-In Cart</h1>

        <div className="mt-6 space-y-4">
          {cartItems.map((entry) => (
            <div
              key={entry.key}
              className="bg-white border border-charcoal/10 rounded-[20px] p-4 flex items-center gap-4"
            >
              <div className="w-16 h-16 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
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
                <div className="mt-1.5 flex items-center gap-2.5">
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
              <p className="font-medium whitespace-nowrap">
                {formatPrice(entry.price * entry.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-white border border-charcoal/10 rounded-[20px] p-6 text-sm space-y-2">
          <p className="flex justify-between">
            <span className="text-charcoal/60">Subtotal</span>
            <span className="font-medium">{formatPrice(totalPrice)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-charcoal/60">Delivery</span>
            <span className="font-medium">₹0</span>
          </p>
          <p className="flex justify-between font-display text-xl pt-2">
            <span>Total</span>
            <span className="text-burgundy">{formatPrice(totalPrice)}</span>
          </p>
        </div>

        {!isAuthenticated && (
          <p className="mt-4 text-sm text-charcoal/60 text-center">
            Please log in to send your order to the kitchen.
          </p>
        )}
        <button
          onClick={() =>
            navigate(isAuthenticated ? "/dine-in/checkout" : "/login", {
              state: isAuthenticated ? undefined : { returnTo: "/dine-in/checkout" },
            })
          }
          className="mt-4 w-full bg-burgundy text-white rounded-full py-3.5 text-[15px] font-semibold hover:bg-burgundy-dark transition-colors"
        >
          {isAuthenticated ? "Proceed to Dine-In Checkout" : "Login to Order"}
        </button>
        <Link
          to={backToTable}
          className="block text-center mt-3 text-sm font-semibold hover:text-burgundy transition-colors"
        >
          ← Back to menu
        </Link>
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

export default DineInCart;

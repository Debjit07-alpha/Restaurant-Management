import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatPrice";
import { getDeliveryCharge } from "../utils/delivery";
import MenuImage from "../components/MenuImage";

function Cart() {
  const navigate = useNavigate();
  const { cartItems, increaseQty, decreaseQty, removeItem, totalPrice } =
    useCart();

  const deliveryCharge = getDeliveryCharge(totalPrice);
  const grandTotal = totalPrice + deliveryCharge;

  if (cartItems.length === 0) {
    return (
      <div className="bg-cream text-charcoal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="font-display text-4xl">Your Cart</h1>
          <p className="text-charcoal/60 mt-4">Your cart is empty.</p>
          <Link
            to="/"
            className="inline-block mt-6 bg-charcoal text-cream px-8 py-3 rounded-full text-sm hover:bg-burgundy transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream text-charcoal">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-sm uppercase tracking-[0.25em] text-burgundy">
          Your selection
        </p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2">Your Cart</h1>

        <div className="mt-8 space-y-4">
          {cartItems.map((entry) => (
            <div
              key={entry.id}
              className="bg-cream border border-charcoal/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="w-full sm:w-24 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                <MenuImage
                  src={entry.image}
                  alt={entry.name}
                  className="h-24 w-full sm:w-24 object-cover"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-display text-xl">{entry.name}</h3>
                {entry.category && (
                  <p className="text-xs uppercase tracking-[0.2em] text-charcoal/50 mt-0.5">
                    {entry.category}
                  </p>
                )}
                <p className="text-burgundy font-medium mt-1">
                  {formatPrice(entry.price)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm">Quantity:</span>
                  <button
                    onClick={() => decreaseQty(entry.id)}
                    className="w-7 h-7 border border-charcoal/20 rounded-full hover:border-burgundy hover:text-burgundy"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-semibold">
                    {entry.quantity}
                  </span>
                  <button
                    onClick={() => increaseQty(entry.id)}
                    className="w-7 h-7 border border-charcoal/20 rounded-full hover:border-burgundy hover:text-burgundy"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                <p className="font-medium">
                  Subtotal: {formatPrice(entry.price * entry.quantity)}
                </p>
                <button
                  onClick={() => removeItem(entry.id)}
                  className="text-sm text-burgundy hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-cream border border-charcoal/10 rounded-2xl p-6">
          <div className="space-y-2 text-sm">
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
            {deliveryCharge > 0 && (
              <p className="text-xs text-charcoal/50">
                Free delivery on orders above {formatPrice(499)}.
              </p>
            )}
            <p className="flex justify-between font-display text-xl pt-2 border-t border-charcoal/10">
              <span>Grand Total</span>
              <span className="text-burgundy">{formatPrice(grandTotal)}</span>
            </p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/checkout")}
              className="flex-1 bg-charcoal text-cream rounded-full py-3 text-sm hover:bg-burgundy transition-colors"
            >
              Proceed to Order
            </button>
            <Link
              to="/"
              className="flex-1 text-center border border-charcoal/20 rounded-full py-3 text-sm hover:border-burgundy hover:text-burgundy transition-colors"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;

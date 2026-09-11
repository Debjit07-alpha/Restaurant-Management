import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "tastybites_cart";

const loadCart = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadCart);

  // Persist cart so refresh/navigation does not clear it
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Add a menu item; same item increases quantity instead of duplicating.
  // Out of Stock items can never be added.
  const addItem = (menuItem, quantity = 1) => {
    if (!menuItem || !menuItem.availability) return false;

    const id = menuItem._id;
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.id === id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === id
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry
        );
      }
      return [
        ...prev,
        {
          id,
          name: menuItem.name,
          category: menuItem.category || "",
          price: Number(menuItem.price) || 0,
          image: menuItem.image || "",
          quantity,
        },
      ];
    });
    return true;
  };

  const increaseQty = (id) => {
    setCartItems((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, quantity: entry.quantity + 1 } : entry
      )
    );
  };

  const decreaseQty = (id) => {
    setCartItems((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, quantity: Math.max(1, entry.quantity - 1) }
          : entry
      )
    );
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((entry) => entry.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalQuantity = cartItems.reduce(
    (sum, entry) => sum + entry.quantity,
    0
  );

  const totalPrice = cartItems.reduce(
    (sum, entry) => sum + entry.price * entry.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        increaseQty,
        decreaseQty,
        removeItem,
        clearCart,
        totalQuantity,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

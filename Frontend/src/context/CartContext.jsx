import { createContext, useContext, useEffect, useState } from "react";
import {
  buildConfigKey,
  getCustomizationOptions,
} from "../utils/customization";

const CartContext = createContext(null);
const STORAGE_KEY = "tastybites_cart";

const loadCart = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    // Normalize legacy entries (saved before cart keys existed).
    return parsed
      .filter((entry) => entry && entry.id)
      .map((entry) => ({
        ...entry,
        key: entry.key || entry.id,
        customization: entry.customization || null,
      }));
  } catch {
    return [];
  }
};

// Entries are matched by `key`: plain items use the product id, customized
// items use product + selections + instructions, so different
// configurations never merge while identical ones do.
const findIndexByKey = (items, keyOrId) => {
  const byKey = items.findIndex((entry) => entry.key === keyOrId);
  if (byKey !== -1) return byKey;
  return items.findIndex((entry) => entry.id === keyOrId);
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
      const existing = prev.find(
        (entry) => entry.key === id && !entry.customization
      );
      if (existing) {
        return prev.map((entry) =>
          entry.key === id && !entry.customization
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry
        );
      }
      return [
        ...prev,
        {
          key: id,
          id,
          name: menuItem.name,
          category: menuItem.category || "",
          price: Number(menuItem.price) || 0,
          image: menuItem.image || "",
          quantity,
          customization: null,
          // Groups snapshot so Cart -> Customize can open the modal later.
          optionGroups: getCustomizationOptions(menuItem),
        },
      ];
    });
    return true;
  };

  // Add a customized configuration. Identical configurations merge;
  // different ones stay as separate lines.
  const addCustomizedItem = (
    menuItem,
    { quantity = 1, selections = [], specialInstructions = "", unitPrice }
  ) => {
    if (!menuItem || !menuItem.availability) return false;
    const qty = Number(quantity) || 1;
    if (qty < 1) return false;

    const basePrice = Number(menuItem.price) || 0;
    const unit = unitPrice === undefined ? basePrice : Number(unitPrice) || 0;
    const instructions = String(specialInstructions || "");
    const key = buildConfigKey(menuItem._id, selections, instructions);
    const customization = {
      basePrice,
      unitPrice: unit,
      selections: selections || [],
      specialInstructions: instructions,
      // Groups snapshot so the cart Edit flow can reopen the modal
      // without refetching (backend revalidates at order time).
      optionGroups: getCustomizationOptions(menuItem),
    };

    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.key === key);
      if (existing) {
        return prev.map((entry) =>
          entry.key === key
            ? { ...entry, quantity: entry.quantity + qty }
            : entry
        );
      }
      return [
        ...prev,
        {
          key,
          id: menuItem._id,
          name: menuItem.name,
          category: menuItem.category || "",
          price: unit,
          image: menuItem.image || "",
          quantity: qty,
          customization,
        },
      ];
    });
    return true;
  };

  // Replace one cart line (cart Edit flow). If the new configuration matches
  // another line, quantities merge into it instead of duplicating.
  const updateCartItem = (
    key,
    { quantity = 1, selections = [], specialInstructions = "", unitPrice, menuItem }
  ) => {
    const qty = Number(quantity) || 1;
    if (qty < 1) return false;

    let ok = false;
    setCartItems((prev) => {
      const index = prev.findIndex((entry) => entry.key === key);
      if (index === -1) return prev;
      const current = prev[index];
      const source = menuItem || {
        _id: current.id,
        name: current.name,
        category: current.category,
        price: current.customization?.basePrice ?? current.price,
        image: current.image,
      };
      if (source.availability === false) return prev;

      const basePrice =
        Number(source.price) || current.customization?.basePrice || 0;
      const unit = unitPrice === undefined ? basePrice : Number(unitPrice) || 0;
      const instructions = String(specialInstructions || "");
      const nextKey = buildConfigKey(source._id || current.id, selections, instructions);

      const without = prev.filter((entry) => entry.key !== key);
      const collision = without.find((entry) => entry.key === nextKey);
      if (collision) {
        ok = true;
        return without.map((entry) =>
          entry.key === nextKey
            ? { ...entry, quantity: entry.quantity + qty }
            : entry
        );
      }
      ok = true;
      const next = [...without];
      next.splice(Math.min(index, next.length), 0, {
        ...current,
        key: nextKey,
        price: unit,
        quantity: qty,
        customization: {
          basePrice,
          unitPrice: unit,
          selections: selections || [],
          specialInstructions: instructions,
          optionGroups:
            getCustomizationOptions(source).length > 0
              ? getCustomizationOptions(source)
              : current.customization?.optionGroups ||
                current.optionGroups ||
                [],
        },
      });
      return next;
    });
    return ok;
  };

  const increaseQty = (keyOrId) => {
    setCartItems((prev) => {
      const index = findIndexByKey(prev, keyOrId);
      if (index === -1) return prev;
      return prev.map((entry, i) =>
        i === index ? { ...entry, quantity: entry.quantity + 1 } : entry
      );
    });
  };

  const decreaseQty = (keyOrId) => {
    setCartItems((prev) => {
      const index = findIndexByKey(prev, keyOrId);
      if (index === -1) return prev;
      return prev.map((entry, i) =>
        i === index
          ? { ...entry, quantity: Math.max(1, entry.quantity - 1) }
          : entry
      );
    });
  };

  const removeItem = (keyOrId) => {
    setCartItems((prev) =>
      prev.filter(
        (_, i) => i !== findIndexByKey(prev, keyOrId)
      )
    );
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
        addCustomizedItem,
        updateCartItem,
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

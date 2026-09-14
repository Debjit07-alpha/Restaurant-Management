import { createContext, useContext, useEffect, useState } from "react";
import {
  buildConfigKey,
  getCustomizationOptions,
} from "../utils/customization";
import {
  isOrderable,
  resolveAvailabilityStatus,
} from "../utils/availability";

// Separate dine-in cart: same line semantics as the delivery cart but a
// different storage slot plus the active table/session. The delivery
// cart implementation is intentionally untouched.
const DineInCartContext = createContext(null);
const STORAGE_KEY = "tastybites_dinein_cart";
const TABLE_STORAGE_KEY = "tastybites_dinein_table";

const loadCart = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
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

const loadTable = () => {
  try {
    const stored = localStorage.getItem(TABLE_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    if (!parsed || !parsed.tableNumber || !parsed.qrToken) return null;
    return parsed;
  } catch {
    return null;
  }
};

const findIndexByKey = (items, keyOrId) => {
  const byKey = items.findIndex((entry) => entry.key === keyOrId);
  if (byKey !== -1) return byKey;
  return items.findIndex((entry) => entry.id === keyOrId);
};

export function DineInCartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadCart);
  const [tableInfo, setTableInfo] = useState(loadTable);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (tableInfo) {
      localStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(tableInfo));
    } else {
      localStorage.removeItem(TABLE_STORAGE_KEY);
    }
  }, [tableInfo]);

  // Switch tables: a different table starts with an empty tray.
  const setTable = (info) => {
    setTableInfo((prev) => {
      if (prev && info && prev.tableNumber === info.tableNumber) {
        return { ...prev, ...info };
      }
      setCartItems([]);
      return info;
    });
  };

  const clearTable = () => {
    setTableInfo(null);
    setCartItems([]);
  };

  const addItem = (menuItem, quantity = 1) => {
    if (!menuItem || !isOrderable(menuItem)) return false;

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
          availabilityStatus: resolveAvailabilityStatus(menuItem),
          optionGroups: getCustomizationOptions(menuItem),
        },
      ];
    });
    return true;
  };

  const addCustomizedItem = (
    menuItem,
    { quantity = 1, selections = [], specialInstructions = "", unitPrice }
  ) => {
    if (!menuItem || !isOrderable(menuItem)) return false;
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
          availabilityStatus: resolveAvailabilityStatus(menuItem),
        },
      ];
    });
    return true;
  };

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
      if (
        !isOrderable({
          availabilityStatus: current.availabilityStatus,
          availability: source.availability,
        })
      ) {
        return prev;
      }

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
      prev.filter((_, i) => i !== findIndexByKey(prev, keyOrId))
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
    <DineInCartContext.Provider
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
        tableInfo,
        setTable,
        clearTable,
      }}
    >
      {children}
    </DineInCartContext.Provider>
  );
}

export function useDineInCart() {
  return useContext(DineInCartContext);
}

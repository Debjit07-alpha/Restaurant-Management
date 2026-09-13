import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "../utils/formatPrice";
import {
  MAX_INSTRUCTIONS_LENGTH,
  calcUnitPrice,
  defaultSelections,
  getCustomizationOptions,
} from "../utils/customization";
import MenuImage from "./MenuImage";

// Customization modal for a food item. Driven entirely by the item's own
// `customizationOptions` (DB): single-choice groups render as radios,
// multi-choice groups as checkboxes, plus quantity and special instructions.
// Calls onConfirm({ selections, specialInstructions, quantity, unitPrice });
// shows an error when the cart reports failure.
function CustomizationModal({ item, initial, onClose, onConfirm, mode = "add" }) {
  const groups = useMemo(() => getCustomizationOptions(item), [item]);

  const [selected, setSelected] = useState(() => {
    const map = {};
    const seed = initial?.selections?.length
      ? initial.selections
      : defaultSelections(groups);
    for (const sel of seed) {
      map[sel.group] = (sel.choices || []).map((c) => c.name);
    }
    return map;
  });
  const [quantity, setQuantity] = useState(
    Math.max(1, Number(initial?.quantity) || 1)
  );
  const [instructions, setInstructions] = useState(
    String(initial?.specialInstructions || "").slice(0, MAX_INSTRUCTIONS_LENGTH)
  );
  const [error, setError] = useState("");

  // Lock background scroll while the modal is open; close on Escape.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const selections = useMemo(
    () =>
      groups.map((group) => ({
        group: group.name,
        choices: (selected[group.name] || [])
          .map((name) => group.options.find((o) => o.name === name))
          .filter(Boolean)
          .map((opt) => ({ name: opt.name, price: Number(opt.price) || 0 })),
      })),
    [groups, selected]
  );

  const missingRequired = groups.filter(
    (group) =>
      group.required && (selected[group.name] || []).length === 0
  );

  const unitPrice = calcUnitPrice(item.price, selections);
  const total = unitPrice * quantity;

  const toggleSingle = (groupName, optionName) => {
    setSelected((prev) => ({ ...prev, [groupName]: [optionName] }));
  };

  const toggleMultiple = (groupName, optionName) => {
    setSelected((prev) => {
      const current = prev[groupName] || [];
      return {
        ...prev,
        [groupName]: current.includes(optionName)
          ? current.filter((n) => n !== optionName)
          : [...current, optionName],
      };
    });
  };

  const handleConfirm = () => {
    setError("");
    if (missingRequired.length > 0) {
      setError(
        `Please choose ${missingRequired.map((g) => g.name).join(", ")}.`
      );
      return;
    }
    const ok = onConfirm({
      selections,
      specialInstructions: instructions.trim(),
      quantity,
      unitPrice,
    });
    if (!ok) {
      setError("Unable to add item to cart. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Customize ${item.name}`}
    >
      <button
        aria-label="Close customization"
        onClick={onClose}
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-[2px] cursor-default"
      />
      <div className="relative w-full sm:max-w-lg bg-cream text-charcoal rounded-t-[24px] sm:rounded-[24px] border border-charcoal/10 shadow-[0_25px_60px_-20px_rgba(23,23,23,0.5)] max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-start gap-4 p-5 sm:p-6 pb-4">
          <div className="w-16 h-16 shrink-0 overflow-hidden rounded-2xl bg-cream-dark">
            <MenuImage
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold text-2xl leading-tight truncate">
              {item.name}
            </h2>
            <p className="text-sm text-charcoal/60 mt-0.5">
              Base price{" "}
              <span className="font-semibold text-charcoal">
                {formatPrice(item.price)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-9 h-9 rounded-full bg-white border border-charcoal/10 flex items-center justify-center hover:border-burgundy hover:text-burgundy transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4 space-y-5">
          {groups.map((group) => (
            <fieldset key={group.name}>
              <legend className="text-sm font-bold">
                {group.name}
                {group.required && (
                  <span className="ml-1.5 text-xs font-medium text-burgundy">
                    Required
                  </span>
                )}
              </legend>
              <div className="mt-2 space-y-2">
                {group.options.map((opt) => {
                  const checked = (selected[group.name] || []).includes(
                    opt.name
                  );
                  const inputId = `${item._id}-${group.name}-${opt.name}`;
                  return (
                    <label
                      key={opt.name}
                      htmlFor={inputId}
                      className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-3 cursor-pointer transition-colors ${
                        checked
                          ? "border-pine/60 shadow-[0_8px_20px_-12px_rgba(23,23,23,0.5)]"
                          : "border-charcoal/10 hover:border-charcoal/25"
                      }`}
                    >
                      <input
                        id={inputId}
                        type={group.type === "multiple" ? "checkbox" : "radio"}
                        name={`${item._id}-${group.name}`}
                        checked={checked}
                        onChange={() =>
                          group.type === "multiple"
                            ? toggleMultiple(group.name, opt.name)
                            : toggleSingle(group.name, opt.name)
                        }
                        className="w-4 h-4 accent-[#9c2b2e]"
                      />
                      <span className="flex-1 text-[15px] font-medium">
                        {opt.name}
                      </span>
                      <span className="text-sm font-semibold text-charcoal/60">
                        {Number(opt.price) > 0
                          ? `+${formatPrice(opt.price)}`
                          : "Included"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {/* Quantity */}
          <div>
            <p className="text-sm font-bold">Quantity</p>
            <div className="mt-2 inline-flex items-center gap-3 bg-white border border-charcoal/10 rounded-full px-2 py-1.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-full hover:bg-cream-dark transition-colors text-lg disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span
                aria-live="polite"
                className="w-8 text-center font-bold tabular-nums"
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="w-8 h-8 rounded-full hover:bg-cream-dark transition-colors text-lg"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Special instructions */}
          <div>
            <label
              htmlFor={`instructions-${item._id}`}
              className="text-sm font-bold"
            >
              Special Instructions{" "}
              <span className="font-medium text-charcoal/50">(optional)</span>
            </label>
            <textarea
              id={`instructions-${item._id}`}
              value={instructions}
              onChange={(e) =>
                setInstructions(
                  e.target.value.slice(0, MAX_INSTRUCTIONS_LENGTH)
                )
              }
              maxLength={MAX_INSTRUCTIONS_LENGTH}
              rows={2}
              placeholder="Less spicy, please…"
              className="mt-2 w-full bg-white border border-charcoal/15 rounded-2xl px-4 py-3 text-[15px] placeholder:text-charcoal/35 focus:outline-none focus:border-burgundy resize-none"
            />
          </div>

          {error && (
            <p role="alert" className="bg-red-100 text-red-700 text-sm p-3 rounded-xl">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-charcoal/10 bg-cream px-5 sm:px-6 py-4 flex items-center gap-4 sticky bottom-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-charcoal/50">
              Total
            </p>
            <p className="font-display font-semibold text-2xl text-burgundy leading-tight">
              {formatPrice(total)}
            </p>
          </div>
          <button
            onClick={handleConfirm}
            disabled={missingRequired.length > 0}
            className="shrink-0 bg-burgundy text-white rounded-[28px] h-[52px] px-8 text-[15px] font-semibold hover:bg-burgundy-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_10px_25px_-10px_rgba(217,45,32,0.6)]"
          >
            {mode === "edit" ? "Save Changes" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomizationModal;

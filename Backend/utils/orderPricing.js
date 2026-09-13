// Single source of truth for order pricing shared by orders and
// coupons. The backend always reprices from MongoDB menu prices;
// frontend totals are never trusted.

const FREE_DELIVERY_ABOVE = 499;
const DELIVERY_CHARGE = 40;
const MAX_INSTRUCTIONS_LENGTH = 200;

// Delivery is computed on the payable subtotal (after discount).
const getDeliveryCharge = (payableSubtotal) => {
  if (!payableSubtotal || payableSubtotal <= 0) return 0;
  return payableSubtotal > FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
};

// Validate a cart entry's customization against the menu item's own
// options (prices always come from the database, never the frontend).
// Returns { unitExtras, snapshot } or throws with a user-facing message.
const resolveCustomization = (menuItem, customization) => {
  if (customization === undefined || customization === null) {
    return { unitExtras: 0, snapshot: undefined };
  }

  const groups = Array.isArray(menuItem.customizationOptions)
    ? menuItem.customizationOptions
    : [];
  const selections = Array.isArray(customization.selections)
    ? customization.selections
    : [];

  if (selections.length === 0 && !customization.specialInstructions) {
    return { unitExtras: 0, snapshot: undefined };
  }

  if (groups.length === 0) {
    throw new Error(`${menuItem.name} does not support customization`);
  }

  const seen = new Set();
  let unitExtras = 0;
  const snapshotSelections = [];

  for (const sel of selections) {
    const group = groups.find((g) => g.name === sel?.group);
    if (!group) {
      throw new Error(`Invalid customization option for ${menuItem.name}`);
    }
    if (seen.has(group.name)) {
      throw new Error(`Duplicate customization option for ${menuItem.name}`);
    }
    seen.add(group.name);

    const names = Array.isArray(sel.choices) ? sel.choices : [];
    if (group.type !== "multiple" && names.length > 1) {
      throw new Error(`Choose only one option for "${group.name}"`);
    }
    if (group.required && names.length === 0) {
      throw new Error(`"${group.name}" selection is required`);
    }

    const choices = [];
    for (const name of names) {
      const option = (group.options || []).find((o) => o.name === name);
      if (!option) {
        throw new Error(`Invalid customization option for ${menuItem.name}`);
      }
      unitExtras += Number(option.price) || 0;
      choices.push({ name: option.name, price: Number(option.price) || 0 });
    }
    snapshotSelections.push({ group: group.name, choices });
  }

  // Required groups the customer skipped entirely.
  for (const group of groups) {
    if (group.required && !seen.has(group.name)) {
      throw new Error(`"${group.name}" selection is required`);
    }
  }

  let specialInstructions = "";
  if (customization.specialInstructions !== undefined) {
    specialInstructions = String(customization.specialInstructions).slice(
      0,
      MAX_INSTRUCTIONS_LENGTH
    );
  }

  if (snapshotSelections.length === 0 && !specialInstructions) {
    return { unitExtras: 0, snapshot: undefined };
  }

  return {
    unitExtras,
    snapshot: { selections: snapshotSelections, specialInstructions }
  };
};

module.exports = {
  FREE_DELIVERY_ABOVE,
  DELIVERY_CHARGE,
  MAX_INSTRUCTIONS_LENGTH,
  getDeliveryCharge,
  resolveCustomization
};

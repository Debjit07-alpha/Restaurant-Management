// Helpers for food customization (add-ons). Data-driven: everything comes
// from the menu item's own `customizationOptions` (DB); items without
// options keep the existing one-click Add to Cart behavior.

export const MAX_INSTRUCTIONS_LENGTH = 200;

// Groups defined on the item, or [] when the item is not customizable.
export function getCustomizationOptions(item) {
  const groups = item?.customizationOptions;
  return Array.isArray(groups) ? groups : [];
}

export function isCustomizable(item) {
  return getCustomizationOptions(item).length > 0;
}

// selections: [{ group, choices: [{ name, price }] }]
export function calcUnitPrice(basePrice, selections) {
  const extras = (selections || []).reduce(
    (sum, sel) =>
      sum +
      (sel.choices || []).reduce((s, c) => s + (Number(c.price) || 0), 0),
    0
  );
  return (Number(basePrice) || 0) + extras;
}

// Stable identity for a cart configuration: same product + same selections
// + same instructions => same key (merge); anything different => separate.
export function buildConfigKey(itemId, selections, specialInstructions = "") {
  const normalized = (selections || [])
    .map((sel) => ({
      group: sel.group,
      choices: (sel.choices || []).map((c) => c.name).sort(),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
  return `${itemId}::${JSON.stringify(normalized)}::${String(
    specialInstructions || ""
  )}`;
}

// Default selection state: required single groups preselect their first
// option; everything else starts empty. Used for both add and edit flows
// (edit passes its saved selections instead).
export function defaultSelections(groups) {
  return (groups || [])
    .map((group) => {
      const choiceNames =
        group.type !== "multiple" && group.required && group.options?.length
          ? [group.options[0].name]
          : [];
      return {
        group: group.name,
        choices: choiceNames.map((name) => {
          const opt = group.options.find((o) => o.name === name);
          return { name, price: Number(opt?.price) || 0 };
        }),
      };
    })
    .filter((sel) => sel.choices.length > 0);
}

// Names-only payload for the order API (backend re-prices from the DB).
export function toOrderCustomization(selections, specialInstructions) {
  return {
    selections: (selections || []).map((sel) => ({
      group: sel.group,
      choices: (sel.choices || []).map((c) => c.name),
    })),
    specialInstructions: String(specialInstructions || ""),
  };
}

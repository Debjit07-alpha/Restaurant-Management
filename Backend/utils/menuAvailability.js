// Single source of truth for menu-item availability. The legacy
// `availability` boolean stays synced (available -> true, otherwise
// false); this helper resolves the effective three-state status for
// any document, including ones written before availabilityStatus.

const STATUSES = ["available", "sold_out", "hidden"];

const resolveStatus = (menuItem) => {
  if (
    menuItem &&
    typeof menuItem.availabilityStatus === "string" &&
    STATUSES.includes(menuItem.availabilityStatus)
  ) {
    return menuItem.availabilityStatus;
  }
  // Backward compatible: old documents only carry the boolean.
  if (menuItem && menuItem.availability === false) return "sold_out";
  return "available";
};

const isOrderable = (menuItem) => resolveStatus(menuItem) === "available";

const parseStatus = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return STATUSES.includes(normalized) ? normalized : null;
};

const unavailableMessage = (menuItem) => {
  const status = resolveStatus(menuItem);
  if (status === "sold_out") {
    return `${menuItem.name} is currently sold out.`;
  }
  return `${menuItem.name} is currently unavailable.`;
};

module.exports = {
  STATUSES,
  resolveStatus,
  isOrderable,
  parseStatus,
  unavailableMessage
};

// Customer-side mirror of the backend availability rules.
// Resolves the effective status for any menu/cart object, including
// documents written before availabilityStatus existed.

export const AVAILABILITY = {
  AVAILABLE: "available",
  SOLD_OUT: "sold_out",
  HIDDEN: "hidden",
};

export const AVAILABILITY_META = {
  available: { label: "Available", dot: "🟢" },
  sold_out: { label: "Sold Out", dot: "🔴" },
  hidden: { label: "Hidden", dot: "⚪" },
};

export function resolveAvailabilityStatus(item) {
  const status = item?.availabilityStatus;
  if (
    status === AVAILABILITY.AVAILABLE ||
    status === AVAILABILITY.SOLD_OUT ||
    status === AVAILABILITY.HIDDEN
  ) {
    return status;
  }
  // Backward compatible with the legacy boolean field.
  if (item?.availability === false) return AVAILABILITY.SOLD_OUT;
  return AVAILABILITY.AVAILABLE;
}

export function isOrderable(item) {
  return resolveAvailabilityStatus(item) === AVAILABILITY.AVAILABLE;
}

export function isSoldOut(item) {
  return resolveAvailabilityStatus(item) === AVAILABILITY.SOLD_OUT;
}

export function isHidden(item) {
  return resolveAvailabilityStatus(item) === AVAILABILITY.HIDDEN;
}

export function availabilityLabel(item) {
  return AVAILABILITY_META[resolveAvailabilityStatus(item)].label;
}

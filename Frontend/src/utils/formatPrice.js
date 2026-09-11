export function formatPrice(price) {
  const value = Number(price);
  if (Number.isNaN(value)) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

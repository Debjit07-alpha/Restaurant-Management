// Reference category labels with keyword matchers against the REAL menu.
// The backend enum only has Starter/Main Course/Dessert/Beverage, so each
// circle matches items by name/description/category keywords. "All" shows
// everything. Unknown items simply appear under "All" (and any circle whose
// keywords they happen to match) — nothing is ever hardcoded as a dish.
export const CATEGORY_TABS = [
  { label: "All", value: "All", keywords: [] },
  { label: "Pizza", value: "Pizza", keywords: ["pizza"] },
  { label: "Burgers", value: "Burgers", keywords: ["burger"] },
  {
    label: "Indian",
    value: "Indian",
    keywords: [
      "indian", "tikka", "masala", "curry", "biryani", "paneer", "dal",
      "makhni", "chole", "kebab", "tandoori", "butter chicken", "dosa",
      "samosa", "thali",
    ],
  },
  {
    label: "Chinese",
    value: "Chinese",
    keywords: [
      "chinese", "noodle", "hakka", "manchurian", "schezwan", "szechwan",
      "fried rice", "chilli chicken", "spring roll",
    ],
  },
  {
    label: "Desserts",
    value: "Desserts",
    keywords: [
      "dessert", "cake", "lava", "brownie", "ice cream", "gulab",
      "kheer", "pastry", "sweet", "pudding", "mousse",
    ],
  },
  {
    label: "Drinks",
    value: "Drinks",
    keywords: [
      "drink", "beverage", "juice", "shake", "lassi", "coffee", "tea",
      "cola", "soda", "mocktail", "smoothie", "cold drink",
    ],
  },
  {
    label: "Healthy",
    value: "Healthy",
    keywords: [
      "healthy", "salad", "grill", "oats", "soup", "sprouts", "quinoa",
      "diet", "low fat",
    ],
  },
];

export function matchesCategory(item, value) {
  if (!value || value === "All") return true;
  const tab = CATEGORY_TABS.find((t) => t.value === value);
  if (!tab) return true;
  const haystack =
    `${item?.name || ""} ${item?.description || ""} ${item?.category || ""}`.toLowerCase();
  return tab.keywords.some((keyword) => haystack.includes(keyword));
}

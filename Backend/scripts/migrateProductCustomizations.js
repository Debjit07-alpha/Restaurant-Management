// Product-specific customization migration (deterministic, data-driven).
// Replaces the old one-size-fits-all seed with per-product configurations
// derived from each item's name/category. No AI, no external API.
//
// Rules:
// - Items already customized by an admin (options that are NOT the old
//   generic seed and NOT empty) are left untouched.
// - Everything else gets the configuration matching its product type.
// Run: node scripts/migrateProductCustomizations.js
require("dotenv").config();
const connectDB = require("../config/db");
const MenuItem = require("../models/MenuItem");

const SPICE = {
  name: "Spice Level",
  type: "single",
  required: true,
  options: [
    { name: "Mild", price: 0 },
    { name: "Medium", price: 0 },
    { name: "Spicy", price: 0 },
  ],
};

const CONFIGS = {
  biryani: [
    SPICE,
    {
      name: "Rice Portion",
      type: "single",
      required: true,
      options: [
        { name: "Regular", price: 0 },
        { name: "Extra Rice", price: 60 },
      ],
    },
    {
      name: "Add-ons",
      type: "multiple",
      required: false,
      options: [
        { name: "Extra Meat", price: 120 },
        { name: "Raita", price: 30 },
        { name: "Salad", price: 20 },
      ],
    },
  ],
  pizza: [
    {
      name: "Size",
      type: "single",
      required: true,
      options: [
        { name: "Small", price: 0 },
        { name: "Medium", price: 100 },
        { name: "Large", price: 200 },
      ],
    },
    {
      name: "Crust",
      type: "single",
      required: true,
      options: [
        { name: "Regular", price: 0 },
        { name: "Thin Crust", price: 50 },
        { name: "Cheese Burst", price: 80 },
      ],
    },
    {
      name: "Extra Toppings",
      type: "multiple",
      required: false,
      options: [
        { name: "Extra Cheese", price: 60 },
        { name: "Olives", price: 40 },
        { name: "Jalapeno", price: 40 },
        { name: "Mushroom", price: 50 },
      ],
    },
  ],
  burger: [
    {
      name: "Size",
      type: "single",
      required: true,
      options: [
        { name: "Regular", price: 0 },
        { name: "Large", price: 80 },
      ],
    },
    {
      name: "Patty",
      type: "single",
      required: true,
      options: [
        { name: "Single", price: 0 },
        { name: "Double", price: 100 },
      ],
    },
    {
      name: "Cheese",
      type: "single",
      required: false,
      options: [
        { name: "No Cheese", price: 0 },
        { name: "Cheddar", price: 50 },
        { name: "Mozzarella", price: 60 },
      ],
    },
    {
      name: "Add-ons",
      type: "multiple",
      required: false,
      options: [
        { name: "Extra Sauce", price: 20 },
        { name: "Lettuce", price: 20 },
      ],
    },
  ],
  drink: [
    {
      name: "Size",
      type: "single",
      required: true,
      options: [
        { name: "Regular", price: 0 },
        { name: "Large", price: 40 },
      ],
    },
    {
      name: "Ice",
      type: "single",
      required: false,
      options: [
        { name: "No Ice", price: 0 },
        { name: "Less Ice", price: 0 },
        { name: "Regular Ice", price: 0 },
      ],
    },
    {
      name: "Sugar",
      type: "single",
      required: false,
      options: [
        { name: "No Sugar", price: 0 },
        { name: "Less Sugar", price: 0 },
        { name: "Regular Sugar", price: 0 },
      ],
    },
  ],
  dessert: [
    {
      name: "Portion",
      type: "single",
      required: true,
      options: [
        { name: "Regular", price: 0 },
        { name: "Large", price: 60 },
      ],
    },
    {
      name: "Toppings",
      type: "multiple",
      required: false,
      options: [
        { name: "Extra Nuts", price: 40 },
        { name: "Chocolate Sauce", price: 30 },
      ],
    },
  ],
  kebab: [
    SPICE,
    {
      name: "Add-ons",
      type: "multiple",
      required: false,
      options: [
        { name: "Mint Chutney", price: 20 },
        { name: "Onion Salad", price: 15 },
        { name: "Extra Piece", price: 90 },
      ],
    },
  ],
  curry: [
    SPICE,
    {
      name: "Add-ons",
      type: "multiple",
      required: false,
      options: [
        { name: "Extra Gravy", price: 40 },
        { name: "Fresh Cream", price: 30 },
        { name: "Butter Naan", price: 60 },
      ],
    },
  ],
  rice: [
    SPICE,
    {
      name: "Add-ons",
      type: "multiple",
      required: false,
      options: [
        { name: "Extra Raita", price: 30 },
        { name: "Fried Egg", price: 40 },
        { name: "Extra Portion", price: 70 },
      ],
    },
  ],
};

function configFor(item) {
  const name = (item.name || "").toLowerCase();
  if (name.includes("biryani") || name.includes("biriyani")) return ["biryani", CONFIGS.biryani];
  if (name.includes("pizza")) return ["pizza", CONFIGS.pizza];
  if (name.includes("burger")) return ["burger", CONFIGS.burger];
  if (item.category === "Beverage") return ["drink", CONFIGS.drink];
  if (item.category === "Dessert") return ["dessert", CONFIGS.dessert];
  if (item.category === "Starter") return ["kebab", CONFIGS.kebab];
  if (/rice|thali|chole|bhature/.test(name)) return ["rice", CONFIGS.rice];
  return ["curry", CONFIGS.curry];
}

// The old generic seed all items shared (safe to replace).
function isGenericSeed(groups) {
  if (!Array.isArray(groups) || groups.length !== 2) return false;
  const [a, b] = groups;
  if (a.name !== "Spice Level" || b.name !== "Extras") return false;
  const names = (b.options || []).map((o) => o.name).join("|");
  return names === "Extra Cheese|Extra Sauce|Extra Portion";
}

(async () => {
  await connectDB();
  const items = await MenuItem.find({});
  let updated = 0;
  let preserved = 0;
  const tally = {};
  for (const item of items) {
    const current = item.customizationOptions || [];
    if (current.length > 0 && !isGenericSeed(current)) {
      preserved += 1; // admin-customized: do not touch
      continue;
    }
    const [label, config] = configFor(item);
    item.customizationOptions = structuredClone(config);
    await item.save();
    updated += 1;
    tally[label] = (tally[label] || 0) + 1;
  }
  console.log(`migrateProductCustomizations: updated=${updated} preserved=${preserved} total=${items.length}`);
  console.log("by type:", JSON.stringify(tally));
  process.exit(0);
})().catch((err) => {
  console.error("migration failed:", err.message);
  process.exit(1);
});

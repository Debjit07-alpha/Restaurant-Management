// One-time migration: assign every existing menu item its canonical
// customer-facing menuCategory + isHealthy flag, based on the actual
// food (verified against the live menu on 2026-09-14).
//
// Classification (explicit per-dish map, no loose keywords):
// - pizza: the 5 pizzas (incl. Paneer Tikka Pizza -> pizza, NOT indian)
// - burgers: the 6 burgers
// - chinese: Chicken Fried Rice, Chilli Garlic Prawn, Chicken Lollipop
//   (Indo-Chinese preparations, matching the project's own taxonomy)
// - drinks: Masala Chai, Mango Shake, Masala Chaas, Fresh Lime Soda
// - desserts: Chocolate Moose, Creampie, Gulab Jamun, Rasmalai, Jalebi,
//   Kesar Kulfi, Shahi Tukda
// - indian: everything else (biryanis, curries, kebabs, thali, ...)
// - isHealthy: false for all (nothing is intentionally classified as
//   healthy yet; an admin marks healthy dishes via the edit form).
//
// Safe to re-run: only touches items missing menuCategory, and reports
// anything it cannot classify instead of guessing.
//
// Run: node scripts/migrateMenuCategories.js

const connectDB = require("../config/db");
const MenuItem = require("../models/MenuItem");

const BY_NAME = {
  // pizza
  "margherita pizza": "pizza",
  "chicken tikka pizza": "pizza",
  "pepperoni pizza": "pizza",
  "paneer tikka pizza": "pizza",
  "farmhouse pizza": "pizza",
  // burgers
  "classic cheeseburger": "burgers",
  "chicken tikka burger": "burgers",
  "bbq chicken burger": "burgers",
  "double cheese burger": "burgers",
  "spicy chicken burger": "burgers",
  burger: "burgers",
  // chinese
  "chicken fried rice": "chinese",
  "chilli garlic prawn": "chinese",
  "chicken lollipop": "chinese",
  // drinks
  "masala chai": "drinks",
  "mango shake": "drinks",
  "masala chaas": "drinks",
  "fresh lime soda": "drinks",
  // desserts
  "chocolate moose": "desserts",
  creampie: "desserts",
  "gulab jamun": "desserts",
  rasmalai: "desserts",
  jalebi: "desserts",
  "kesar kulfi": "desserts",
  "shahi tukda": "desserts"
};

const migrate = async () => {
  await connectDB();
  const items = await MenuItem.find({
    $or: [
      { menuCategory: { $exists: false } },
      { menuCategory: null }
    ]
  });
  let updated = 0;
  const unclassified = [];
  for (const item of items) {
    const key = String(item.name || "").trim().toLowerCase();
    const menuCategory = BY_NAME[key] || "indian";
    if (!BY_NAME[key]) unclassified.push(item.name);
    item.menuCategory = menuCategory;
    if (item.isHealthy !== true) item.isHealthy = false;
    await item.save();
    updated += 1;
  }
  console.log(`menu categories migrated: ${updated} item(s)`);
  if (unclassified.length > 0) {
    console.log(
      `defaulted to indian (review in admin): ${unclassified.join(", ")}`
    );
  }
  const counts = await MenuItem.aggregate([
    { $group: { _id: "$menuCategory", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  console.log("counts:", JSON.stringify(counts));
  const healthy = await MenuItem.countDocuments({ isHealthy: true });
  console.log(`healthy items: ${healthy}`);
  process.exit(0);
};

migrate().catch((err) => {
  console.error("Migrate menu categories error:", err.message);
  process.exit(1);
});

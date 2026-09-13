// One-time bootstrap: give Starter + Main Course items a minimal
// customization structure (spice level + extras) where none exists yet.
// Idempotent: only touches items whose customizationOptions is missing/empty.
// Run: node scripts/seedCustomizations.js
require("dotenv").config();
const connectDB = require("../config/db");
const MenuItem = require("../models/MenuItem");

const DEFAULT_OPTIONS = [
  {
    name: "Spice Level",
    type: "single",
    required: true,
    options: [
      { name: "Mild", price: 0 },
      { name: "Medium", price: 0 },
      { name: "Spicy", price: 0 }
    ]
  },
  {
    name: "Extras",
    type: "multiple",
    required: false,
    options: [
      { name: "Extra Cheese", price: 50 },
      { name: "Extra Sauce", price: 30 },
      { name: "Extra Portion", price: 80 }
    ]
  }
];

(async () => {
  await connectDB();
  const items = await MenuItem.find({
    category: { $in: ["Starter", "Main Course"] }
  });
  let updated = 0;
  let skipped = 0;
  for (const item of items) {
    if (Array.isArray(item.customizationOptions) && item.customizationOptions.length > 0) {
      skipped += 1;
      continue;
    }
    item.customizationOptions = structuredClone(DEFAULT_OPTIONS);
    await item.save();
    updated += 1;
  }
  console.log(`seedCustomizations: updated=${updated} skipped=${skipped} total=${items.length}`);
  process.exit(0);
})().catch((err) => {
  console.error("seedCustomizations failed:", err.message);
  process.exit(1);
});

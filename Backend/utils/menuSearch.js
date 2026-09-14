// Server-side mirror of the customer category tabs (see
// Frontend src/utils/categories.js). Tabs match by keywords against
// name/description/category because the stored enum is only
// Starter/Main Course/Dessert/Beverage. Kept in sync deliberately:
// search filtering must live in MongoDB so counts/pagination are right.
const CATEGORY_KEYWORDS = {
  Pizza: ["pizza"],
  Burgers: ["burger"],
  Indian: [
    "indian", "tikka", "masala", "curry", "biryani", "paneer", "dal",
    "makhni", "chole", "kebab", "tandoori", "butter chicken", "dosa",
    "samosa", "thali"
  ],
  Chinese: [
    "chinese", "noodle", "hakka", "manchurian", "schezwan", "szechwan",
    "fried rice", "chilli chicken", "spring roll"
  ],
  Desserts: [
    "dessert", "cake", "lava", "brownie", "ice cream", "gulab",
    "kheer", "pastry", "sweet", "pudding", "mousse"
  ],
  Drinks: [
    "drink", "beverage", "juice", "shake", "lassi", "coffee", "tea",
    "cola", "soda", "mocktail", "smoothie", "cold drink"
  ],
  Healthy: [
    "healthy", "salad", "grill", "oats", "soup", "sprouts", "quinoa",
    "diet", "low fat"
  ]
};

const CATEGORY_TABS = ["All", ...Object.keys(CATEGORY_KEYWORDS)];

// Escape user text for literal $regexMatch (no regex injection).
const escapeRegExp = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// $or conditions matching ANY of the tokens in name/category/description.
const tokenMatchConditions = (tokens) => {
  const conditions = [];
  for (const token of tokens) {
    const rx = { $regex: escapeRegExp(token), $options: "i" };
    conditions.push({ name: rx }, { category: rx }, { description: rx });
  }
  return conditions;
};

// Category tab -> $or keyword conditions (null when All/unknown).
const categoryConditions = (category) => {
  const keywords = CATEGORY_KEYWORDS[category];
  if (!category || category === "All" || !keywords) return null;
  const conditions = [];
  for (const keyword of keywords) {
    const rx = { $regex: escapeRegExp(keyword), $options: "i" };
    conditions.push({ name: rx }, { category: rx }, { description: rx });
  }
  return conditions;
};

// Deterministic relevance score (higher = better):
// exact name 100 > name starts-with 50 > name contains 30 >
// +10 per query token in name > +8 category hit > +4 per token in
// description (capped at +20). No AI, fully explainable.
const relevanceScoreExpression = (query, tokens) => {
  const parts = [
    {
      $cond: [
        { $regexMatch: { input: "$name", regex: `^${escapeRegExp(query)}$`, options: "i" } },
        100,
        0
      ]
    },
    {
      $cond: [
        { $regexMatch: { input: "$name", regex: `^${escapeRegExp(query)}`, options: "i" } },
        50,
        0
      ]
    },
    {
      $cond: [
        { $regexMatch: { input: "$name", regex: escapeRegExp(query), options: "i" } },
        30,
        0
      ]
    }
  ];
  for (const token of tokens) {
    parts.push({
      $cond: [
        { $regexMatch: { input: "$name", regex: escapeRegExp(token), options: "i" } },
        10,
        0
      ]
    });
  }
  parts.push({
    $cond: [
      { $regexMatch: { input: "$category", regex: escapeRegExp(query), options: "i" } },
      8,
      0
    ]
  });
  let descriptionScore = { $literal: 0 };
  for (const token of tokens) {
    descriptionScore = {
      $add: [
        descriptionScore,
        {
          $cond: [
            { $regexMatch: { input: "$description", regex: escapeRegExp(token), options: "i" } },
            4,
            0
          ]
        }
      ]
    };
  }
  parts.push({ $min: [descriptionScore, 20] });
  return { $add: parts };
};

module.exports = {
  CATEGORY_KEYWORDS,
  CATEGORY_TABS,
  escapeRegExp,
  tokenMatchConditions,
  categoryConditions,
  relevanceScoreExpression
};

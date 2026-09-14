// Canonical customer menu categories. Category tabs filter by EXACT
// equality on the item's menuCategory field — never by name/description
// keywords (that looseness showed pizzas under Indian and burgers under
// Healthy). "Healthy" is NOT a category: it is the separate isHealthy
// boolean, filtered via the `healthy` parameter below.
const MENU_CATEGORIES = [
  "pizza",
  "burgers",
  "indian",
  "chinese",
  "desserts",
  "drinks"
];

// Normalize a category parameter to a canonical value (or null when
// absent/All/unknown — unknown never filters everything out).
const parseMenuCategory = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "" || normalized === "all") return null;
  return MENU_CATEGORIES.includes(normalized) ? normalized : null;
};

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

// Parse the healthy flag ("true"/true only).
const parseHealthy = (value) => {
  if (value === true) return true;
  if (typeof value === "string" && value.trim().toLowerCase() === "true") {
    return true;
  }
  return false;
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
  MENU_CATEGORIES,
  parseMenuCategory,
  parseHealthy,
  escapeRegExp,
  tokenMatchConditions,
  relevanceScoreExpression
};

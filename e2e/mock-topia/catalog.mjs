// Grow Together's ecosystem inventory catalog, the mock's default for every world.
//
// The app caches the catalog per interactive public key for 6 hours (server/utils/cache/inventoryCache.ts),
// and every test uses the same key, so whichever world fetches it first fills the cache for the whole run.
// That's why it's the mock's default instead of a per-world seed: tests must never seed a different one.
//
// metadata mirrors the real items: type seed | tool | decoration, cost, rarity (index into Common, Uncommon,
// Rare, Epic, Legendary), reward (coins per harvest), growthTime (seconds per growth level), harvestLevel,
// canBeUsedOnPlot, actionType, sortOrder and quantity (how many a tool purchase gives).

export const ITEM = {
  coins: "item-coins",
  xp: "item-xp",
  carrots: "seed-carrots",
  tomatoes: "seed-tomatoes",
  pumpkins: "seed-pumpkins",
  retiredSeed: "seed-retired",
  sprinkler: "tool-sprinkler",
  harvestBasket: "tool-harvest-basket",
  woodenCan: "tool-wooden-can",
  goldCan: "tool-gold-can",
  basicMulch: "tool-basic-mulch",
  ultraMulch: "tool-ultra-mulch",
  basicCompost: "tool-basic-compost",
  gnome: "decoration-gnome",
  fountain: "decoration-fountain",
  strawHat: "accessory-straw-hat",
};

const item = (id, name, type, metadata = {}, status = "ACTIVE") => ({
  id,
  name,
  type,
  status,
  description: `${name} description`,
  image_path: `https://example.invalid/items/${id}.png`,
  metadata,
});

export const CATALOG = [
  item(ITEM.coins, "Coins", "CURRENCY"),
  item(ITEM.xp, "Experience Points", "ITEM"),

  item(ITEM.carrots, "Carrots", "ITEM", { type: "seed", cost: 0, rarity: 0, reward: 5, growthTime: 60, harvestLevel: 2, sortOrder: 1 }),
  item(ITEM.tomatoes, "Tomatoes", "ITEM", { type: "seed", cost: 20, rarity: 1, reward: 15, growthTime: 120, harvestLevel: 3, sortOrder: 2 }),
  item(ITEM.pumpkins, "Pumpkins", "ITEM", { type: "seed", cost: 100, rarity: 3, reward: 60, growthTime: 300, harvestLevel: 4, sortOrder: 3 }),
  item(ITEM.retiredSeed, "Retired Beans", "ITEM", { type: "seed", cost: 1, rarity: 0, reward: 1, growthTime: 60, harvestLevel: 1 }, "INACTIVE"),

  item(ITEM.sprinkler, "Sprinkler", "ITEM", { type: "tool", cost: 40, rarity: 1, actionType: "Water", canBeUsedOnPlot: true, quantity: 1, sortOrder: 1 }),
  item(ITEM.harvestBasket, "Harvest Basket", "ITEM", { type: "tool", cost: 40, rarity: 1, actionType: "Harvest", canBeUsedOnPlot: true, quantity: 1, sortOrder: 2 }),
  item(ITEM.woodenCan, "Wooden Watering Can", "ITEM", { type: "tool", cost: 5, rarity: 0, actionType: "Water", quantity: 5, sortOrder: 3 }),
  item(ITEM.goldCan, "Gold Watering Can", "ITEM", { type: "tool", cost: 150, rarity: 3, actionType: "Water", quantity: 5, sortOrder: 4 }),
  item(ITEM.basicMulch, "Basic Mulch", "ITEM", { type: "tool", cost: 10, rarity: 0, actionType: "Mulch", quantity: 5, sortOrder: 5 }),
  item(ITEM.ultraMulch, "Ultra Mulch", "ITEM", { type: "tool", cost: 200, rarity: 4, actionType: "Mulch", quantity: 5, sortOrder: 6 }),
  item(ITEM.basicCompost, "Basic Compost", "ITEM", { type: "tool", cost: 10, rarity: 0, actionType: "Compost", quantity: 5, sortOrder: 7 }),

  item(ITEM.gnome, "Garden Gnome", "ITEM", { type: "decoration", cost: 30, rarity: 1, sortOrder: 1 }),
  item(ITEM.fountain, "Stone Fountain", "ITEM", { type: "decoration", cost: 80, rarity: 2, sortOrder: 2 }),

  item(ITEM.strawHat, "Straw Hat", "ACCESSORY", { displayName: "Farmer's Straw Hat", cost: 25, rarity: 1, sortOrder: 1 }),
];

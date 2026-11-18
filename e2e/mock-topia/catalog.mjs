// Grow Together's ecosystem inventory catalog (catalog.json), the mock's default for every world.
//
// The app caches the catalog per interactive public key for 6 hours (server/utils/cache/inventoryCache.ts),
// and every test uses the same key, so whichever world fetches it first fills the cache for the whole run.
// That's why it's the mock's default instead of a per-world seed: tests must never seed a different one.
//
// metadata mirrors the real items: type seed | tool | decoration, cost, rarity (index into Common, Uncommon,
// Rare, Epic, Legendary), reward (coins per harvest), growthTime (seconds per growth level), harvestLevel,
// canBeUsedOnPlot, actionType, sortOrder and quantity (how many a tool purchase gives).

import { readFileSync } from "node:fs";

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

// The catalog itself is catalog.json (the mock's default catalog file); tests import it from here with ITEM.
export const CATALOG = JSON.parse(readFileSync(new URL("./catalog.json", import.meta.url), "utf8"));

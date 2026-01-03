import { getRarity } from "../utils";

export const defaultVisitorInventoryItem = {
  id: "",
  ecosystemItemId: "",
  availableQuantity: 0,
  description: "",
  icon: "",
  name: "",
  quantity: 0,
  cost: 0,
  rarity: getRarity(0),
  reward: 0,
  growthTime: 0,
  harvestLevel: 0,
  canBeUsedOnPlot: false,
  actionType: undefined,
  sortOrder: 0,
};

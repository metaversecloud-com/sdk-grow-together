// Grow Together world builders shared by the app specs: plots, crops, decorations and inventories shaped
// like the app stores them (shared/types, server/constants.ts).
import { CATALOG, ITEM } from "../../mock-topia/catalog.mjs";
import { SeedOptions, TopiaWorld, VISITOR_ID } from "../../fixtures";

export { ITEM, CATALOG };

export const PLOT_POSITION = { x: 1000, y: 1000 };
export const PLOT_UNIQUE_NAME = "GrowTogether_plot";
const S3 = "https://sdk-grow-together.s3.us-east-1.amazonaws.com";
export const cropImage = (name: string, level: number) => `${S3}/crops/${name.replace(/\s+/g, "-")}-${level}.png`;
export const decorationImage = (name: string) => `${S3}/decorations/${name.replace(/\s+/g, "-")}.png`;

/** Where the app drops something on square `squareId` of a plot at PLOT_POSITION (calculateSquarePosition). */
export const squarePosition = (squareId: number) => {
  const row = Math.floor((squareId - 1) / 4);
  const col = (squareId - 1) % 4;
  return { x: PLOT_POSITION.x + (col - 1.5) * 100, y: PLOT_POSITION.y + (row - 1.5) * 100 + 330 };
};

const item = (id: string) => {
  const found = CATALOG.find((i) => i.id === id);
  if (!found) throw new Error(`no catalog item ${id}`);
  return found;
};

/** A visitor inventory (GET get-visitor-inventory-items) from { [itemId]: quantity }. */
export const inventory = (quantities: Record<string, number>) =>
  Object.entries(quantities).map(([id, quantity]) => {
    const { name, type, status, image_path, description } = item(id);
    return {
      id: `owned-${id}`,
      item_id: id,
      itemId: id,
      quantity,
      name,
      type,
      status,
      image_url: image_path,
      item: { id, name, description, type, image_url: image_path },
    };
  });

/** Quantity of an item in a visitor's inventory as the mock holds it (undefined = not owned). */
export const quantityOf = async (world: TopiaWorld, itemId: string, visitorId = VISITOR_ID) =>
  ((await world.state()).visitors[visitorId].inventory || []).find((e: any) => e.item_id === itemId)?.quantity as
    | number
    | undefined;

export const emptySquares = () => Object.fromEntries(Array.from({ length: 16 }, (_, i) => [i + 1, null]));

export type Crop = {
  seedId?: string;
  name?: string;
  squareId: number;
  growLevel?: number;
  /** Seconds since the crop was last watered (default: long ago, so it's ready to water). */
  wateredAgo?: number;
  appliedTools?: string[];
};

export type Decoration = { decorationId: string; decorationName: string; squareId: number };

/** One player's claimed plot: the visitor data's world entry, the plot asset data and crop/decoration assets. */
export const garden = (
  world: TopiaWorld,
  {
    plotAssetId = world.assetId,
    owner = world.player(VISITOR_ID),
    crops = {},
    decorations = {},
    lastInteractionDate = new Date().toISOString(),
    claimedDate = "2026-01-02T03:04:05.000Z",
  }: {
    plotAssetId?: string;
    owner?: { profileId: string; displayName: string };
    crops?: Record<string, Crop>;
    decorations?: Record<string, Decoration>;
    lastInteractionDate?: string;
    claimedDate?: string;
  } = {},
) => {
  const now = Date.now();
  const plotSquares: Record<number, string | null> = emptySquares();
  const cropData: Record<string, any> = {};
  const decorationData: Record<string, any> = {};
  const assets: Record<string, any> = {};
  for (const [id, crop] of Object.entries(crops)) {
    const seedId = crop.seedId ?? ITEM.carrots;
    const lastWatered = new Date(now - (crop.wateredAgo ?? 3600) * 1000).toISOString();
    cropData[id] = {
      seedId,
      name: crop.name ?? item(seedId).name,
      dateDropped: lastWatered,
      lastWatered,
      growLevel: crop.growLevel ?? 0,
      squareId: crop.squareId,
      appliedTools: crop.appliedTools ?? [],
    };
    plotSquares[crop.squareId] = id;
    assets[id] = {
      id,
      assetName: "webImageAsset",
      uniqueName: `GrowTogether_crop_${owner.profileId}`,
      position: squarePosition(crop.squareId),
      layer1: cropImage(cropData[id].name, cropData[id].growLevel),
      dataObject: { ...cropData[id], plotAssetId, ownerId: owner.profileId, ownerName: owner.displayName },
    };
  }
  for (const [id, decoration] of Object.entries(decorations)) {
    decorationData[id] = { ...decoration, dateDropped: new Date(now - 3600_000).toISOString() };
    plotSquares[decoration.squareId] = id;
    assets[id] = {
      id,
      assetName: "webImageAsset",
      uniqueName: `GrowTogether_decoration_${owner.profileId}`,
      position: squarePosition(decoration.squareId),
      dataObject: { ...decorationData[id], plotAssetId, ownerId: owner.profileId, ownerName: owner.displayName },
    };
  }
  return {
    plotAssetId,
    worldEntry: {
      plotAssetId,
      claimedDate,
      lastInteractionDate,
      plotSquares,
      crops: cropData,
      decorations: decorationData,
    },
    plotAssetData: {
      plotAssetId,
      ownerId: owner.profileId,
      ownerName: owner.displayName,
      claimedDate,
      lastInteractionDate,
    },
    assets,
  };
};

/** A visitor/user data object (DEFAULT_VISITOR_DATA) with optional world entries. */
export const playerData = (worlds: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
  lastDateCoinsEarned: "",
  totalCoinsEarned: 0,
  inventoryLastUpdated: "",
  placedDecorations: {},
  worlds,
  ...extra,
});

/** The world's data object: the plots index { plotAssetId: ownerProfileId | null }. */
export const plotsIndex = (plots: Record<string, string | null>) => ({ plots });

export const plotAsset = (id: string, data: Record<string, unknown> = {}, position = { x: 3000, y: 1000 }) => ({
  id,
  assetName: "Garden Plot",
  uniqueName: PLOT_UNIQUE_NAME,
  position,
  dataObject: data,
});

/**
 * The common starting point: the test's player owns the key plot (opened from it), with `crops` and
 * `decorations`, `items` in the backpack, and a second plot "plot-2" still free.
 */
export const seedOwnGarden = async (
  world: TopiaWorld,
  {
    crops,
    decorations,
    items = { [ITEM.coins]: 100, [ITEM.xp]: 0, [ITEM.carrots]: 1 },
    extra = {},
    lastInteractionDate,
    missingAssets = [],
  }: {
    /** Crops/decorations the player's data still lists but whose dropped assets are gone from the world. */
    missingAssets?: string[];
    crops?: Record<string, Crop>;
    decorations?: Record<string, Decoration>;
    items?: Record<string, number>;
    extra?: SeedOptions;
    lastInteractionDate?: string;
  } = {},
) => {
  const own = garden(world, { crops, decorations, lastInteractionDate });
  for (const id of missingAssets) delete own.assets[id];
  const placed: Record<string, Record<string, string[]>> = {};
  for (const [id, d] of Object.entries(decorations ?? {})) {
    ((placed[d.decorationName] ||= {})[world.urlSlug] ||= []).push(id);
  }
  await world.seed({
    asset: { uniqueName: PLOT_UNIQUE_NAME, position: PLOT_POSITION },
    assetData: own.plotAssetData,
    worldData: plotsIndex({ [world.assetId]: world.profileId, "plot-2": null }),
    visitorData: playerData({ [world.urlSlug]: own.worldEntry }, { placedDecorations: placed }),
    visitor: { inventory: inventory(items) },
    ...extra,
    extraAssets: { "plot-2": plotAsset("plot-2"), ...own.assets, ...(extra.extraAssets ?? {}) },
  });
  return own;
};

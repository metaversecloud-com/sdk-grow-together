<div align="center">
<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 120px; margin-bottom: 20px" alt="Topia logo">
</div>

# Grow Together

## Introduction / Summary

Grow Together is a shared, world-wide gardening game for a Topia world. An admin scatters "Available Garden" sign dropped assets (unique name `GrowTogether_plot`) around the world; each visitor may **claim one** of them per world, becoming its permanent owner. Owners plant seeds in a **4x4 grid** of squares under their sign, water crops to advance them through visual growth stages, harvest at max growth for coins + XP, and decorate their plot with purchased items. Because plots are placed in a shared world, **any visitor can walk up to another player's plot and use tools on that owner's crops** — that peer contribution (watering, mulching, composting) is the "together" part of the name. There is no push-based transport: state updates land in the world via Topia's own asset syncing (`updateWebImageLayers`, `triggerParticle`) and each drawer reloads via explicit REST calls.

Progression is XP-driven — the visitor's `Experience Points` inventory item ticks up 100 XP tiers across ~20 ranks ("New Gardener" → "Legendary Gardener"), granting bonus coins on each rank-up. Content variety comes from the ecosystem-inventory: seeds, tools, decorations, and accessories, each tagged with a `Common | Uncommon | Rare | Epic | Legendary` rarity that scales the XP multiplier.

## Key Features

### Core Gameplay

- **Claim a plot.** A visitor can own exactly one plot per world (`visitorData.worlds[urlSlug].plotAssetId`). Claiming rewrites the sign asset's image from `OpenGardenSign.png` to `ViewGardenSign.png`, drops a `GrowTogether_ownerText_${profileId}` text asset (`{displayName}'s Garden`) below the plot, and seeds the visitor's inventory with 1× `Carrots`, 1× `Sprinkler`, 1× `Harvest Basket`, and 5× each of `Wooden Watering Can`, `Basic Mulch`, `Basic Compost`.
- **4x4 grid.** `plotConfig.gridCols * plotConfig.gridRows = 16` squares per plot. `squareId` runs 1..16; squares 1..4 are `reservedSquares` (decoration-only per convention, though not currently enforced server-side).
- **Plant / Water / Harvest.** Each crop is its own dropped asset (`GrowTogether_crop_${profileId}`). Growth is **watering-driven**: watering advances `growLevel` by 1 (up to `seedConfig.harvestLevel`) and re-writes the layer-1 image via `getSeedImageVariation(name, growLevel)`. Between waterings, `getSecondsRemaining(lastWatered, growthTime, appliedTools)` gates the next tick — the plant is time-locked, not idle-growing.
- **Tools that stack on a crop.** Up to **3 tools** may be applied to a single crop (`crop.appliedTools`). Mulch shortens `growthTime` (Basic −10%, Super −25%, Ultra −33%); Compost multiplies the harvest coin reward on-roll (Basic 25%×2 / 5%×3, Super 33%×2 / 10%×3, Ultra 50%×2 / 25%×3).
- **Watering-can tiers with a chance-based bonus.** `Wooden` (1–2 XP; 25% chance of 1–3 coins), `Metal` (3–6 XP; 50% chance of 4–8 coins), `Gold` (7–14 XP; 80% chance of 10–20 coins).
- **Plot-wide tools.** `Sprinkler` waters every eligible crop in a plot in one call; `Harvest Basket` harvests every mature crop.
- **Decorations & accessories.** Purchased with coins, placed as `GrowTogether_decoration_${profileId}` dropped assets. `availableQuantity` (total minus placed) is recomputed on every game-state fetch, and orphaned placements (asset gone from world) are reclaimed.
- **XP → Levels → Ranks → Coins.** `xpLevelsAndRanks.ts` maps XP thresholds to levels 1..100 and rank names; crossing certain levels grants `coinsEarned` (10 at L2, 15 at L3, up to 500 at L100), fires a toast, and triggers a `GAME_HIGH_SCORE` world activity on rank-up.
- **Sound effects.** Client-side `Audio` plays `sprinkler.mp3`, `harvest_coins.mp3`, `water_plant.mp3`, `crop_planted.mp3`, `mulch.mp3`, `compost.mp3`, `decoration_placed.mp3`, and `newLevel.mp3` from `sdk-grow-together.s3.us-east-1.amazonaws.com`, keyed by `soundEffect` returned from most controllers.

### Social Features

- **Peer tool use.** `POST /crop/use-tool` accepts an `ownerId`. When `ownerId !== profileId` the server loads the plot owner via `User.create({ profileId: ownerId })`, reads/writes **their** `User.dataObject`, and applies the tool to the crop's `appliedTools`. Watering-can bonuses still credit the tool user's inventory.
- **Visiting.** `POST /plot/view` and `POST /square/view` open the plot/crop iframes for a non-owner visitor pointed at the owner's assets. `POST /teleport` (unclaimed) drops a visitor onto a random **available** plot; `POST /plot/teleport` drops the owner onto their own plot (`y + 140`).
- **Owner name overhead.** The `GrowTogether_ownerText_${profileId}` text asset ("`{displayName}'s Garden`") is dropped at claim time and is what other visitors see above the plot.
- **No SSE / no polling.** State reaches other visitors via the world itself (`updateWebImageLayers` on the crop asset + `triggerParticle` for water/coin/dirt effects). Drawers refresh only on explicit user actions.

### Admin

- **Guard.** `handleClearPlot` and `handleClearAllPlots` load the caller as `Visitor.get(...)` and throw if `!admin.isAdmin`. No other route has an `isAdmin` check.
- **Clear single plot.** `POST /admin/clear-plot` (`assetId` in query = the plot sign) — deletes every `GrowTogether_crop_${ownerId}` / `GrowTogether_decoration_${ownerId}` / `GrowTogether_ownerText_${ownerId}` in the world, resets the owner's `visitorData.worlds[urlSlug]` to `DEFAULT_VISITOR_WORLD_DATA`, wipes the owner's `placedDecorations[*][urlSlug]`, and returns the sign to `OpenGardenSign.png`.
- **Clear all plots.** `POST /admin/clear-all-plots` (body `{ clearInactiveOnly?: boolean }`). Batches through claimed plots in groups of 10, applies the same reset per owner in groups of 5, and deletes assets in chunks of 50. `clearInactiveOnly` filters to owners whose `plotAssetData.lastInteractionDate` is older than 14 days (or missing).

## Required Assets with Unique Names

The plot **sign** assets are the only unique names an admin needs to place manually. Everything else is dropped by the app.

| Unique name pattern                    | Placed by                         | Description                                                                                                                                                                                                                                                                |
| -------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GrowTogether_plot`                    | Admin (in the world editor)       | Sign dropped asset. Unclaimed signs show `OpenGardenSign.png`; claimed signs are rewritten to `ViewGardenSign.png` and get a click-through to the plot drawer. `getPlotAssets` finds them all via `fetchDroppedAssetsWithUniqueName({ uniqueName: "GrowTogether_plot" })`. |
| `GrowTogether_crop_${profileId}`       | The app (`handlePlantSeed`)       | One dropped asset per planted crop. `owner`, `seedId`, `growLevel`, `lastWatered`, `appliedTools`, `squareId` live on its `dataObject`.                                                                                                                                    |
| `GrowTogether_decoration_${profileId}` | The app (`handlePlaceDecoration`) | One dropped asset per placed decoration. `decorationId`, `decorationName`, `squareId`, `owner` on its `dataObject`.                                                                                                                                                        |
| `GrowTogether_ownerText_${profileId}`  | The app (`handleClaimPlot`)       | Text asset above the plot showing `{displayName}'s Garden`. Deleted with the plot on clear.                                                                                                                                                                                |

## Technical Architecture

### Data Objects

#### Visitor (`visitor.dataObject`)

The primary owner-state surface. Keyed globally with a `worlds[urlSlug]` sub-map so a visitor can own one plot per world using the same interactive key.

```ts
{
  lastDateCoinsEarned: string;          // ISO
  totalCoinsEarned: number;             // lifetime
  inventoryLastUpdated: string;         // ISO
  placedDecorations: {
    [decorationName: string]: {
      [urlSlug: string]: string[];      // droppedAssetIds
    };
  };
  worlds: {
    [urlSlug: string]: {
      plotAssetId: string | null;       // the claimed sign asset
      plotSignAssetId?: string | null;  // legacy — read by clear routines
      claimedDate: string;              // ISO
      lastInteractionDate: string;      // ISO
      plotSquares: {
        [squareId: number]: string | null; // droppedAssetId or null
      };
      crops: {
        [droppedAssetId: string]: {
          plotAssetId?: string;
          ownerId?: string;
          ownerName?: string;
          squareId: number;
          seedId: string;
          name: string;
          dateDropped: string;          // ISO
          lastWatered: string;          // ISO
          growLevel: number;            // 0..harvestLevel
          appliedTools: string[];       // max 3
        };
      };
      decorations: {
        [droppedAssetId: string]: {
          plotAssetId?: string;
          decorationId: string;
          decorationName: string;
          ownerId?: string;
          ownerName?: string;
          dateDropped: string;
          squareId: number;
        };
      };
    };
  };
}
```

Also on the visitor:

- **`visitor.inventoryItems`** — ecosystem inventory: `Coins` (`CURRENCY`), `Experience Points` (`CURRENCY`), seeds/tools/decorations/accessories (`ITEM` / `ACCESSORY`). All economy operations go through `modifyVisitorInventoryItem(...)` → `visitor.modifyInventoryItemQuantity`.

#### Plot Asset (`droppedAsset.dataObject` for a `GrowTogether_plot` sign)

```ts
{
  plotAssetId: string;
  ownerId?: string;                     // profileId of the claimant
  ownerName?: string;                   // displayName at claim time
  claimedDate?: string;                 // ISO
  lastInteractionDate?: string;         // ISO; bumped in handleGetGameState when owner opens their drawer
}
```

Empty `{}` when the plot is unclaimed.

#### World (`world.dataObject`)

```ts
{
  claimedPlots?: object;                // legacy shape; still tolerated by getPlotAssets
  plots: {
    [plotAssetId: string]: string | null; // profileId of owner, or null when unclaimed
  };
}
```

`world.plots` is a materialised lookup rebuilt by `getPlotAssets` when it's empty or when `shouldFetchAllPlotAssets` is forced. Concurrency-limited fan-out of 20 through `fetchDroppedAssetsWithUniqueName({ uniqueName: "GrowTogether_plot" })`.

#### Crop / Decoration dropped assets

Each crop / decoration writes a copy of its `plotSquares` row **on the asset itself** (`plotAssetId`, `ownerId`, `ownerName`, plus the shape shown under Visitor). This lets a non-owner iframe (opened by clicking the crop) read the crop without touching the owner's `User.dataObject` first.

#### User (`user.dataObject`) — non-owner reads

When a visitor tends to another player's plot (peer watering, non-owner drawer views), the server loads the plot owner as `User.create({ profileId })` and reads/writes their `dataObject` — which shares the same `VisitorDataObjectType` shape. This is how `handleUseTool` writes into another player's `worlds[urlSlug].crops[assetId].appliedTools`.

### Growth mechanic (at a glance)

- **Time-gated per crop.** `getSecondsRemaining(lastWatered, growthTime, appliedTools)` returns 0 before the next allowed water; mulches reduce `growthTime` (see Key Features). Watering while > 0 seconds remain throws.
- **Manual, not idle.** No cron / no scheduler advances crops. Every level bump comes from a `POST /crop/water` (single) or `POST /plot/use-tool` (Sprinkler batch).
- **Per-crop lock.** `watering_${assetId}_${floor(now / 30s) * 30s}` on the visitor data object, plus per-plot locks in `handlePlantSeed` (`planting_…`), `handlePlaceDecoration` (`placing_…`), `handleUsePlotTool` (`usingPlotTool_…`), and `handleHarvestCrop` (`harvesting_…`).
- **Peer edits.** Non-owners applying a tool via `handleUseTool` write to the **owner's** `User.dataObject`; the owner sees the change on their next drawer refresh.
- **No stages beyond `growLevel`.** Visual variety comes from `getSeedImageVariation(seedName, growLevel)`; there are no per-visitor themes.

## API Endpoints

All routes mount under `/api`. Every request goes through `getCredentials(req.query)` which requires `interactiveNonce`, `interactivePublicKey`, `urlSlug`, `visitorId` and enforces `INTERACTIVE_KEY === query.interactivePublicKey`. Payloads are stripped of `topia`, `credentials`, `jwt`, and `requestOptions` by the `cleanReturnPayload` response middleware in `server/index.ts`.

| Method | Route                    | Auth  | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------ | ------------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/`                      | —     | Smoke test. Returns `{ message: "Hello from server!" }`.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `GET`  | `/system/health`         | —     | Version + non-secret env flags (`NODE_ENV`, `INSTANCE_DOMAIN`, `INTERACTIVE_KEY`, `S3_BUCKET`).                                                                                                                                                                                                                                                                                                                                                          |
| `GET`  | `/game-state`            | —     | Drawer bootstrap for the clicked plot sign. Initialises visitor data, refreshes availableQuantity for decorations, migrates non-owner drawers to the owner's `User.dataObject`, and returns `plotAssetData`, `visitorData`, `plotData`, `visitorInventory`, ecosystem catalogs (`ecosystemAccessories`/`Decorations`/`Seeds`/`Tools`), `noOfAvailablePlots`, `xp`, `isAdmin`. Accepts `forceRefreshInventory=true` to bypass the 6-hour inventory cache. |
| `POST` | `/teleport`              | —     | Random-teleport to an **available** (`ownerId === null`) plot; opens the plot iframe on landing.                                                                                                                                                                                                                                                                                                                                                         |
| `POST` | `/admin/clear-plot`      | Admin | Clears one plot (target is `credentials.assetId`) and resets its owner's per-world state.                                                                                                                                                                                                                                                                                                                                                                |
| `POST` | `/admin/clear-all-plots` | Admin | Body `{ clearInactiveOnly?: boolean }`. Clears every claimed plot; when `clearInactiveOnly` is true, skips plots whose `lastInteractionDate` is within the last 14 days.                                                                                                                                                                                                                                                                                 |
| `POST` | `/plot/claim`            | —     | Claims the clicked sign for the caller. Drops the owner-name text asset, seeds inventory with starter items, and rewrites the sign image. Rejects if the caller already owns a plot in this world.                                                                                                                                                                                                                                                       |
| `POST` | `/plot/teleport`         | —     | Teleports the caller to their own plot (`y + 140`) and opens the plot iframe.                                                                                                                                                                                                                                                                                                                                                                            |
| `POST` | `/plot/view`             | —     | Opens the plot iframe for a non-owner from a crop/decoration drawer. Body `{ plotAssetId }`.                                                                                                                                                                                                                                                                                                                                                             |
| `POST` | `/plot/use-tool`         | —     | Body `{ tool }`. Runs the selected tool over every eligible crop (Water: `growLevel < harvestLevel`, Harvest: `growLevel >= harvestLevel`). Consumes one tool from the caller's inventory.                                                                                                                                                                                                                                                               |
| `POST` | `/square/view`           | —     | Body `{ itemAssetId, type }` where `type` is `crop` / `decoration`. Opens the correct iframe route for a plot square.                                                                                                                                                                                                                                                                                                                                    |
| `GET`  | `/square`                | —     | Reads a specific crop/decoration dropped asset's `dataObject` (via `credentials.assetId`). Cleans up orphaned squares (owner + no visitor-side square record → delete asset).                                                                                                                                                                                                                                                                            |
| `POST` | `/seed/purchase`         | —     | Body `{ seedId }`. Deducts `Coins`, grants 1× seed. Free seeds (`cost === 0`) are always allowed. Paid seeds are one-per-visitor.                                                                                                                                                                                                                                                                                                                        |
| `POST` | `/crop/drop`             | —     | Body `{ seedId, squareId }`. Requires plot ownership. Drops a new `GrowTogether_crop_${profileId}` asset at the computed square position, awards planting XP, fires the `dirt_grow_together` particle. Per-square lock `planting_${assetId}_${squareId}_${visitorId}_…`.                                                                                                                                                                                 |
| `POST` | `/crop/water`            | —     | Body `{ cropAssetId? }` — falls back to `credentials.assetId`. Advances the crop by one growth level (owner only, via `waterCrop({ shouldReward: true })`). Awards planting XP and any rank-up coins.                                                                                                                                                                                                                                                    |
| `POST` | `/crop/harvest`          | —     | Body `{ cropAssetId? }`. Deletes the crop asset, awards `getCoinRewardAmount(appliedTools, seedConfig.reward)` coins + harvest XP, credits `visitorData.totalCoinsEarned`. Cleans up orphaned crops if the asset is already gone.                                                                                                                                                                                                                        |
| `POST` | `/crop/use-tool`         | —     | Body `{ itemAssetId?, tool, ownerId }`. Runs the tool against one crop. Watering cans grant an XP roll (see Key Features). Other tools (Mulch, Compost) push onto `appliedTools` — capped at 3. When `ownerId !== profileId` the target crop's owner is loaded via `User.create`.                                                                                                                                                                        |
| `POST` | `/crop/remove`           | —     | Body `{ squareId }`. Deletes the crop from the owner's plot; owner-only via crop-asset `dataObject.ownerId` check.                                                                                                                                                                                                                                                                                                                                       |
| `POST` | `/decoration/purchase`   | —     | Body `{ decorationId }`. Deducts coins, grants 1× decoration, bumps `availableQuantity`.                                                                                                                                                                                                                                                                                                                                                                 |
| `POST` | `/decoration/drop`       | —     | Body `{ decorationId, squareId }`. Drops a `GrowTogether_decoration_${profileId}` asset, decrements `availableQuantity`. Per-square lock `placing_${assetId}_${squareId}_${visitorId}_…`.                                                                                                                                                                                                                                                                |
| `POST` | `/decoration/remove`     | —     | Body `{ squareId }`. Removes the decoration and returns 1 to `availableQuantity` (capped at owned `quantity`).                                                                                                                                                                                                                                                                                                                                           |
| `POST` | `/accessory/purchase`    | —     | Body `{ accessoryId }`. Deducts coins, grants 1× accessory. Accessories are **one-time only** — a second purchase throws.                                                                                                                                                                                                                                                                                                                                |
| `POST` | `/tool/purchase`         | —     | Body `{ toolId }`. Deducts coins, grants `toolConfig.quantity` (the ecosystem-configured pack size). Multiple purchases stack.                                                                                                                                                                                                                                                                                                                           |

### Ecosystem inventory (source of items)

`getInventoryItems` fans out through the process-wide `inventoryCache` (`server/utils/cache/inventoryCache.ts`), keyed by `interactivePublicKey`. **6-hour TTL**, background refresh triggered at 80% of TTL, stale-cache fallback on fetch failure. Items are split by `metadata.type` (`seed`, `decoration`, `tool`) and by `item.type` (`ACCESSORY`), sorted by `metadata.sortOrder`.

## Analytics

Analytics are attached to Visitor / User / World data-object writes via the SDK's `analytics` option (`{ analyticName, profileId, urlSlug, uniqueKey }`). No Google Sheets integration in this app. All events use `uniqueKey: profileId` unless noted otherwise.

`getAnalyticName(item)` produces a camelCased variant from `item.name` (e.g. `Metal Watering Can` → `metalWateringCan`), which the templated events below use.

| Event                                                                            | Fired when                                                                                                                            | Where                                                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `plotDrawerViews-self` / `plotDrawerViews-non-self`                              | Drawer opens on a plot sign — self vs. non-self by comparing `plotData.plotAssetId === credentials.assetId`.                          | `handleGetGameState`.                                                     |
| `plotsClaimed`                                                                   | A visitor claims an unclaimed sign.                                                                                                   | `handleClaimPlot`.                                                        |
| `plotsCleared`                                                                   | An admin clears one or many plots. Written into each cleared owner's `User.dataObject`.                                               | `handleClearPlot`, `handleClearAllPlots`.                                 |
| `teleport-selfPlot`                                                              | Visitor teleports to their own plot.                                                                                                  | `handleTeleportToPlot`.                                                   |
| `teleport-openPlot`                                                              | Visitor random-teleports to an unclaimed plot.                                                                                        | `handleTeleportToOpenPlot`.                                               |
| `cropsPlanted`, `${getAnalyticName(seed)}Planted`                                | `POST /crop/drop` succeeds. Per-seed variant is templated (e.g. `carrotsPlanted`).                                                    | `handlePlantSeed`.                                                        |
| `cropsWatered`, `${getAnalyticName(seed)}Watered`                                | Any successful watering (owner via `/crop/water`, peer via `/crop/use-tool` with a watering can, or `/plot/use-tool` Sprinkler pass). | `waterCrop` (in `handleWaterCrop`, `handleUseTool`, `handleUsePlotTool`). |
| `cropsHarvested`, `${getAnalyticName(seed)}Harvested`                            | `POST /crop/harvest` succeeds.                                                                                                        | `handleHarvestCrop`.                                                      |
| `cropsRemoved`                                                                   | `POST /crop/remove`.                                                                                                                  | `handleRemoveCrop`.                                                       |
| `seedsUnlocked`, `${getAnalyticName(seed)}Unlocked`                              | First paid-seed purchase.                                                                                                             | `handlePurchaseSeed`.                                                     |
| `toolsPurchased`, `${getAnalyticName(tool)}Purchased`                            | Any tool purchase.                                                                                                                    | `handlePurchaseTool`.                                                     |
| `toolsUsed`, `${getAnalyticName(tool)}Used`                                      | Any single-crop or plot-wide tool use.                                                                                                | `handleUseTool`, `handleUsePlotTool`.                                     |
| `wateringCansUsed`                                                               | Watering-can subtype of `toolsUsed`.                                                                                                  | `handleUseTool` when `actionType === "Water"`.                            |
| `${actionType.toLowerCase()}Used`                                                | Non-water tool use — `mulchUsed`, `compostUsed`, etc.                                                                                 | `handleUseTool` (peer branch only).                                       |
| `decorationsUnlocked`, `${getAnalyticName(decoration)}Unlocked`                  | Decoration purchase.                                                                                                                  | `handlePurchaseDecoration`.                                               |
| `decorationsAdded`, `${getAnalyticName(decoration)}Added`                        | Placement.                                                                                                                            | `handlePlaceDecoration`.                                                  |
| `decorationsRemoved`                                                             | Removal.                                                                                                                              | `handleRemoveDecoration`.                                                 |
| `accessoriesUnlocked`, `${getAnalyticName(accessory)}Unlocked`                   | One-time accessory purchase.                                                                                                          | `handlePurchaseAccessory`.                                                |
| `cropDrawerViews-self` / `-non-self`, `decorationDrawerViews-self` / `-non-self` | Opening a crop/decoration drawer, tagged self vs. non-self by `ownerId === profileId`.                                                | `handleGetPlotSquareInfo`.                                                |
| `levelsGained`                                                                   | Any level-up.                                                                                                                         | `checkDidIncreaseLevelOrRank`.                                            |
| `level${N}Reached`                                                               | Crossing levels 5 / 10 / 25 / 50 / 75 / 100.                                                                                          | `checkDidIncreaseLevelOrRank`.                                            |
| `ranksGained`                                                                    | Rank changes (see `xpLevelsAndRanks.ts`). Also triggers a `GAME_HIGH_SCORE` world activity.                                           | `checkDidIncreaseLevelOrRank`.                                            |

## Environment Variables

Create a `.env` at the app root. See `.env-example` for the minimal template — `INSTANCE_DOMAIN`, `INTERACTIVE_KEY`, `INTERACTIVE_SECRET`, `NODE_ENV`.

| Variable                  | Description                                                                                                                                                   | Required |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `INTERACTIVE_KEY`         | Topia interactive app key. Verified against `interactivePublicKey` on every request by `getCredentials`.                                                      | Yes      |
| `INTERACTIVE_SECRET`      | Topia interactive app secret. Passed to `World.deleteDroppedAssets` in the admin clear routes.                                                                | Yes      |
| `INSTANCE_DOMAIN`         | Topia API domain. Defaults to `api.topia.io`. Use `api-stage.topia.io` for staging.                                                                           | No       |
| `INSTANCE_PROTOCOL`       | `https` for prod/staging, `http` for local. Defaults to `https`.                                                                                              | No       |
| `PORT`                    | Server port. Defaults to `3000`.                                                                                                                              | No       |
| `NODE_ENV`                | When not `"development"` the server statically serves `client/build/`. In development, dev-CORS allows `http://localhost:3000` and `http://localhost:5173`.   | No       |
| `S3_BUCKET`               | Echoed back in `/system/health` but not otherwise read by the server. Sound and image URLs are hard-coded to `sdk-grow-together.s3.us-east-1.amazonaws.com`.  | No       |
| `FORCE_REFRESH_INVENTORY` | If `"true"`, `handleGetGameState` bypasses the 6-hour inventory cache on every fetch. Same effect as passing `?forceRefreshInventory=true` on the drawer URL. | No       |

### Where to find `INTERACTIVE_KEY` and `INTERACTIVE_SECRET`

- [Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)
- [Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

## Getting Started

Requires Node 20+.

```bash
# from the app root
git clone https://github.com/metaversecloud-com/sdk-grow-together.git
cd sdk-grow-together
npm install          # installs root + client + server workspaces

# create .env at the app root (see Environment Variables above)
cp .env-example .env

# run server + client concurrently
npm run dev
```

- Server: `http://localhost:3000` (Express, `server/index.ts`)
- Client (Vite dev): `http://localhost:5173`

The dev client CORS-allows both origins; in production the server itself statically serves `client/build/`.

### Production mode

```bash
npm install
npm run build        # builds client + server workspaces
npm start            # runs the compiled server; serves client/build
```

## For Developers

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### App-specific notes

- **Ownership uniqueness = per world, per key.** `visitorData.worlds[urlSlug].plotAssetId` gates one-plot-per-visitor. Because `interactivePublicKey` scopes the SDK data object, the same profile _can_ own separate plots in different worlds/apps sharing the same interactive key.
- **Only admin routes check `isAdmin`.** No other route is gated server-side; the peer-tool flow trusts that `credentials.profileId` and body-supplied `ownerId` are correct. The `interactivePublicKey === INTERACTIVE_KEY` check in `getCredentials` is the only universal guard.
- **Peer waterings do not reward the crop's owner.** `handleWaterCrop` passes `shouldReward: true` (owner-only path). `handleUseTool` also rewards the caller (not the owner) — the "together" mechanic is contribution, not gift-XP-to-owner.
- **`plotSignAssetId` is legacy.** Read by `handleClearPlot` / `handleClearAllPlots` as an extra id to delete, but never written by any current controller. Safe to remove from cleanup once no old visitor data objects reference it.
- **`worldDataObject.claimedPlots` is legacy.** `getPlotAssets` still falls through to it (`plots || claimedPlots || {}`) — remove once no world has the older shape.
- **Response middleware is deep.** `server/index.ts` monkey-patches `res.send` for every response through `cleanReturnPayload`, so downstream `res.json(...)` payloads have `topia`, `credentials`, `jwt`, `requestOptions` stripped even from nested SDK objects.
- **Reserved squares are aspirational.** `plotConfig.reservedSquares = [1, 2, 3, 4]` is documented as "reserved for decorations" but the server allows planting/decorating on any square 1..16 (the client is free to enforce it).
- **`handleUsePlotTool` returns `success: false`.** The final `res.json({ success: false, … })` in `handleUsePlotTool` looks like a bug — every other successful controller returns `success: true`. Downstream callers should not treat `success` as a reliable flag for this route.
- **Wooden Watering Can XP is inflated for one crop.** `handleUseTool` grants 1–2 XP per tool use _in addition to_ the normal watering path's XP (`waterCrop({ shouldReward: true })` is called first for the caller when they own the plot). Read the flow closely before tuning drop rates.
- **`Ecosystem` factory required.** Beyond the usual `Asset` / `DroppedAsset` / `Visitor` / `World` / `User`, this app also constructs an `Ecosystem` (in `inventoryCache.fetchInventoryData`) to enumerate ecosystem inventory items.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- View it in action: [Dev](https://topia.io/bounty-builder-dev), [Prod](https://topia.io/bounty-builder-prod)
- [Notion One Pager](https://app.notion.com/p/topiaio/Grow-Together-28740e35bdb980fb9c8deedc5084a2d2?v=71f6c3828d3b4f33960326f9bde24781)

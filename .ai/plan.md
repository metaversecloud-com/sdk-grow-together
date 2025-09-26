# Gardening Game Plan

Read `CLAUDE.md` and `.ai/style-guide.md` first. Do not propose any code yet.

## 1. Project Overview

A relaxing, loop-based gardening game where players plant seeds, grow crops, and harvest them to earn rewards.

This version focuses on core mechanics only: planting, growing, and harvesting. Future updates may include trading, crafting, pests, weather cycles, and cross-player co-op.

## 2. Core User Flow

1. Claim a plot from available plots in the world
2. Purchase seeds from the seed menu (some free, some cost coins)
3. Plant a seed in a specific square within your plot (4x4 grid)
4. Wait for growth time (real time, automatic background growth)
5. Harvest when plant reaches full growth (level 10)
6. Earn coins based on seed type
7. Use coins to unlock and purchase new seed types

## 3. Important Terminology

- **Key Asset**: A dropped asset that is already in world that when clicked will open this app in an iframe. All necessary credentials will be passed to that iframe by default. Note that this is separate from all plant dropped assets and will be the only dropped asset that is clickable in this version of the app.
- **Plot**: A dropped asset representing a 4x4 grid area in the world where players can plant seeds. Players must claim ownership before planting.
- **Seed**: A purchasable item type that can be planted in a plot square to grow a plant. Each seed has unique properties like cost, growth time, and reward value.
- **Plant**: A growing or harvestable crop (represented as a dropped asset) that yields coin rewards when harvested.
- **Growth Level**: A numeric value (0-10) representing how mature a plant is. Plants become harvestable at level 10.
- **Plot Square**: One of 16 positions (4x4 grid) within a plot where a single plant can be placed.

## 4. Technical Requirements

### Styling Guidelines

All client-side components MUST follow the comprehensive styling guide in `.ai/style-guide.md`.

#### Component-Specific Styling

- **Home Page**:

  - Use `.card` for instruction sections
  - Use `.h1` for main title, `.h2` for section headings
  - Use `.btn` for action buttons
  - Use `.flex-col` for vertical layout

- **Plot Selection**:

  - Use `.grid` for plot layout
  - Use `.card` with `.selected` modifier for active plots
  - Use `.p2` for plot information text
  - Use `.btn` for "Claim Plot" button

- **Seed Menu**:

  - Use `.card small` for individual seed items
  - Use `.card-title h3` for seed names
  - Use `.btn btn-outline` for secondary actions

- **Plant View**:
  - Use `.btn btn-danger` for delete actions
  - Use `.p3 text-muted` for timestamps

### Data Models

#### Seed Configuration (Static Data)

```ts
interface SeedConfig {
  id: number;
  name: string;
  cost: number; // 0 for free seeds
  reward: number; // coins earned when harvested
  growthTime: number; // total time in seconds to reach level 10
  imageVariations: {
    [growLevel: number]: string; // URL to image for each growth stage (0-10)
  };
}
```

**Default Seed Types:**

- Potato (ID: 1): Free, 60s growth, 2 coin reward
- Wheat (ID: 2): Free, 90s growth, 3 coin reward
- Tomato (ID: 3): 5 coins, 120s growth, 8 coin reward
- Pumpkin (ID: 4): 10 coins, 300s growth, 25 coin reward

#### Plot Grid Configuration

```ts
interface PlotGridConfig {
  gridSize: 4; // 4x4 grid of squares
  squareSpacing: 32; // pixels between plot squares
  plotDimensions: {
    width: 128; // total plot width in world units
    height: 128; // total plot height in world units
  };
}
```

#### World Data Object

```ts
interface WorldDataObject {
  [sceneDropId: string]: string; // Maps sceneDropId to assetId
}
```

The World's data object should contain an object keyed by `sceneDropId` with the value set to `assetId` (both pulled from req.query, see example usage of getCredentials in existing controllers). This should only be updated if the World data object does not already contain a value for the `sceneDropId`.

Example output:

```ts
{
  "exampleSceneDropId1": "exampleAssetId1",
  "exampleSceneDropId2": "exampleAssetId2"
}
```

#### Visitor Data Object

```ts
interface VisitorDataObject {
  coinsAvailable: number; // Current spendable coins
  totalCoinsEarned: number; // Lifetime coins earned (for unlocks)
  ownedPlot: {
    plotAssetId: string;
    claimedDate: string;
    plotSquares: {
      [squareIndex: number]: string | null; // droppedAssetId of plant or null if empty (0-15)
    };
  } | null; // null if no plot claimed yet
  seedsPurchased: {
    [seedId: number]: {
      id: number;
      datePurchased: string;
    };
  };
  plants: {
    [droppedAssetId: string]: {
      dateDropped: string;
      seedId: number;
      growLevel: number;
      squareIndex: number; // Which square in the plot (0-15)
      wasHarvested: boolean;
    };
  };
}
```

**Default Values for New Visitors:**

- `coinsAvailable`: 10 (starting coins)
- `totalCoinsEarned`: 0
- `ownedPlot`: null (no plot claimed initially)
- All other objects start empty

**Important:** Each visitor can only claim ONE plot. Once claimed, they cannot claim another plot.

The Visitors' data objects should be updated when actions outlined in the user stories are taken.

Example output:

```ts
{
  "coinsAvailable": 20,
  "totalCoinsEarned": 30,
  "ownedPlot": {
    "plotAssetId": "plotAssetId123",
    "claimedDate": "2025-09-17T00:00:00.000Z",
    "plotSquares": {
      0: "plantAssetId456", // square 0 has a plant
      1: null, // square 1 is empty
      2: "plantAssetId789", // square 2 has a plant
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
      9: null,
      10: null,
      11: null,
      12: null,
      13: null,
      14: null,
      15: null
    }
  },
  "seedsPurchased": {
    1: {
      id: 1,
      datePurchased: "2025-09-17T00:00:00.000Z"
    },
    3: {
      id: 3,
      datePurchased: "2025-09-17T00:00:00.000Z"
    }
  },
  "plants": {
    "plantAssetId456": {
      "dateDropped": "2025-09-17T00:00:00.000Z",
      "seedId": 1,
      "growLevel": 4,
      "squareIndex": 0,
      "wasHarvested": false
    },
    "plantAssetId789": {
      "dateDropped": "2025-09-17T00:10:00.000Z",
      "seedId": 3,
      "growLevel": 10,
      "squareIndex": 2,
      "wasHarvested": false
    }
  }
}
```

### API Endpoints

#### 1. Get Game State

```typescript
// GET /game-state
// Request: None (uses interactive parameters from query)
// Response: { success: true, data: VisitorDataObject }
```

#### 2. Claim Plot

```typescript
// POST /api/plot/claim
// Request: None (uses assetId from query params)
// Response: { success: true, data: { plotAssetId: string, claimedDate: string } }
// Note: Can only be called once per visitor. Will error if visitor already owns a plot.
```

#### 3. Purchase Seed

```typescript
// POST /seed/purchase
// Request: { seedId: number }
// Response: { success: true, data: { coinsRemaining: number } }
```

#### 4. Plant Seed

```typescript
// POST /api/plant/drop
// Request: { seedId: number, squareIndex: number }
// Response: { success: true, data: { droppedAssetId: string } }
// Note: squareIndex must be 0-15 and the square must be empty in visitor's owned plot
```

#### 5. Harvest Plant

```typescript
// POST /plant/harvest
// Request: { droppedAssetId: string }
// Response: { success: true, data: { coinsEarned: number, totalCoins: number } }
```

### State Management

The application will use the Global Context for state management with the following structure:

```typescript
interface GameState {
  coinsAvailable: number;
  totalCoinsEarned: number;
  availablePlots: Record<number, boolean>;
  seedsPurchased: Record<number, { id: number; datePurchased: string }>;
  plants: Record<
    string,
    {
      dateDropped: string;
      seedId: number;
      growLevel: number;
      plotId: number;
      wasHarvested: boolean;
    }
  >;
  selectedPlotId: number | null;
  selectedSeedId: number | null;
  availableSeeds: Array<{
    id: number;
    name: string;
    cost: number;
    reward: number;
    growthTime: number;
    imageUrl: string;
  }>;
}
```

## 5. Implementation File Structure

### Server-side Components (can be added to, modified, or removed if needed)

- `server/controllers/handleGetGameState.ts` - Get current game state for visitor
- `server/controllers/handleClaimPlot.ts` - Handle plot claiming
- `server/controllers/handlePurchaseSeed.ts` - Handle seed purchases
- `server/controllers/handlePlantSeed.ts` - Create and drop plant assets
- `server/controllers/handleHarvestPlant.ts` - Handle plant harvesting
- `server/controllers/handleUpdatePlantGrowth.ts` - Update plant growth level
- `server/routes.ts` - Register all API endpoints
- `server/utils/getPlantPosition.ts` - Calculate plant position relative to plot
- `server/utils/initializeVisitorData.ts` - Set default visitor data structure

### Client-side Components (can be added to, modified, or removed if needed)

- `client/src/pages/GardenHome.tsx` - Home page with instructions
- `client/src/pages/GardenPlots.tsx` - Plot selection and claiming
- `client/src/pages/GardenSeeds.tsx` - Seed selection and purchase
- `client/src/pages/GardenPlant.tsx` - Plant viewing and harvesting
- `client/src/components/PlotGrid.tsx` - Grid of available plots
- `client/src/components/SeedCard.tsx` - Individual seed card component
- `client/src/components/PlantDetails.tsx` - Plant details with growth indicator
- `client/src/components/GrowthTimer.tsx` - Visual growth timer component
- `client/src/utils/calculateGrowthLevel.ts` - Calculate growth based on time
- `client/src/utils/formatCurrency.ts` - Format coin amounts

## 6. User Stories & Acceptance Criteria

### Epic 1: Home Page

User Story 1.1 - Clicking on a key asset to get instructions for how to play

As a player I want to view details about the app so I better understand how to play

✅ Acceptance Criteria:

- User opens app by clicking on the key asset with a link to the homepage of the app `${req.hostname}`
- Home page should show basic instructions for how to claim a plot, purchase seeds, plant seeds, and harvest plants.

Epic 2: Claiming a Plot

User Story 2.1 - Clicking on a plot to open the app

As a player I want to claim a plot so that I can plant seeds, watch my garden grow, and harvest plants

✅ Acceptance Criteria:

- User opens app by clicking on a Plot asset with a default link of `${req.hostname}/plot` which should navigate them to a Plot page in the UI
- If the current visitor does not own any plot yet:
  - Show a "Claim This Plot" button
  - After claiming, update the plot's clickable link to `${req.hostname}/plot?ownerName=${displayName}&ownerProfileId=${profileId}`
  - Visitor can only claim ONE plot total - if they already own a plot, show error message
- If `ownerId` exists but doesn't match current visitor's `profileId`:
  - Plot is owned by another player - show owner's name and read-only view
  - No claim button available
- If `ownerId` matches current visitor's `profileId`:
  - Show the visitor's owned plot with 4x4 grid of squares
  - Display planted seeds/plants in their respective squares
  - Provide button to access Seed Menu for purchasing more seeds

Epic 3: Planting Seeds

### Growth System Logic

**Growth Calculation:**

- Each seed has a `growthTime` (total seconds to reach level 10)
- Growth level = Math.floor((currentTime - dateDropped) / (growthTime / 10))
- Growth level is capped at 10 (fully grown)
- Each growth level (0-10) has a corresponding image variation

**Image Variations:**
All plant images are stored by seedId with growth levels 0-10:

```typescript
const s3URL = "https://topia-dev-test.s3.us-east-1.amazonaws.com/bounty";
const PLANT_IMAGES = {
  1: {
    // Potato (harvest at level 3)
    0: `${s3URL}/potato-0.png`,
    1: `${s3URL}/potato-1.png`,
    2: `${s3URL}/potato-2.png`,
    3: `${s3URL}/potato-3.png`,
  },
  // ... other seed types
};
```

User Story 3.1 – Seed Selection

As a player, I want to view and select seeds from a menu so I can choose what to grow. Only available when a player owns the Plot they are interacting with.

✅ Acceptance Criteria:

- Player can open a seed menu
  - Each seed shows: id, name, image, cost, reward. If the seed has been planted it should also show growth time
  - There should be several plants that are free and some that cost x coins
  - Locked seeds are visibly grayed out with unlock info
  - Selecting a seed highlights it and readies it for planting
- Player can chose where to plant seed within their plot
  - Player sees a 4x4 grid of clickable squares
  - Squares that are unavailable should be disabled
  - Clicking on an available square should select and highlight it

User Story 3.2 – Plant a Seed

As a player, I want to click a button to plant a seed in the world (create & drop a new DroppedAsset in the world using the clicked image URL)

✅ Acceptance Criteria:

- Once a seed and a square is selected the Plant Seed button should be enabled
- Clicking Plant Seed drops the new DroppedAsset in the world
  - DroppedAsset `position` is calculated relative to the Plot's position using the square index (0-15 maps to 4x4 grid coordinates)
  - DroppedAsset `layer1` should use the growth level 0 image for the selected seedId
  - DroppedAsset should have clickType = "link" and clickableLink = `${req.hostname}/plant?seedId=${seedId}&ownerProfileId=${profileId}`
- The Visitor's data is updated:
  - `plants` object adds entry keyed by `droppedAsset.id` with: `dateDropped`, `seedId`, `growLevel: 0`, `squareIndex`, `wasHarvested: false`
  - `ownedPlot.plotSquares[squareIndex]` is set to the new `droppedAsset.id`

User Story 3.3 – Plant Page + Growth Timer

As a player, I want crops to grow over time so that they feel alive and rewarding to harvest.

✅ Acceptance Criteria:

- User opens app by clicking on a Plant asset with a default link of `${req.hostname}/plant` which should navigate them to a Plant page in the UI
- If `ownerProfileId` does not match current visitor's `profileId`, show read-only plant details and owner's name
- If `ownerProfileId` matches current visitor's `profileId`:
  - Calculate current growth level using the growth formula: `Math.floor((currentTime - dateDropped) / (growthTime / 10))`
  - If calculated growth level is higher than stored `growLevel`, update both:
    - Visitor's data object `plants[assetId].growLevel`
    - DroppedAsset's `layer1` image to match new growth level
  - Show current growth progress, time remaining until next level, and harvest button (if fully grown)

Epic 4: Harvesting and Rewards

User Story 4.1 – Harvest a Crop

As a player, I want to harvest grown crops to earn rewards and use them later. (Same screen accessed via clicking on a plant dropped asset, see User Story 3.3)

✅ Acceptance Criteria:

- When a plant finishes growing (`growLevel` >= 10), a particle effect should be triggered at the plant's position
- In the UI, player can click "Harvest" button which is only enabled when `growLevel` >= 10
- Once harvested:
  - DroppedAsset is removed from the world
  - Visitor's data object is updated:
    - `ownedPlot.plotSquares[squareIndex]` is set to `null` (freeing the square)
    - `plants[assetId].wasHarvested` is set to `true`
    - `coinsAvailable` and `totalCoinsEarned` increase by the seed's reward value
- Harvested plants are hidden from UI and no longer appear in the plot grid

User Story 4.2 – Use Rewards to Unlock More Seeds

As a player, I want to use my earnings to unlock new types of seeds with higher value.

✅ Acceptance Criteria:

- Rewards are tracked as `totalCoinsEarned` in the Visitor's data object
- New seed types become unlockable/enabled if the Visitor has earned enough coins to purchase them
- Buying a seed unlocks it permanently for future use adding it to the `seedsPurchased` object which should be keyed by seed id and include a datetime stamp for `datePurchased` and decreases `coinsAvailable` by the cost

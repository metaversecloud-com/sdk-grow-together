# Grow Together

## Introduction / Summary

A relaxing, loop-based gardening game where players claim plots, plant seeds, grow crops, and harvest them to earn rewards. This interactive social experience allows players to visit each other's gardens, decorate their plots, and create a thriving community of gardeners.

## Key Features

### Core Gameplay

- **Plot Management**: Claim and manage your own 4x4 garden plot in the world.
- **Seed Variety**: Access a diverse collection of seeds with different growth times, rewards, and rarity levels.
- **Real-time Growth**: Plants grow in real-time with multiple visual growth stages.
- **Watering System**: Water your plants to keep them healthy and growing.
- **Harvest Rewards**: Harvest mature crops to earn coins based on plant type and rarity.
- **In-game Economy**: Use earned coins to purchase new seeds and decorative items.

### Social Features

- **Garden Visiting**: Visit other players' gardens to see their designs and progress.
- **Plot Teleportation**: Quickly teleport to your plot from anywhere in the world.
- **Owner Recognition**: Each plot and plant shows the owner's name for recognition.

### Decoration System

- **Decorative Items**: Purchase and place a variety of decorative items to personalize your garden.
- **Item Categories**: Various decoration types including animals, garden accessories, and more.
- **Rarity Levels**: Common, Uncommon, and Rare items with corresponding coin costs.

### Admin Tools

- **Plot Management**: Admins can clear individual plots or all plots in a world.

## Technical Architecture

The app uses a combination of data objects, dropped assets, and interactive elements to create a persistent garden experience.

### Data Objects

_We use data objects to store information about each implementation of the app per world._

### World

The data object attached to the world stores ownership information about all plots in the world.

```ts
{
  claimedPlots: {
    [plotAssetId: string]: string | null; // profileId of owner or null if unclaimed
  };
};
```

### Plot Assets

The data objects attached to the dropped plot assets store information related to each specific plot.

```ts
{
  ownerId?: string; // profileId of the owner
  ownerName?: string; // displayName of the owner
  claimedDate?: string; // ISO date string when the plot was claimed
};
```

### Crop Assets

The data objects attached to the dropped crop assets store information related to each specific crop.

```ts
{
  ownerId: string; // profileId of the owner
  ownerName: string; // displayName of the owner
  dateDropped: string; // When the crop was planted
  lastWatered: string; // When the crop was last watered
  seedId: string; // ID of the seed that was planted
  growLevel: number; // Current growth level (0-10)
  squareId: number; // Which square in the plot (0-15)
}
```

### Decoration Assets

The data objects attached to the dropped decoration assets.

```ts
{
  decorationId: string; // ID of the decoration
  ownerId?: string; // profileId of the owner
  ownerName?: string; // displayName of the owner
  dateDropped: string; // When the decoration was placed
  squareId: number; // Which square in the plot (0-15)
}
```

### Visitors

The data object attached to the visitor stores ecosystem information for each visitor as well as plot ownership information per world keyed by `urlSlug`.

```ts
{
  lastDateCoinsEarned: string; // ISO date string when coins were last earned
  totalCoinsEarned: number; // Lifetime coins earned (for unlocks)
  worlds: {
    plotAssetId: string | null;
    claimedDate: string;
    plotSquares: {
      [squareId: number]: string | null; // droppedAssetId of crop or null if empty
    };
    crops: {
      [droppedAssetId: string]: CropDataObjectType;
    };
    decorations: {
      [droppedAssetId: string]: PlacedDecorationDataObjectType;
    };
  };
};
```

## API Endpoints

The application exposes the following API endpoints:

### Game State

- `GET /game-state` - Get the current game state for a visitor

### Admin Routes

- `POST /admin/clear-plot` - Clear a specific plot (admin only)
- `POST /admin/clear-all-plots` - Clear all plots in the world (admin only)

### Plot Management

- `POST /plot/claim` - Claim ownership of a plot
- `POST /plot/teleport` - Teleport to a plot
- `POST /plot/view` - Open plot iframe view
- `POST /square/view` - Open plot square iframe view
- `GET /square` - Get information about a specific plot square

### Crop Management

- `POST /seed/purchase` - Purchase a seed
- `POST /crop/drop` - Plant a seed in a plot square
- `POST /crop/water` - Water a growing crop
- `POST /crop/harvest` - Harvest a fully grown crop
- `POST /crop/remove` - Remove a crop from a plot

### Decoration Management

- `POST /decoration/purchase` - Purchase a decoration
- `POST /decoration/drop` - Place a decoration in a plot square
- `POST /decoration/remove` - Remove a decoration from a plot

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

### Getting Started

1. **Clone the repository and install dependencies**

```bash
git clone https://github.com/metaversecloud-com/sdk-grow-together.git
cd sdk-bounty-builder
npm install
```

2. **Install server dependencies**

```bash
cd server
npm install
cd ..
```

3. **Install client dependencies**

```bash
cd client
npm install
cd ..
```

4. **Configure environment variables**
   Create a `.env` file in the root directory with the following:

```
API_KEY=xxxxxxxxxxxxx
INSTANCE_DOMAIN=api.topia.io
INSTANCE_PROTOCOL=https
INTERACTIVE_KEY=xxxxxxxxxxxxx
INTERACTIVE_SECRET=xxxxxxxxxxxxxx
```

### Where to find API_KEY, INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Resources

- [SDK Developer Documentation](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- [Topia Interactive Apps Overview](https://topia.io/developers)


# Bounty Builders

## Introduction / Summary

A relaxing, loop-based gardening game where players plant seeds, grow crops, and harvest them to earn rewards.

## Key Features

### Canvas elements & interactions

- Plot Assets: Users can claim a plot where they can then purchase seeds, plant seeds, watch their garden grow, and harvest plants.
- Plant Assets: Users can click on a plant in the world and check on it's status. If it's fully grown they can harvest that plant to earn coins to purchase additional seeds.

### Drawer content

- Claim a plot and view details
- Purchase and plant seeds
- Check on plant status and harvest once grown

### Data objects

_We use data objects to store information about each implementation of the app per world._

- Plot Asset: the data object attached to the dropped key asset will store information related to this specific plot. Example data:
  - ownerId
  - ownerName
- Visitor: the data object attached to the visitor will store information for each visitor per world keyed by `urlSlug`. Example data:
  - coinsAvailable: Current spendable coins
  - totalCoinsEarned: Lifetime coins earned (for unlocks)
  - ownedPlot:
    - plotAssetId
    - claimedDate: string;
    - plotSquares
  - seedsPurchased
  - plants

## Developers:

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![SDK Styles](https://sdk-style.s3.amazonaws.com/example.html)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### Getting Started

- Clone this repository
- Run `npm i` in server
- `cd client`
- Run `npm i` in client
- `cd ..` back to server

### Add your .env environmental variables

```json
API_KEY=xxxxxxxxxxxxx
INSTANCE_DOMAIN=api.topia.io
INSTANCE_PROTOCOL=https
INTERACTIVE_KEY=xxxxxxxxxxxxx
INTERACTIVE_SECRET=xxxxxxxxxxxxxx
```

### Where to find API_KEY, INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- [View it in action!](topia.io/appname-prod)
- To see an example of an on canvas turn based game check out TicTacToe:
  - (github))[https://github.com/metaversecloud-com/sdk-tictactoe]
  - (demo))[https://topia.io/tictactoe-prod]

## New for June 2025: Multiplayer Experience Engine

Topia has developed a powerful new Experience Engine that enables extremely low-latency, interactive in-canvas multiplayer experiences. This engine is purpose-built for real-time interaction and supports a wide range of dynamic behaviors, making it ideal for collaborative activities, games, and social experiences within Topia worlds.

### Key Features

- Ultra Low Latency: Real-time feedback for seamless multi-user interaction and state synchronization.
- Physics & Collision: Includes a robust physics and collision system to support realistic and responsive behaviors.
- Real-Time Interactivity: Supports dynamic responses to user input and environmental changes inside the canvas.
- Optimized for the Web: Engineered to perform smoothly across browser-based environments with minimal resource impact.

### SDK Integration: Leverage the SDK inside the Experience Engine to:

- Trigger visual/audio effects based on real-time interactions
- Save and persist spatial data, such as object positions or interaction states

This engine unlocks a whole new layer of interactivity, paving the way for creative, immersive experiences including educational tools, multiplayer games, or collaborative activities.

### Get In Touch

To sign up for the experience engine private beta, visit https://topia.io/p/game-engine.

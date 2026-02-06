# Claude Development Guidelines

This document provides Claude-specific guidelines for working with this Topia SDK React + TypeScript template repository.

## Project Context

- **Stack**: React + TypeScript (client), Node + Express (server)
- **SDK**: JavaScript RTSDK – Topia Client Library (@rtsdk/topia)
- **SDK Documentation**: https://metaversecloud-com.github.io/mc-sdk-js/index.html
- **Baseline Repository**: https://github.com/metaversecloud-com/sdk-ai-boilerplate

## Core Development Rules

### File Modification Restrictions

**DO NOT MODIFY these protected files:**

- `client/App.tsx`
- `client/src/components/PageContainer.tsx`
- `client/backendAPI.ts`
- `client/setErrorMessage.ts`
- `server/getCredentials.ts`
- `server/errorHandler.ts`

**REQUIRED FILES:**

- `client/topiaInit.ts` MUST exist (may adjust exports if needed)

### Architecture & Data Flow

1. **Server-First Architecture**: All SDK calls happen in server routes/controllers or server/utils - NEVER directly from React
2. **API Flow**: UI → `client/backendAPI.ts` (unchangeable) → server routes/controllers → Topia SDK
3. **New Client Behavior**: Expose new server routes; do NOT bypass `backendAPI.ts`
4. **Follow Existing Patterns**: Use patterns in existing client files for pages, components, and server calls

### SDK Usage Guidelines

#### Initialization

- Initialize Topia ONCE on the server with environment variables:
  - `API_KEY`, `INTERACTIVE_KEY`, `INTERACTIVE_SECRET`
  - `INSTANCE_DOMAIN=api.topia.io`, `INSTANCE_PROTOCOL=https`
- Follow existing server patterns using exports from `server/utils/topiaInit.ts`

#### Error Handling

- Wrap all SDK calls in try/catch blocks
- Either return JSON `{ success: boolean, ... }` or throw and let `server/errorHandler.ts` handle it
- Follow existing controller patterns for error handling

#### Data Objects Pattern

World/Visitor/User/DroppedAsset classes provide these methods:

- `fetchDataObject` - Get current data
- `setDataObject` - Set initial/complete data
- `updateDataObject` - Update partial data
- `incrementDataObjectValue` - Increment numeric values

**CRITICAL**: Always ensure defaults before calling `updateDataObject`:

1. Check if data object exists
2. If missing properties, call `setDataObject` with default shape
3. Then safely use `updateDataObject`

Follow the pattern: `handleGetGameState.ts` → `getDroppedAsset` → `initializeDroppedAssetDataObject`

#### Analytics Integration

All data object methods accept optional `analytics` array:

```typescript
await visitor.setDataObject(
  { hello: "world" },
  { analytics: [{ analyticName: "starts" }], lock: { lockId, releaseLock: true } },
);

await visitor.updateDataObject(
  {},
  { analytics: [{ analyticName: "emotesUnlocked", profileId, uniqueKey: profileId, urlSlug }] },
);

await visitor.incrementDataObjectValue(`completions`, 1, {
  analytics: [{ analyticName: "completions", incrementBy: 2, profileId, uniqueKey: profileId, urlSlug }],
});
```

### Response Schema (Controllers)

- **Success**: `{ success: true, data?: any }`
- **Failure**: `{ success: false, error: string }` (handled by errorHandler.ts)
- **HTTP Codes**: 200 (success), 204 (no body), 4xx (validation), 5xx (SDK/server)

## Styling Requirements

### SDK CSS Classes (REQUIRED)

**MUST use SDK CSS classes from**: https://sdk-style.s3.amazonaws.com/styles-3.0.2.css

#### Typography

```tsx
<h1 className="h1">Heading 1</h1>
<h2 className="h2">Heading 2</h2>
<p className="p1">Standard body text</p>
<p className="p2">Medium body text</p>
```

#### Buttons

```tsx
<button className="btn">Primary Action</button>
<button className="btn btn-outline">Secondary Action</button>
<button className="btn btn-text">Text Button</button>
<button className="btn btn-danger">Error Button</button>
```

#### Cards

```tsx
<div className="card">
  <div className="card-image">
    <img src="image-url.jpg" alt="Description" />
  </div>
  <div className="card-details">
    <h3 className="card-title">Title</h3>
    <p className="card-description p2">Description</p>
    <div className="card-actions">
      <button className="btn btn-icon">
        <img src="https://sdk-style.s3.amazonaws.com/icons/edit.svg" />
      </button>
    </div>
  </div>
</div>
```

#### Form Elements

```tsx
<label className="label">Text Input</label>
<input className="input" type="text" placeholder="placeholder" />

<label className="label">
  <input className="input-checkbox" type="checkbox" />
  Checkbox Label
</label>
```

### Styling Rules

- **SDK Classes First**: Always use SDK classes before considering alternatives
- **No Tailwind**: Only use Tailwind when no SDK class exists
- **No Inline Styles**: Except for dynamic positioning that cannot be handled via classes
- **Consistent Structure**: Follow component patterns in `.ai/examples/`

### Component Structure Pattern

```tsx
// Imports grouped by type
import { useContext, useState } from "react";

// components (using aliased imports)
import { PageContainer } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

interface ComponentProps {
  // Props definition
}

export const ComponentName = ({ prop1, prop2 }: ComponentProps) => {
  // Global context access
  const dispatch = useContext(GlobalDispatchContext);

  // Local state
  const [localState, setLocalState] = useState(initialValue);

  // Event handlers with proper error handling
  const handleEvent = async () => {
    try {
      // Implementation using SDK classes
    } catch (err) {
      setErrorMessage(dispatch, err as ErrorType);
    }
  };

  return (
    <div className="container">
      <h2 className="h2">Title</h2>
      <div className="card">{/* Content using SDK classes */}</div>
    </div>
  );
};

export default ComponentName;
```

## Testing Requirements (Jest)

- Add tests under `server/__tests__/` for each new/changed route
- Map `@rtsdk/topia` to `server/mocks/@rtsdk/topia.ts`
- Assert: HTTP status, JSON schema, correct SDK method & args, credentials flow

## Environment Setup

Provide `.env.example` with:

```
API_KEY=your_api_key_here
INTERACTIVE_KEY=your_interactive_key_here
INTERACTIVE_SECRET=your_interactive_secret_here
INSTANCE_DOMAIN=api.topia.io
INSTANCE_PROTOCOL=https
```

---

## Interactive Keys & Authentication

### Key Types

SDK apps use **Interactive Keys** for authentication. These are created in topia-gateway by developers:

| Key                              | Storage                       | Purpose                              |
| -------------------------------- | ----------------------------- | ------------------------------------ |
| `INTERACTIVE_KEY` (publicKey)    | `.env`, passed to clients     | Identifies the app, linked to assets |
| `INTERACTIVE_SECRET` (secretKey) | `.env` only, **never expose** | Signs JWTs for API authentication    |
| `API_KEY`                        | `.env` only                   | Optional admin-level access          |

### How Interactive Keys Work

```
Developer Setup (topia-gateway):
┌─────────────────────────────────────────────────────────────────┐
│ 1. Developer creates Interactive Key in topia-gateway           │
│    → Generates: publicKey (Firestore doc ID)                    │
│    → Generates: secretKey (base64-encoded UUID)                 │
│ 2. Developer adds inventory items to the key                    │
│ 3. Developer links key to assets in topia-client                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
Runtime (when user clicks asset):
┌─────────────────────────────────────────────────────────────────┐
│ 1. Topia generates interactiveNonce (session-specific)          │
│ 2. Topia opens iframe with credentials in URL query params      │
│ 3. SDK app extracts credentials, signs JWT with secretKey       │
│ 4. public-api validates JWT signature + nonce                   │
└─────────────────────────────────────────────────────────────────┘
```

### JWT Signing Process

The SDK automatically signs requests using the `interactiveSecret`:

```typescript
// Inside SDK (SDKController.ts) - happens automatically
const payload = {
  interactiveNonce, // Session nonce from Topia
  visitorId, // Current visitor
  assetId, // Asset that was clicked
  urlSlug, // Current world
  profileId, // User's global profile
  date: new Date(), // Timestamp
};
const jwt = jwt.sign(payload, topia.interactiveSecret);

// JWT sent as header: InteractiveJWT
// Public key sent as header: PublicKey
```

### Server Initialization

**File:** `server/utils/topiaInit.ts`

```typescript
import { Topia, DroppedAssetFactory, VisitorFactory, WorldFactory } from "@rtsdk/topia";

// Initialize ONCE with secrets from environment
const topia = new Topia({
  apiDomain: process.env.INSTANCE_DOMAIN, // "api.topia.io"
  apiProtocol: process.env.INSTANCE_PROTOCOL, // "https"
  apiKey: process.env.API_KEY, // Optional admin key
  interactiveKey: process.env.INTERACTIVE_KEY, // Public key (sent in headers)
  interactiveSecret: process.env.INTERACTIVE_SECRET, // Secret (signs JWTs)
});

// Export factories for use in controllers
export const DroppedAsset = new DroppedAssetFactory(topia);
export const Visitor = new VisitorFactory(topia);
export const World = new WorldFactory(topia);
```

---

## Platform-to-App Communication

SDK apps are **external applications** that you build and host. Topia communicates with your app via two mechanisms:

### Iframes (Interactive UI)

When a user clicks an interactive asset, Topia opens your app in an **iframe drawer**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     TOPIA WORLD                                  │
│                                                                  │
│    User clicks interactive asset with your publicKey             │
│              ↓                                                   │
│    Topia opens iframe with YOUR app's URL + credentials          │
│              ↓                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ YOUR SDK APP (React frontend in iframe)                 │    │
│  │                                                         │    │
│  │ URL: https://your-app.com/?visitorId=123&               │    │
│  │      interactiveNonce=abc&urlSlug=my-world&...          │    │
│  │                                                         │    │
│  │ • Build any UI (React, Vue, vanilla JS)                 │    │
│  │ • Extract credentials from URL query params             │    │
│  │ • Call your Express backend → SDK → Topia APIs          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**

- You control the entire UI - build any experience
- Credentials arrive as URL query parameters
- Your app runs on YOUR servers, not Topia's
- Use `isOpenLinkInDrawer: true` to open in sidebar drawer

### Webhooks (Server-to-Server)

Assets can trigger webhooks to your backend without showing UI:

```
User clicks asset → Topia POSTs to your backend
                         ↓
POST https://your-app.com/api/webhook
Body: { visitorId, interactiveNonce, assetId, urlSlug, ... }
```

**Use Cases:**

- Trigger actions without UI (answer zones, checkpoints)
- Process events server-side
- Update world state based on user actions

---

## Session Credentials

### Credential Flow

Both iframes and webhooks receive session credentials - info about who triggered the action:

**Iframes:** Credentials in URL query params

```
https://your-app.com/?visitorId=123&interactiveNonce=abc&urlSlug=my-world&...
```

**Webhooks:** Credentials in POST body

```json
{ "visitorId": 123, "interactiveNonce": "abc", "urlSlug": "my-world", ... }
```

### Credential Parameters

| Parameter              | Type   | Description                                 |
| ---------------------- | ------ | ------------------------------------------- |
| `visitorId`            | number | User's visitor ID in this world             |
| `interactiveNonce`     | string | One-time session token (validates in Redis) |
| `interactivePublicKey` | string | Your app's public key                       |
| `urlSlug`              | string | Current world's URL slug                    |
| `profileId`            | string | User's global profile ID                    |
| `assetId`              | string | The clicked asset's ID                      |
| `displayName`          | string | User's display name                         |
| `username`             | string | User's username                             |
| `identityId`           | string | User's identity ID                          |
| `sceneDropId`          | string | Scene drop identifier                       |
| `uniqueName`           | string | Asset's unique name (if set)                |

### Client-Side Extraction

**File:** `client/src/App.tsx`

```typescript
const [searchParams] = useSearchParams();

const interactiveParams = useMemo(
  () => ({
    assetId: searchParams.get("assetId") || "",
    visitorId: searchParams.get("visitorId") || "",
    interactiveNonce: searchParams.get("interactiveNonce") || "",
    interactivePublicKey: searchParams.get("interactivePublicKey") || "",
    urlSlug: searchParams.get("urlSlug") || "",
    profileId: searchParams.get("profileId") || "",
    displayName: searchParams.get("displayName") || "",
    username: searchParams.get("username") || "",
    // ... other params
  }),
  [searchParams],
);

// Setup backend API with credentials
useEffect(() => {
  if (interactiveParams.assetId) {
    setupBackendAPI(interactiveParams);
  }
}, [interactiveParams]);
```

### Backend API Interceptor

**File:** `client/src/utils/backendAPI.ts`

```typescript
// Axios interceptor adds credentials to EVERY request as query params
backendAPI.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    assetId: interactiveParams.assetId,
    visitorId: interactiveParams.visitorId,
    interactiveNonce: interactiveParams.interactiveNonce,
    interactivePublicKey: interactiveParams.interactivePublicKey,
    urlSlug: interactiveParams.urlSlug,
    profileId: interactiveParams.profileId,
    // ... all other credentials
  };
  return config;
});
```

### Server-Side Extraction

**File:** `server/utils/getCredentials.ts`

```typescript
export const getCredentials = (query: any): Credentials => {
  // 1. Validate required fields
  const requiredFields = ["interactiveNonce", "interactivePublicKey", "urlSlug", "visitorId"];
  const missingFields = requiredFields.filter((f) => !query[f]);
  if (missingFields.length > 0) {
    throw `Missing required parameters: ${missingFields.join(", ")}`;
  }

  // 2. Validate public key matches environment
  if (process.env.INTERACTIVE_KEY !== query.interactivePublicKey) {
    throw "Provided public key does not match";
  }

  // 3. Return typed credentials
  return {
    assetId: query.assetId as string,
    visitorId: Number(query.visitorId), // Convert to number
    interactiveNonce: query.interactiveNonce as string,
    interactivePublicKey: query.interactivePublicKey as string,
    urlSlug: query.urlSlug as string,
    profileId: query.profileId as string,
    displayName: query.displayName as string,
    username: query.username as string,
    // ... other fields
  };
};
```

### Using Credentials in Controllers

```typescript
// server/controllers/handleGetGameState.ts
export const handleGetGameState = async (req: Request, res: Response) => {
  const credentials = getCredentials(req.query);
  const { assetId, profileId, urlSlug, visitorId } = credentials;

  // Pass credentials to SDK methods
  const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
  const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

  // SDK automatically signs requests with JWT using these credentials
  await visitor.fetchDataObject();
  await droppedAsset.fetchDataObject();

  res.json({ success: true, data: { ... } });
};
```

---

## Dropped Assets

### What is a Dropped Asset?

A **DroppedAsset** is an asset placed in a Topia world. SDK apps interact with dropped assets to:

- Store game state in `dataObject`
- Configure click behavior (links, webhooks)
- Update visual appearance (layers, scale, position)
- Make assets interactive

### Key Methods

| Method                                           | Purpose                    |
| ------------------------------------------------ | -------------------------- |
| `DroppedAsset.get(id, urlSlug, { credentials })` | Fetch existing asset       |
| `DroppedAsset.drop(asset, options)`              | Place new asset in world   |
| `fetchDataObject()`                              | Get asset's custom data    |
| `setDataObject(data, options)`                   | Replace entire data object |
| `updateDataObject(data, options)`                | Merge/update partial data  |
| `incrementDataObjectValue(path, amount)`         | Atomic increment           |
| `updateClickType(options)`                       | Configure click behavior   |
| `deleteDroppedAsset()`                           | Remove asset from world    |

### Click Types

```typescript
enum DroppedAssetClickType {
  NONE = "none", // No click action
  LINK = "link", // Open URL (iframe or new tab)
  PORTAL = "portal", // Teleport to another world
  TELEPORT = "teleport", // Teleport within world
  WEBHOOK = "webhook", // Trigger webhook
}
```

### Dropping New Assets

```typescript
// server/controllers/handlePlantSeed.ts
import { Asset, DroppedAsset } from "../utils/topiaInit";
import { DroppedAssetClickType } from "@rtsdk/topia";

// 1. Get the base asset template
const asset = await Asset.create(process.env.SEED_ASSET_ID, { credentials });

// 2. Drop it into the world with configuration
const cropAsset = await DroppedAsset.drop(asset, {
  position: { x: 100, y: 200 },
  urlSlug,
  uniqueName: `GrowTogether_crop_${profileId}`, // For easy lookup later

  // Make it interactive
  isInteractive: true,
  interactivePublicKey: credentials.interactivePublicKey,

  // Configure click behavior
  clickType: DroppedAssetClickType.LINK,
  clickableLink: `${BASE_URL}/crop?profileId=${profileId}`,
  clickableLinkTitle: "View Crop",
  isOpenLinkInDrawer: true,

  // Visual layers
  layer0: "", // Background layer
  layer1: seedImageUrl, // Main image
});

// 3. Store game data on the asset
await cropAsset.setDataObject({
  dateDropped: Date.now(),
  seedId: "carrot",
  growLevel: 0,
  ownerId: profileId,
  ownerName: displayName,
});
```

### Fetching Assets by Unique Name

```typescript
// server/utils/getPlotAssets.ts
const world = await World.create(urlSlug, { credentials });

// Fetch all assets with matching unique name pattern
const plotAssets = await world.fetchDroppedAssetsWithUniqueName({
  uniqueName: "GrowTogether_plot",
});

// Fetch each asset's data object
for (const asset of plotAssets) {
  const plotAsset = await DroppedAsset.get(asset.id, urlSlug, {
    credentials: { ...credentials, assetId: asset.id },
  });
  await plotAsset.fetchDataObject();
  console.log(plotAsset.dataObject);
}
```

### Locking for Concurrent Operations

Use locks to prevent race conditions:

```typescript
// Create a time-based lock ID (reduces collisions)
const lockId = `plot_${assetId}_${Math.floor(Date.now() / 60000) * 60000}`;

// Acquire lock with updateDataObject
await droppedAsset.updateDataObject(
  {}, // Empty update just to acquire lock
  { lock: { lockId } },
);

// Do your operations...

// Release lock when done
await droppedAsset.updateDataObject({ lastUpdated: Date.now() }, { lock: { lockId, releaseLock: true } });
```

---

## Backend Validation (How Topia Validates Your Requests)

When your SDK app makes a request, Topia's `public-api` validates:

1. **JWT Signature**: Verifies JWT was signed with the correct `secretKey`
2. **Nonce Validation**: Checks `interactiveNonce` matches Redis (prevents replay attacks)
3. **Asset Configuration**: Confirms the dropped asset has `isInteractive=true` and matching `interactivePublicKey`
4. **Permissions**: Checks the public key has required permissions for the action

```
SDK App Request
     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    public-api Validation                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Extract JWT from InteractiveJWT header                       │
│ 2. Extract publicKey from PublicKey header                      │
│ 3. Fetch secretKey from Firestore (publicKeys collection)       │
│ 4. jwt.verify(jwt, secretKey) ← Validates signature             │
│ 5. Decode JWT payload: { visitorId, nonce, assetId, urlSlug }   │
│ 6. Redis: HGET playersNonce:{urlSlug}:{visitorId} interactiveNonce │
│ 7. Compare nonce from JWT vs Redis ← Prevents replay attacks    │
│ 8. Fetch droppedAsset from RTDB                                 │
│ 9. Validate asset.interactivePublicKey === publicKey            │
│ 10. ✓ Request authorized                                        │
└─────────────────────────────────────────────────────────────────┘
     ↓
  Route Handler
```

### Security Properties

- **Nonce**: Unique per visitor per world session, stored in Redis
- **JWT Signature**: Proves request came from your app (only you have secretKey)
- **Asset Validation**: Ensures you can only control your own interactive assets
- **Time-based**: JWT includes timestamp, nonce changes per session

## Implementation Workflow

1. **PLAN FIRST** - Output concise plan before coding:

   - File tree delta
   - Endpoint signatures
   - Data shapes (TS interfaces)
   - Styling requirements

2. **IMPLEMENT** - Minimal changes satisfying constraints & tests

3. **TEST** - Add/adjust Jest tests with SDK mock coverage

4. **VALIDATE STYLING** - Verify components follow style guide

5. **EXPLAIN** - Provide deliverable format output

## Deliverable Format

When implementing changes, return:

1. **Affected Files** (paths)
2. **Diffs or Full New Files**
3. **Short Rationale**
4. **Test Updates**
5. **Styling Validation Report** (for client components)
6. **Run Steps**

## When Blocked

If SDK calls or inputs are unclear:

- STOP, propose minimal stub
- List assumptions
- Ask 1 concise question
- If no answer, proceed with safest assumption and mark TODOs

## Inventory System Usage

This app demonstrates comprehensive inventory usage with the Topia SDK.

### Inventory Items

The grow-together app uses these inventory item types:

| Item            | Type       | Purpose                               |
| --------------- | ---------- | ------------------------------------- |
| Seeds           | `ITEM`     | Plantable items (purchased or earned) |
| Harvested Crops | `ITEM`     | Results from harvesting plants        |
| Coins           | `CURRENCY` | In-game currency for purchases        |

### Key Inventory Utilities

**Location:** `server/utils/inventory/`

```typescript
// modifyInventoryItem.ts - Central inventory modification utility
import { modifyInventoryItem } from "../utils/inventory/modifyInventoryItem";

// Grant items (positive quantity)
await modifyInventoryItem({
  visitor,
  itemName: "Carrot Seed",
  quantity: 5,
  credentials,
});

// Deduct items (negative quantity)
await modifyInventoryItem({
  visitor,
  itemName: "Coins",
  quantity: -10,
  credentials,
});
```

### Inventory Flow Examples

**Purchase Flow (`handlePurchaseSeed.ts`):**

```typescript
// 1. Check user has enough coins
const inventory = await visitor.fetchInventoryItems();
const coins = inventory.find((i) => i.itemName === "Coins");
if (coins.quantity < seedPrice) throw new Error("Insufficient coins");

// 2. Deduct coins
await modifyInventoryItem({ visitor, itemName: "Coins", quantity: -seedPrice });

// 3. Grant seeds
await modifyInventoryItem({ visitor, itemName: seedType, quantity: seedCount });
```

**Harvest Flow (`handleHarvestCrop.ts`):**

```typescript
// 1. Validate plant is ready
// 2. Grant harvested items
await modifyInventoryItem({ visitor, itemName: cropType, quantity: harvestAmount });

// 3. Optionally grant bonus coins
await modifyInventoryItem({ visitor, itemName: "Coins", quantity: bonusCoins });
```

### SDK Methods Used

```typescript
// Fetch user's inventory
const items = await visitor.fetchInventoryItems({ includeHidden: false });

// Grant items (creates if doesn't exist)
await visitor.grantInventoryItem(itemId, quantity, { lock });

// Modify quantity (add or subtract)
await visitor.modifyInventoryItemQuantity(itemId, quantityDelta, { lock });

// Fetch all available items for this app
const catalog = await ecosystem.fetchInventoryItems();
```

### Important Notes

- Always check item existence before modifying
- Use locking for concurrent operations
- Negative quantities for deductions (purchases, consumption)
- Items are scoped to the interactive key (sdkIntegrationId)

---

## Key References

- **SDK Documentation**: https://metaversecloud-com.github.io/mc-sdk-js/index.html
- **Inventory Documentation**: See `inventory.md` in topia-stack root
- **Style Guide**: `.ai/style-guide.md`
- **Examples**: `.ai/examples/` directory
- **Planning Template**: `.ai/templates/plan.md`
- **Base Rules**: `.ai/rules.md`

Always reference the comprehensive documentation in the `.ai/` folder for detailed examples and patterns before starting implementation.

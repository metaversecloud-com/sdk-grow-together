// Secrets and process health across the game's flows: the interactive secret never reaches a player, and
// background Topia calls that fail can't take the server down.
import { INTERACTIVE_SECRET } from "../../constants";
import { expect, test } from "../../fixtures";
import { withPrivateServer } from "../../helpers/privateServer";
import { ITEM, PLOT_POSITION, PLOT_UNIQUE_NAME, plotAsset, seedOwnGarden } from "./garden";

const LEAK_MARKERS = [INTERACTIVE_SECRET, "interactiveSecret", "InteractiveJWT"];

test("no response of a whole play session contains the interactive secret", async ({ request, world }) => {
  await seedOwnGarden(world, {
    crops: {
      ready: { squareId: 5 },
      grown: { squareId: 6, growLevel: 2 },
      growing: { squareId: 7, wateredAgo: 5 },
    },
    decorations: { "deco-1": { decorationId: ITEM.gnome, decorationName: "Garden Gnome", squareId: 1 } },
    items: {
      [ITEM.coins]: 500,
      [ITEM.xp]: 0,
      [ITEM.carrots]: 1,
      [ITEM.gnome]: 2,
      [ITEM.sprinkler]: 1,
      [ITEM.harvestBasket]: 1,
      [ITEM.basicMulch]: 5,
    },
    extra: { isAdmin: true },
  });
  const tool = (id: string, name: string, actionType: string) => ({ ecosystemItemId: id, name, actionType });
  const calls: Array<[string, string, Record<string, unknown>?, Record<string, string>?]> = [
    ["get", "/game-state"],
    ["get", "/square", undefined, { assetId: "ready" }],
    ["post", "/crop/water", { cropAssetId: "ready" }],
    ["post", "/crop/harvest", { cropAssetId: "grown" }],
    ["post", "/crop/use-tool", { itemAssetId: "growing", tool: tool(ITEM.basicMulch, "Basic Mulch", "Mulch"), ownerId: world.profileId }],
    ["post", "/crop/drop", { seedId: ITEM.carrots, squareId: 8 }],
    ["post", "/crop/remove", { squareId: 8 }],
    ["post", "/seed/purchase", { seedId: ITEM.tomatoes }],
    ["post", "/tool/purchase", { toolId: ITEM.basicMulch }],
    ["post", "/decoration/purchase", { decorationId: ITEM.gnome }],
    ["post", "/accessory/purchase", { accessoryId: ITEM.strawHat }],
    ["post", "/decoration/drop", { decorationId: ITEM.gnome, squareId: 2 }],
    ["post", "/decoration/remove", { squareId: 2 }],
    ["post", "/plot/use-tool", { tool: tool(ITEM.sprinkler, "Sprinkler", "Water") }],
    ["post", "/plot/use-tool", { tool: tool(ITEM.harvestBasket, "Harvest Basket", "Harvest") }],
    ["post", "/plot/view", { plotAssetId: world.assetId }],
    ["post", "/square/view", { itemAssetId: "growing", type: "crop" }],
    ["post", "/plot/teleport"],
    ["post", "/teleport"],
    ["post", "/plot/claim"], // refused: already owns this plot
    ["post", "/crop/harvest", { cropAssetId: "nope" }], // refused: no such crop
    ["post", "/admin/clear-plot"],
  ];

  for (const [method, path, data, overrides] of calls) {
    const response = await (request as any)[method](world.api(path, overrides), { data });
    const body = await response.text();
    for (const marker of LEAK_MARKERS) expect(body, `${method.toUpperCase()} ${path} returned "${marker}"`).not.toContain(marker);
  }
  expect(await world.events("delete-asset")).not.toEqual([]); // the session really played
});

test("a failed Topia call reported to the player doesn't contain the interactive secret", async ({ request, world }) => {
  await seedOwnGarden(world, { extra: { failures: { "/get-visitor-inventory-items": 500 } } });

  const response = await request.get(world.api("/game-state"));

  expect(response.status()).toBe(500);
  const body = await response.text();
  for (const marker of LEAK_MARKERS) expect(body).not.toContain(marker);
});

test("a failed background update of the plots index doesn't take the server down", async ({ world }) => {
  test.slow();
  // No plots index yet: the first open builds it in the background, and Topia rejects that write.
  await world.seed({
    asset: { uniqueName: PLOT_UNIQUE_NAME, position: PLOT_POSITION },
    extraAssets: { "plot-2": plotAsset("plot-2") },
    failures: { [`PUT /api/v1/world/${world.urlSlug}/set-data-object`]: 500 },
  });

  const { result, alive, output } = await withPrivateServer((origin) =>
    fetch(`${origin}${world.api("/game-state")}`).then((r) => r.status),
  );

  expect(alive, output.slice(-1500)).toBe(true);
  expect(result).toBe(200);
});

test("using a tool sent without an id doesn't take the server down", async ({ world }) => {
  test.slow();
  await seedOwnGarden(world, {
    crops: { "crop-1": { squareId: 5, wateredAgo: 5 } },
    items: { [ITEM.coins]: 0, [ITEM.basicMulch]: 5 },
  });

  const { alive, output } = await withPrivateServer((origin) =>
    fetch(`${origin}${world.api("/crop/use-tool")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemAssetId: "crop-1", tool: { name: "Basic Mulch", actionType: "Mulch" }, ownerId: world.profileId }),
    }).then((r) => r.status),
  );

  expect(alive, output.slice(-1500)).toBe(true);
});

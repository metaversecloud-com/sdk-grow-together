// Claiming a garden plot and viewing plots (the drawer opened from a plot sign: /plot).
import { expect, test } from "../../fixtures";
import {
  ITEM,
  PLOT_POSITION,
  PLOT_UNIQUE_NAME,
  emptySquares,
  garden,
  inventory,
  playerData,
  plotAsset,
  plotsIndex,
  quantityOf,
  seedOwnGarden,
} from "./garden";

const BUG = "EXP-459";

// A free plot opened by a player without a garden.
const seedOpenPlot = (world: any, extra: Record<string, unknown> = {}) =>
  world.seed({
    asset: { uniqueName: PLOT_UNIQUE_NAME, position: PLOT_POSITION },
    worldData: plotsIndex({ [world.assetId]: null, "plot-2": null }),
    extraAssets: { "plot-2": plotAsset("plot-2") },
    ...extra,
  });

test("a free plot offers to start a garden and the first open initializes the player", async ({ page, world }) => {
  await seedOpenPlot(world);
  await page.goto(world.url("/plot"));

  await expect(page.getByRole("heading", { name: "Open Garden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Your Garden" })).toBeEnabled();
  expect(await world.visitorData()).toEqual(
    playerData({
      [world.urlSlug]: {
        plotAssetId: null,
        claimedDate: "",
        lastInteractionDate: "",
        plotSquares: {},
        crops: {},
        decorations: {},
      },
    }),
  );
  expect(await world.events("analytics")).toContainEqual(
    expect.objectContaining({ analyticName: "plotDrawerViews-non-self", profileId: world.profileId }),
  );
});

test("the first open of a world builds the plots index from the plot assets", async ({ page, world }) => {
  await world.seed({
    asset: { uniqueName: PLOT_UNIQUE_NAME, position: PLOT_POSITION },
    extraAssets: { "plot-2": plotAsset("plot-2", { ownerId: "someone" }), other: { id: "other", uniqueName: "x" } },
  });
  await page.goto(world.url("/plot"));
  await expect(page.getByRole("button", { name: "Start Your Garden" })).toBeVisible();

  await expect.poll(async () => (await world.state()).dataObject).toEqual(
    plotsIndex({ [world.assetId]: null, "plot-2": "someone" }),
  );
});

test("claiming a plot makes the player its owner and hands out the starter kit", async ({ page, world }) => {
  await seedOpenPlot(world);
  await page.goto(world.url("/plot"));
  await page.getByRole("button", { name: "Start Your Garden" }).click();

  await expect.poll(() => world.events("open-iframe")).toHaveLength(1);
  const plotData = await world.assetData();
  expect(plotData).toEqual({
    plotAssetId: world.assetId,
    ownerId: world.profileId,
    ownerName: "E2E Player",
    claimedDate: expect.any(String),
    lastInteractionDate: expect.any(String),
  });
  const visitorData = await world.visitorData();
  expect(visitorData.worlds[world.urlSlug]).toEqual({
    plotAssetId: world.assetId,
    claimedDate: plotData.claimedDate,
    plotSquares: emptySquares(),
    crops: {},
    decorations: {},
  });
  expect((await world.state()).dataObject).toEqual(plotsIndex({ [world.assetId]: world.profileId, "plot-2": null }));

  // Starter kit: the free seed and the starter tools.
  expect(await quantityOf(world, ITEM.carrots)).toBe(1);
  expect(await quantityOf(world, ITEM.sprinkler)).toBe(1);
  expect(await quantityOf(world, ITEM.harvestBasket)).toBe(1);
  expect(await quantityOf(world, ITEM.woodenCan)).toBe(5);
  expect(await quantityOf(world, ITEM.basicMulch)).toBe(5);
  expect(await quantityOf(world, ITEM.basicCompost)).toBe(5);

  // The owner's name sign, the plot's new link and image.
  const { assets } = await world.state();
  const sign = Object.values(assets).find((a: any) => a.uniqueName === `GrowTogether_ownerText_${world.profileId}`);
  expect(sign).toMatchObject({ text: "E2E Player's Garden", position: { x: 1000, y: 1580 }, isTextTopLayer: true });
  expect(await world.events("change-click-type")).toContainEqual(
    expect.objectContaining({
      assetId: world.assetId,
      clickableLinkTitle: "E2E Player's Garden",
      clickableLink: expect.stringContaining(`/plot?ownerName=E2E%20Player&ownerProfileId=${world.profileId}`),
      isOpenLinkInDrawer: true,
    }),
  );
  expect(await world.events("set-webimage-layers")).toContainEqual(
    expect.objectContaining({ assetId: world.assetId, top: expect.stringContaining("/ViewGardenSign.png") }),
  );
  expect(await world.events("analytics")).toContainEqual(
    expect.objectContaining({ analyticName: "plotsClaimed", profileId: world.profileId }),
  );
});

test("the drawer reopened after claiming shows the new garden", async ({ page, world }) => {
  test.fail(true, `${BUG}: the reopened drawer's link carries the name sign's id plus a stray "}" as assetId`);
  await seedOpenPlot(world);
  await page.goto(world.url("/plot"));
  await page.getByRole("button", { name: "Start Your Garden" }).click();
  await expect.poll(() => world.events("open-iframe")).toHaveLength(1);
  const [opened] = await world.events("open-iframe");
  expect(opened).toMatchObject({ droppedAssetId: world.assetId, shouldOpenInDrawer: true, title: "E2E Player's Garden" });

  const link = new URL(opened.link);
  expect(link.searchParams.get("assetId")).toBe(world.assetId);
  await page.goto(`${link.pathname}${link.search}`);
  await expect(page.getByRole("heading", { name: "Your Garden" })).toBeVisible();
});

test("a player who already has a garden can't claim a second plot", async ({ page, request, world }) => {
  const own = garden(world, { plotAssetId: "plot-2" });
  await world.seed({
    asset: { uniqueName: PLOT_UNIQUE_NAME, position: PLOT_POSITION },
    worldData: plotsIndex({ [world.assetId]: null, "plot-2": world.profileId }),
    visitorData: playerData({ [world.urlSlug]: own.worldEntry }),
    extraAssets: { "plot-2": plotAsset("plot-2", own.plotAssetData) },
  });
  await page.goto(world.url("/plot"));
  await expect(page.getByRole("heading", { name: "Are you looking for your garden?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Your Garden" })).toHaveCount(0);

  const response = await request.post(world.api("/plot/claim"));
  expect(response.status()).toBe(500);
  expect((await response.json()).error).toBe("You already own a plot. Each player can only claim one plot.");
  expect(await world.assetData()).toEqual({});
  expect(await world.events("grant-item")).toEqual([]);
});

test("a plot someone else owns can't be claimed", async ({ request, world }) => {
  const theirs = garden(world, { owner: { profileId: `${world.profileId}-robin`, displayName: "Robin" } });
  await world.seed({
    asset: { uniqueName: PLOT_UNIQUE_NAME, position: PLOT_POSITION },
    assetData: theirs.plotAssetData,
    worldData: plotsIndex({ [world.assetId]: `${world.profileId}-robin` }),
    users: { [`${world.profileId}-robin`]: playerData({ [world.urlSlug]: theirs.worldEntry }) },
  });

  const response = await request.post(world.api("/plot/claim"));
  expect(response.status()).toBe(500);
  expect((await response.json()).error).toBe("This plot is already owned by Robin.");
  expect((await world.assetData()).ownerId).toBe(`${world.profileId}-robin`);
});

test("the owner sees their garden, money, store and both grids", async ({ page, world }) => {
  await seedOwnGarden(world, {
    crops: { "crop-1": { squareId: 6, growLevel: 1, wateredAgo: 5 } },
    decorations: { "deco-1": { decorationId: ITEM.gnome, decorationName: "Garden Gnome", squareId: 2 } },
    items: { [ITEM.coins]: 42, [ITEM.xp]: 120, [ITEM.carrots]: 1, [ITEM.gnome]: 1 },
    lastInteractionDate: "2026-01-01T00:00:00.000Z",
  });
  await page.goto(world.url("/plot"));

  await expect(page.getByRole("heading", { name: "Your Garden" })).toBeVisible();
  await expect(page.getByText("Your Money: 42 Coins")).toBeVisible();
  await expect(page.getByText("Beginner Gardener")).toBeVisible(); // 120 XP = level 2
  await expect(page.getByRole("button", { name: "View Store" })).toBeVisible();
  await expect(page.getByRole("button", { name: "View Backpack" })).toBeVisible();
  await expect(page.locator(".card.decoration")).toHaveCount(4);
  await expect(page.locator(".card.crop")).toHaveCount(12);
  await expect(page.locator(".card.crop").nth(1)).toContainText("lvl 1/2");
  await expect(page.locator(".card.decoration").nth(1).locator("img")).toHaveAttribute(
    "src",
    "https://example.invalid/items/decoration-gnome.png",
  );
  // Opening the own garden refreshes its last-interaction date (used by "Clear Inactive Plots").
  await expect.poll(async () => (await world.assetData()).lastInteractionDate).not.toBe("2026-01-01T00:00:00.000Z");
  expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "plotDrawerViews-self" }));
});

test("visiting another player's garden shows it read-only with the owner's level", async ({ page, world }) => {
  const robin = { profileId: `${world.profileId}-robin`, displayName: "Robin" };
  const theirs = garden(world, { owner: robin, crops: { "crop-r": { squareId: 9, growLevel: 2 } } });
  await world.seed({
    asset: { uniqueName: PLOT_UNIQUE_NAME, position: PLOT_POSITION },
    assetData: theirs.plotAssetData,
    worldData: plotsIndex({ [world.assetId]: robin.profileId, "plot-2": null }),
    extraAssets: theirs.assets,
    otherVisitors: {
      43: {
        ...robin,
        visitorData: playerData({ [world.urlSlug]: theirs.worldEntry }),
        inventory: inventory({ [ITEM.xp]: 200 }),
      },
    },
  });
  await page.goto(world.url("/plot"));

  await expect(page.getByRole("heading", { name: "Robin's Garden" })).toBeVisible();
  await expect(page.getByText("Garden Started: 1/2/2026")).toBeVisible();
  await expect(page.getByText("Bronze Gardener")).toBeVisible(); // Robin's 200 XP = level 3
  await expect(page.getByRole("button", { name: "View Store" })).toHaveCount(0);
  await expect(page.locator(".card.decoration")).toHaveCount(0); // decoration slots are owner-only
  await expect(page.locator(".card.crop").nth(4)).toContainText("lvl 2/2");
  await expect(page.locator(".card.crop.readonly")).toHaveCount(11);
  await expect(page.getByRole("button", { name: "Start Your Garden" })).toHaveCount(0);
});

test("a visit to another player's garden counts as a non-self view", async ({ page, world }) => {
  test.fail(true, `${BUG}: the view analytic compares the owner's plot with itself, so every owned plot counts as "self"`);
  const robin = { profileId: `${world.profileId}-robin`, displayName: "Robin" };
  const theirs = garden(world, { owner: robin });
  await world.seed({
    asset: { uniqueName: PLOT_UNIQUE_NAME, position: PLOT_POSITION },
    assetData: theirs.plotAssetData,
    worldData: plotsIndex({ [world.assetId]: robin.profileId }),
    users: { [robin.profileId]: playerData({ [world.urlSlug]: theirs.worldEntry }) },
  });
  await page.goto(world.url("/plot"));
  await expect(page.getByRole("heading", { name: "Robin's Garden" })).toBeVisible();

  const views = (await world.events("analytics")).filter((e) => e.analyticName.startsWith("plotDrawerViews"));
  expect(views.map((e) => e.analyticName)).toEqual(["plotDrawerViews-non-self"]);
});

test("two players claiming the same plot at once don't both get it", async ({ request, world }) => {
  test.fail(true, `${BUG}: claiming has no lock; both claims succeed and the last write wins`);
  await seedOpenPlot(world, { otherVisitors: { 43: {} }, latencyMs: 40 });

  const [mine, theirs] = await Promise.all([
    request.post(world.api("/plot/claim")),
    request.post(world.apiAs(43, "/plot/claim")),
  ]);

  expect([mine.ok(), theirs.ok()].filter(Boolean)).toHaveLength(1);
  const owner = (await world.assetData()).ownerId;
  const loser = owner === world.profileId ? 43 : 42;
  expect((await world.visitorData(loser)).worlds[world.urlSlug].plotAssetId).toBeFalsy();
});

test("one player claiming two plots at once ends up with one garden", async ({ request, world }) => {
  test.fail(true, `${BUG}: the one-plot-per-player check reads the player's data before either claim writes it`);
  await seedOpenPlot(world, { latencyMs: 40 });

  await Promise.all([
    request.post(world.api("/plot/claim")),
    request.post(world.api("/plot/claim", { assetId: "plot-2" })),
  ]);

  const owners = [(await world.assetData())?.ownerId, (await world.assetData("plot-2"))?.ownerId];
  expect(owners.filter((o) => o === world.profileId)).toHaveLength(1);
});

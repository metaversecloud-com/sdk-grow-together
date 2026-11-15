// Tools: plot tools (Sprinkler, Harvest Basket) on the whole garden, crop tools (mulch, compost) on one
// crop, and watering cans that let other players help water someone's garden.
import { expect, test } from "../../fixtures";
import { ITEM, PLOT_POSITION, PLOT_UNIQUE_NAME, garden, inventory, playerData, plotsIndex, quantityOf, seedOwnGarden } from "./garden";

const BUG = "EXP-459";
const slot = (page: any, squareId: number) => page.locator(".card.crop").nth(squareId - 5);

const STARTER = { [ITEM.coins]: 100, [ITEM.xp]: 0, [ITEM.carrots]: 1 };
const tool = (id: string, name: string, actionType: string, extra: Record<string, unknown> = {}) => ({
  ecosystemItemId: id,
  name,
  actionType,
  ...extra,
});

test("the sprinkler waters every crop that's ready and uses up one sprinkler", async ({ page, world }) => {
  await seedOwnGarden(world, {
    crops: {
      ready: { squareId: 5, growLevel: 0 },
      growing: { squareId: 6, growLevel: 0, wateredAgo: 5 },
      almost: { squareId: 7, growLevel: 1 },
      grown: { squareId: 8, growLevel: 2 },
    },
    items: { ...STARTER, [ITEM.sprinkler]: 1 },
  });
  await page.goto(world.url("/plot"));
  await page.getByRole("img", { name: "Sprinkler" }).click();
  await expect(page.getByRole("heading", { name: "Water 2 crops?" })).toBeVisible();
  await page.locator(".modal .card", { hasText: "Sprinkler" }).click();

  await expect(slot(page, 5)).toContainText("lvl 1/2");
  await expect(slot(page, 7)).toContainText("lvl 2/2");
  const crops = (await world.visitorData()).worlds[world.urlSlug].crops;
  expect([crops.ready.growLevel, crops.growing.growLevel, crops.almost.growLevel, crops.grown.growLevel]).toEqual([1, 0, 2, 2]);
  expect(await world.assetData("ready")).toMatchObject({ growLevel: 1 });
  expect(await quantityOf(world, ITEM.sprinkler)).toBe(0);
  expect((await world.events("particles")).filter((e) => e.particleName === "drop_grow_together")).toHaveLength(2);
  expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "sprinklerUsed" }));
});

test("the sprinkler only gives XP for the crops it watered", async ({ request, world }) => {
  test.fail(true, `${BUG}: XP is added for every unripe crop, even the ones skipped because they're still growing`);
  await seedOwnGarden(world, {
    crops: {
      ready: { squareId: 5, growLevel: 0 },
      growing1: { squareId: 6, growLevel: 0, wateredAgo: 5 },
      growing2: { squareId: 7, growLevel: 0, wateredAgo: 5 },
    },
    items: { ...STARTER, [ITEM.sprinkler]: 1 },
  });

  await request.post(world.api("/plot/use-tool"), { data: { tool: tool(ITEM.sprinkler, "Sprinkler", "Water", { canBeUsedOnPlot: true }) } });

  expect(await quantityOf(world, ITEM.xp)).toBe(1); // one Carrots watering
});

test("the harvest basket harvests every grown crop at once", async ({ page, world }) => {
  await seedOwnGarden(world, {
    crops: {
      a: { squareId: 5, growLevel: 2 },
      b: { squareId: 9, growLevel: 2 },
      c: { squareId: 10, growLevel: 1, wateredAgo: 5 },
    },
    items: { ...STARTER, [ITEM.harvestBasket]: 1 },
  });
  await page.goto(world.url("/plot"));
  await page.getByRole("img", { name: "Harvest Basket" }).click();
  await expect(page.getByRole("heading", { name: "Harvest 2 crops?" })).toBeVisible();
  await page.locator(".modal .card", { hasText: "Harvest Basket" }).click();

  await expect(page.getByText("+10 Coins, +4 XP")).toBeVisible();
  expect(await quantityOf(world, ITEM.coins)).toBe(110);
  expect(await quantityOf(world, ITEM.xp)).toBe(4);
  expect(await quantityOf(world, ITEM.harvestBasket)).toBe(0);
  const { assets } = await world.state();
  expect([assets.a, assets.b, assets.c].map(Boolean)).toEqual([false, false, true]);
  const data = await world.visitorData();
  expect(Object.keys(data.worlds[world.urlSlug].crops)).toEqual(["c"]);
  expect([data.worlds[world.urlSlug].plotSquares[5], data.worlds[world.urlSlug].plotSquares[9]]).toEqual([null, null]);
  expect(data.totalCoinsEarned).toBe(10);
});

test("a plot tool the player doesn't have can't be used", async ({ request, world }) => {
  test.fail(true, `${BUG}: plot tools aren't checked against the inventory; the count just goes negative`);
  await seedOwnGarden(world, { crops: { ready: { squareId: 5, growLevel: 0 } } });

  const response = await request.post(world.api("/plot/use-tool"), {
    data: { tool: tool(ITEM.sprinkler, "Sprinkler", "Water", { canBeUsedOnPlot: true }) },
  });

  expect(response.ok()).toBe(false);
  expect((await world.visitorData()).worlds[world.urlSlug].crops.ready.growLevel).toBe(0);
  expect(await quantityOf(world, ITEM.sprinkler)).toBeUndefined();
});

test("mulch on a crop is recorded on the crop and uses one bag", async ({ page, world }) => {
  await seedOwnGarden(world, {
    crops: { "crop-1": { squareId: 6, growLevel: 0, wateredAgo: 5 } },
    items: { ...STARTER, [ITEM.basicMulch]: 5, [ITEM.basicCompost]: 5, [ITEM.woodenCan]: 5 },
  });
  await page.goto(world.url("/plot"));
  await slot(page, 6).click();
  await page.getByRole("button", { name: "Use Tool" }).click();
  await expect(page.getByRole("heading", { name: "Use Tool on Slot 6" })).toBeVisible();
  // Owners water for free, so watering cans aren't offered on their own crops.
  await expect(page.locator(".modal .card", { hasText: "Wooden Watering Can" })).toHaveCount(0);
  await page.locator(".modal .card", { hasText: "Basic Mulch" }).click();

  await expect.poll(() => quantityOf(world, ITEM.basicMulch)).toBe(4);
  expect((await world.visitorData()).worlds[world.urlSlug].crops["crop-1"].appliedTools).toEqual(["Basic Mulch"]);
  expect(await world.assetData("crop-1")).toMatchObject({ appliedTools: ["Basic Mulch"], ownerId: world.profileId });
  expect(await world.events("particles")).toContainEqual(expect.objectContaining({ particleName: "mulch_grow_together" }));
  const analytics = (await world.events("analytics")).map((e) => e.analyticName);
  expect(analytics).toEqual(expect.arrayContaining(["toolsUsed", "basicMulchUsed", "mulchUsed"]));
});

test("mulch makes the crop ready to water sooner", async ({ page, world }) => {
  // Carrots take 60 s per level; Basic Mulch cuts that by 10 %, so after 57 s it's ready.
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 5, wateredAgo: 57, appliedTools: ["Basic Mulch"] } } });
  await page.goto(world.url("/plot"));

  await expect(slot(page, 5)).toContainText("Water!");
});

test("a crop takes at most three tools", async ({ request, world }) => {
  await seedOwnGarden(world, {
    crops: { "crop-1": { squareId: 5, wateredAgo: 5, appliedTools: ["Basic Mulch", "Basic Compost", "Basic Mulch"] } },
    items: { ...STARTER, [ITEM.basicCompost]: 5 },
  });

  const response = await request.post(world.api("/crop/use-tool"), {
    data: { itemAssetId: "crop-1", tool: tool(ITEM.basicCompost, "Basic Compost", "Compost"), ownerId: world.profileId },
  });

  expect((await response.json()).error).toBe("Maximum number of tools has already applied to this crop.");
  expect(await quantityOf(world, ITEM.basicCompost)).toBe(5);
});

// The test's player visits Robin's garden (Robin is visitor 43 and owns the key plot).
const seedFriendsGarden = async (world: any, items: Record<string, number>, crop = { squareId: 5, growLevel: 0 }) => {
  const robin = { profileId: `${world.profileId}-robin`, displayName: "Robin" };
  const theirs = garden(world, { owner: robin, crops: { "crop-r": crop } });
  await world.seed({
    asset: { uniqueName: PLOT_UNIQUE_NAME, position: PLOT_POSITION },
    assetData: theirs.plotAssetData,
    worldData: plotsIndex({ [world.assetId]: robin.profileId }),
    extraAssets: theirs.assets,
    inventory: inventory(items),
    otherVisitors: { 43: { ...robin, visitorData: playerData({ [world.urlSlug]: theirs.worldEntry }) } },
  });
  return robin;
};

test("a visitor can water a friend's crop with a watering can and earns XP for it", async ({ page, world }) => {
  await seedFriendsGarden(world, { [ITEM.coins]: 0, [ITEM.xp]: 0, [ITEM.woodenCan]: 5 });
  await page.goto(world.url("/plot"));
  await expect(page.getByRole("heading", { name: "Robin's Garden" })).toBeVisible();
  await slot(page, 5).click();
  await page.getByRole("button", { name: "Use Tool" }).click();
  await page.locator(".modal .card", { hasText: "Wooden Watering Can" }).click();

  await expect(page.locator(".card.success")).toContainText(/\+\d+ XP/);
  // Robin's crop grew; the helper got the XP and used a can.
  expect((await world.visitorData(43)).worlds[world.urlSlug].crops["crop-r"].growLevel).toBe(1);
  expect(await world.assetData("crop-r")).toMatchObject({ growLevel: 1 });
  expect(await quantityOf(world, ITEM.xp)).toBeGreaterThanOrEqual(1);
  expect(await quantityOf(world, ITEM.xp, 43)).toBeUndefined();
  await expect.poll(() => quantityOf(world, ITEM.woodenCan)).toBe(4);
  const analytics = (await world.events("analytics")).map((e) => e.analyticName);
  expect(analytics).toEqual(expect.arrayContaining(["wateringCansUsed", "woodenWateringCanUsed", "cropsWatered"]));
});

test("a watering can the player doesn't own can't be used", async ({ request, world }) => {
  test.fail(true, `${BUG}: the tool (name, action, id) comes from the request body and is never checked against the inventory`);
  await seedFriendsGarden(world, { [ITEM.coins]: 0, [ITEM.xp]: 0, [ITEM.woodenCan]: 5 });

  // Claims the Gold Watering Can (7-14 XP, often 10-20 coins) while owning only wooden ones.
  const response = await request.post(world.api("/crop/use-tool"), {
    data: { itemAssetId: "crop-r", tool: tool(ITEM.goldCan, "Gold Watering Can", "Water"), ownerId: `${world.profileId}-robin` },
  });

  expect(response.ok()).toBe(false);
  expect(await quantityOf(world, ITEM.xp)).toBe(0);
  expect((await world.visitorData(43)).worlds[world.urlSlug].crops["crop-r"].growLevel).toBe(0);
});

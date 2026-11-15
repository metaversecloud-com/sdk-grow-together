// Admin settings (gear icon): clear one plot, clear inactive plots, clear all plots.
import { expect, test } from "../../fixtures";
import { ITEM, PLOT_POSITION, PLOT_UNIQUE_NAME, garden, playerData, plotAsset, plotsIndex, seedOwnGarden } from "./garden";

const DAY = 24 * 60 * 60 * 1000;
const GEAR = "button.icon-with-rounded-border";

// Owners whose profile ids don't contain the test player's (the app matches assets by partial unique name).
const owner = (world: any, name: string) => ({ profileId: `${name.toLowerCase()}-${world.urlSlug}`, displayName: name });
const nameSign = (profileId: string) => ({ id: `sign-${profileId}`, uniqueName: `GrowTogether_ownerText_${profileId}`, text: "sign" });

/** Robin owns the key plot, Sam owns plot-2, plot-3 is free; the test's player has no garden. */
const seedGardens = async (world: any, { isAdmin = true, robinLastSeen = Date.now(), samLastSeen = Date.now() } = {}) => {
  const robin = owner(world, "Robin");
  const sam = owner(world, "Sam");
  const robins = garden(world, {
    owner: robin,
    crops: { "crop-r": { squareId: 5, growLevel: 1 } },
    decorations: { "deco-r": { decorationId: ITEM.gnome, decorationName: "Garden Gnome", squareId: 1 } },
    lastInteractionDate: new Date(robinLastSeen).toISOString(),
  });
  const sams = garden(world, {
    plotAssetId: "plot-2",
    owner: sam,
    crops: { "crop-s": { squareId: 6, growLevel: 0 } },
    lastInteractionDate: new Date(samLastSeen).toISOString(),
  });
  const placed = (id: string) => ({ "Garden Gnome": { [world.urlSlug]: [id], "another-world": ["elsewhere"] } });
  await world.seed({
    isAdmin,
    asset: { uniqueName: PLOT_UNIQUE_NAME, position: PLOT_POSITION },
    assetData: robins.plotAssetData,
    worldData: plotsIndex({ [world.assetId]: robin.profileId, "plot-2": sam.profileId, "plot-3": null }),
    users: {
      [robin.profileId]: playerData({ [world.urlSlug]: robins.worldEntry, "another-world": { plotAssetId: "x" } }, { placedDecorations: placed("deco-r") }),
      [sam.profileId]: playerData({ [world.urlSlug]: sams.worldEntry }),
    },
    extraAssets: {
      "plot-2": plotAsset("plot-2", sams.plotAssetData),
      "plot-3": plotAsset("plot-3", {}, { x: 5000, y: 1000 }),
      ...robins.assets,
      ...sams.assets,
      [`sign-${robin.profileId}`]: nameSign(robin.profileId),
      [`sign-${sam.profileId}`]: nameSign(sam.profileId),
    },
  });
  return { robin, sam };
};

const DEFAULT_WORLD_DATA = { plotAssetId: null, claimedDate: "", lastInteractionDate: "", plotSquares: {}, crops: {}, decorations: {} };

test("only admins get the settings, which offer to clear this plot when it's owned", async ({ page, world }) => {
  await seedOwnGarden(world);
  await page.goto(world.url("/plot"));
  await expect(page.getByRole("heading", { name: "Your Garden" })).toBeVisible();
  await expect(page.locator(GEAR)).toHaveCount(0);

  await seedOwnGarden(world, { extra: { isAdmin: true } });
  await page.reload();
  await page.locator(GEAR).click();
  await expect(page.getByRole("heading", { name: "Clear This Plot" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Clear Inactive Plots" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Clear All Plots" })).toBeVisible();
});

test("clearing a plot frees it and wipes the owner's garden in this world", async ({ page, world }) => {
  const { robin, sam } = await seedGardens(world);
  await page.goto(world.url("/plot"));
  await expect(page.getByRole("heading", { name: "Robin's Garden" })).toBeVisible();
  await page.locator(GEAR).click();
  await page.getByRole("button", { name: "Clear This Plot" }).click();
  await page.getByRole("button", { name: "Yes" }).click();

  await expect.poll(() => world.events("close-iframe")).toHaveLength(1);
  expect(await world.assetData()).toEqual({});
  const { assets, dataObject } = await world.state();
  expect(["crop-r", "deco-r", `sign-${robin.profileId}`].map((id) => !!assets[id])).toEqual([false, false, false]);
  expect(["crop-s", `sign-${sam.profileId}`, "plot-2"].map((id) => !!assets[id])).toEqual([true, true, true]);
  expect(dataObject.plots).toEqual({ [world.assetId]: null, "plot-2": sam.profileId, "plot-3": null });

  const robinsData = await world.userData(robin.profileId);
  expect(robinsData.worlds[world.urlSlug]).toEqual(DEFAULT_WORLD_DATA);
  expect(robinsData.worlds["another-world"]).toEqual({ plotAssetId: "x" }); // other worlds are kept
  expect(robinsData.placedDecorations).toEqual({ "Garden Gnome": { "another-world": ["elsewhere"] } });
  expect((await world.userData(sam.profileId)).worlds[world.urlSlug].plotAssetId).toBe("plot-2");

  expect(await world.events("change-click-type")).toContainEqual(
    expect.objectContaining({ assetId: world.assetId, clickableLinkTitle: "Available Garden", clickableLink: expect.stringMatching(/\/plot$/) }),
  );
  expect(await world.events("set-webimage-layers")).toContainEqual(
    expect.objectContaining({ assetId: world.assetId, top: expect.stringContaining("/OpenGardenSign.png") }),
  );
  expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "plotsCleared" }));
});

test("players can't call the admin routes", async ({ request, world }) => {
  const { robin } = await seedGardens(world, { isAdmin: false });

  for (const path of ["/admin/clear-plot", "/admin/clear-all-plots"]) {
    const response = await request.post(world.api(path));
    expect(response.status()).toBe(500);
    expect((await response.json()).error).toBe("Only admins can clear plots");
  }
  expect((await world.assetData()).ownerId).toBe(robin.profileId);
  expect((await world.state()).assets["crop-r"]).toBeDefined();
});

test("clearing inactive plots only frees gardens idle for more than two weeks", async ({ page, world }) => {
  const { robin, sam } = await seedGardens(world, { robinLastSeen: Date.now() - 15 * DAY, samLastSeen: Date.now() - 13 * DAY });
  await page.goto(world.url("/plot"));
  await page.locator(GEAR).click();
  await page.getByRole("button", { name: "Clear Inactive Plots" }).click();
  await page.getByRole("button", { name: "Yes" }).click();

  await expect.poll(() => world.events("close-iframe")).toHaveLength(1);
  expect(await world.assetData()).toEqual({});
  expect((await world.assetData("plot-2")).ownerId).toBe(sam.profileId);
  const { assets, dataObject } = await world.state();
  expect(["crop-r", "deco-r", `sign-${robin.profileId}`].map((id) => !!assets[id])).toEqual([false, false, false]);
  expect(["crop-s", `sign-${sam.profileId}`].map((id) => !!assets[id])).toEqual([true, true]);
  expect(dataObject.plots).toEqual({ [world.assetId]: null, "plot-2": sam.profileId, "plot-3": null });
  expect((await world.userData(robin.profileId)).worlds[world.urlSlug]).toEqual(DEFAULT_WORLD_DATA);
  expect((await world.userData(sam.profileId)).worlds[world.urlSlug].plotAssetId).toBe("plot-2");
});

test("clearing all plots frees every garden", async ({ page, world }) => {
  const { robin, sam } = await seedGardens(world);
  await page.goto(world.url("/plot"));
  await page.locator(GEAR).click();
  await page.getByRole("button", { name: "Clear All Plots" }).click();
  await page.getByRole("button", { name: "Yes" }).click();

  await expect.poll(() => world.events("close-iframe")).toHaveLength(1);
  expect([await world.assetData(), await world.assetData("plot-2")]).toEqual([{}, {}]);
  const { assets, dataObject } = await world.state();
  expect(Object.values(assets).filter((a: any) => /^GrowTogether_(crop|decoration|ownerText)/.test(a.uniqueName))).toEqual([]);
  expect(dataObject.plots).toEqual({ [world.assetId]: null, "plot-2": null, "plot-3": null });
  expect((await world.userData(robin.profileId)).worlds[world.urlSlug]).toEqual(DEFAULT_WORLD_DATA);
  expect((await world.userData(sam.profileId)).worlds[world.urlSlug]).toEqual(DEFAULT_WORLD_DATA);
});

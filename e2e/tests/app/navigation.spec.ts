// Finding gardens: the home and teleport drawers, teleports, and the drawers the app opens for plots and
// plot squares.
import { expect, test } from "../../fixtures";
import { garden, playerData, plotAsset, plotsIndex, seedOwnGarden } from "./garden";

const BUG = "EXP-459";
const slot = (page: any, squareId: number) => page.locator(".card.crop").nth(squareId - 5);

/** A drawer link the app opened (absolute, on the app's base URL) as a path to load in the test's page. */
const pathOf = (link: string) => {
  const url = new URL(link);
  return `${url.pathname}${url.search}`;
};

// A world with a kiosk (the key asset) and three plots: plot-1 owned by someone, plot-2 and plot-3 free
// unless `owned` says otherwise.
const seedPlots = (world: any, { owned = {}, visitorData = {} }: { owned?: Record<string, string>; visitorData?: object } = {}) => {
  const owner = (id: string) => owned[id] ?? null;
  return world.seed({
    worldData: plotsIndex({ "plot-1": "someone", "plot-2": owner("plot-2"), "plot-3": owner("plot-3") }),
    visitorData,
    extraAssets: {
      "plot-1": plotAsset("plot-1", { ownerId: "someone" }, { x: 100, y: 200 }),
      "plot-2": plotAsset("plot-2", owned["plot-2"] ? { ownerId: owned["plot-2"] } : {}, { x: 300, y: 400 }),
      "plot-3": plotAsset("plot-3", owned["plot-3"] ? { ownerId: owned["plot-3"] } : {}, { x: 500, y: 600 }),
    },
  });
};

test("a new player is teleported to a free plot whose drawer opens", async ({ page, world }) => {
  await seedPlots(world, { owned: { "plot-2": "someone-else" } });
  await page.goto(world.url("/"));
  await page.getByText("Need a garden? Start here.").click();
  await page.getByRole("button", { name: "Teleport to Open Garden" }).click();

  await expect.poll(() => world.events("move")).toEqual([
    expect.objectContaining({ teleport: true, moveTo: { x: 500, y: 740 }, visitorId: "42" }),
  ]);
  const [opened] = await world.events("open-iframe");
  expect(opened).toMatchObject({ droppedAssetId: "plot-3", shouldOpenInDrawer: true, title: "Open Garden" });
  expect(new URL(opened.link).searchParams.get("assetId")).toBe("plot-3");
  await expect.poll(() => world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "teleport-openPlot" }));

  // The drawer it opened works.
  await page.goto(pathOf(opened.link));
  await expect(page.getByRole("button", { name: "Start Your Garden" })).toBeVisible();
});

test("the home drawer says when there are no free plots", async ({ page, world }) => {
  await seedPlots(world, { owned: { "plot-2": "a", "plot-3": "b" } });
  await page.goto(world.url("/"));
  await page.getByText("Need a garden? Start here.").click();

  await expect(page.getByText("Sorry, gardener! Try asking an admin in this world to add more gardens.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Teleport to Open Garden" })).toHaveCount(0);
});

test("the teleport drawer counts the free plots", async ({ page, world }) => {
  await seedPlots(world);
  await page.goto(world.url("/teleport"));

  await expect(page.getByRole("heading", { name: "Find Your Garden" })).toBeVisible();
  await expect(page.getByText("There are 2 open gardens")).toBeVisible();
  await expect(page.getByRole("button", { name: "Teleport to Open Garden" })).toBeVisible();
});

test("a player with a garden is teleported back to it", async ({ page, world }) => {
  const own = garden(world, { plotAssetId: "plot-3" });
  await seedPlots(world, {
    owned: { "plot-3": world.profileId },
    visitorData: playerData({ [world.urlSlug]: own.worldEntry }),
  });
  await page.goto(world.url("/"));
  await page.getByText("Looking for your garden?").click();
  await page.getByRole("button", { name: "Teleport to My Garden" }).click();

  await expect.poll(() => world.events("move")).toEqual([expect.objectContaining({ teleport: true, moveTo: { x: 500, y: 740 } })]);
  const [opened] = await world.events("open-iframe");
  expect(opened).toMatchObject({ droppedAssetId: "plot-3", title: "Open Garden" });
  await expect.poll(() => world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "teleport-selfPlot" }));

  await page.goto(pathOf(opened.link));
  await expect(page.getByRole("heading", { name: "Your Garden" })).toBeVisible();
});

test("\"View Plot\" on a crop opens the garden's drawer", async ({ page, world }) => {
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 5, wateredAgo: 5 } } });
  await page.goto(world.url("/crop", { assetId: "crop-1" }));
  await page.getByRole("button", { name: "View Plot" }).click();

  await expect.poll(() => world.events("open-iframe")).toHaveLength(1);
  const [opened] = await world.events("open-iframe");
  expect(opened).toMatchObject({ droppedAssetId: world.assetId, title: "Garden Plot" });
  await page.goto(pathOf(opened.link));
  await expect(page.getByRole("heading", { name: "Your Garden" })).toBeVisible();
});

test("\"View Slot\" on a square opens that crop's drawer", async ({ page, world }) => {
  test.fail(true, `${BUG}: the whole query string is URL-encoded into one parameter, so the drawer gets no credentials`);
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 5, wateredAgo: 5 } } });
  await page.goto(world.url("/plot"));
  await slot(page, 5).click();
  await page.getByRole("button", { name: "View Slot" }).click();

  await expect.poll(() => world.events("open-iframe")).toHaveLength(1);
  const [opened] = await world.events("open-iframe");
  expect(opened).toMatchObject({ droppedAssetId: "crop-1", title: "Garden Plot Square" });
  await page.goto(pathOf(opened.link));
  await expect(page.getByRole("heading", { name: "Slot 5" })).toBeVisible();
});

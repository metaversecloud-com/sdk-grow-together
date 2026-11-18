// Decorations: placed on the four decoration squares (1-4) of the player's own garden.
import { expect, test } from "../../fixtures";
import { ITEM, decorationImage, quantityOf, seedOwnGarden, squarePosition } from "./garden";

const BUG = "EXP-459";
const GNOME = { decorationId: ITEM.gnome, decorationName: "Garden Gnome" };
const decorationSlot = (page: any, squareId: number) => page.locator(".card.decoration").nth(squareId - 1);

test("placing a decoration drops it on the square and records it", async ({ page, world }) => {
  await seedOwnGarden(world, { items: { [ITEM.coins]: 0, [ITEM.gnome]: 1 } });
  await page.goto(world.url("/plot"));
  await decorationSlot(page, 1).click();
  await expect(page.getByRole("heading", { name: "Place Decoration in Slot 1" })).toBeVisible();
  await page.locator(".modal .card", { hasText: "Garden Gnome" }).click();

  await expect(decorationSlot(page, 1).locator("img")).toHaveAttribute("src", "https://example.invalid/items/decoration-gnome.png");
  const { assets } = await world.state();
  const [id, asset] = Object.entries(assets).find(([, a]: any) => a.uniqueName === `GrowTogether_decoration_${world.profileId}`)!;
  expect(asset).toMatchObject({
    position: squarePosition(1),
    layer1: decorationImage("Garden Gnome"),
    clickableLinkTitle: "Garden Gnome",
    clickableLink: expect.stringContaining(`/decoration?ownerName=E2E%20Player&ownerProfileId=${world.profileId}`),
    dataObject: { ...GNOME, squareId: 1, plotAssetId: world.assetId, ownerId: world.profileId, ownerName: "E2E Player" },
  });
  const data = await world.visitorData();
  expect(data.worlds[world.urlSlug].plotSquares[1]).toBe(id);
  expect(data.worlds[world.urlSlug].decorations[id]).toMatchObject({ ...GNOME, squareId: 1 });
  expect(data.placedDecorations).toEqual({ "Garden Gnome": { [world.urlSlug]: [id] } });
  expect(await world.events("particles")).toContainEqual(expect.objectContaining({ particleName: "dirt_grow_together" }));
  const analytics = (await world.events("analytics")).map((e) => e.analyticName);
  expect(analytics).toEqual(expect.arrayContaining(["decorationsAdded", "gardenGnomeAdded"]));

  // The only gnome is placed now, so the next square offers to buy more.
  await decorationSlot(page, 2).click();
  await expect(page.getByRole("heading", { name: "Buy More Decorations" })).toBeVisible();
});

test("a decoration the player doesn't own can't be placed", async ({ request, world }) => {
  await seedOwnGarden(world, { items: { [ITEM.coins]: 0 } });

  const response = await request.post(world.api("/decoration/drop"), { data: { decorationId: ITEM.gnome, squareId: 1 } });

  expect((await response.json()).error).toBe("You must own this decoration before placing it");
  expect((await world.visitorData()).worlds[world.urlSlug].plotSquares[1]).toBeNull();
});

test("each decoration bought can only be placed once", async ({ request, world }) => {
  test.fail(true, `${BUG}: placing checks the owned quantity instead of how many are still unplaced`);
  await seedOwnGarden(world, { decorations: { "deco-1": { ...GNOME, squareId: 1 } }, items: { [ITEM.gnome]: 1 } });

  const second = await request.post(world.api("/decoration/drop"), { data: { decorationId: ITEM.gnome, squareId: 2 } });

  expect(second.ok()).toBe(false);
  expect(Object.keys((await world.visitorData()).worlds[world.urlSlug].decorations)).toEqual(["deco-1"]);
});

test("decorations only go on decoration squares (1-4)", async ({ request, world }) => {
  test.fail(true, `${BUG}: the server doesn't check which kind of square it is`);
  await seedOwnGarden(world, { items: { [ITEM.gnome]: 1 } });

  const response = await request.post(world.api("/decoration/drop"), { data: { decorationId: ITEM.gnome, squareId: 9 } });

  expect(response.ok()).toBe(false);
  expect((await world.visitorData()).worlds[world.urlSlug].plotSquares[9]).toBeNull();
});

test("removing a decoration takes it out of the world and makes it available again", async ({ page, world }) => {
  await seedOwnGarden(world, { decorations: { "deco-1": { ...GNOME, squareId: 3 } }, items: { [ITEM.gnome]: 1 } });
  await page.goto(world.url("/plot"));
  await decorationSlot(page, 3).click();
  await page.getByRole("button", { name: "Remove" }).click();

  await expect(decorationSlot(page, 3).locator("img")).toHaveAttribute("src", /add\.svg/);
  expect((await world.state()).assets["deco-1"]).toBeUndefined();
  const data = await world.visitorData();
  expect(data.worlds[world.urlSlug].plotSquares[3]).toBeNull();
  expect(data.worlds[world.urlSlug].decorations).toEqual({});
  expect(data.placedDecorations["Garden Gnome"][world.urlSlug]).toEqual([]);
  expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "decorationsRemoved" }));

  await decorationSlot(page, 3).click();
  await expect(page.locator(".modal .card", { hasText: "Garden Gnome" })).toContainText("1 available");
});

test("a decoration deleted from the world is available to place again", async ({ page, world }) => {
  await seedOwnGarden(world, {
    decorations: { "deco-1": { ...GNOME, squareId: 1 } },
    items: { [ITEM.gnome]: 1 },
    missingAssets: ["deco-1"],
  });
  await page.goto(world.url("/plot"));
  await decorationSlot(page, 2).click();

  await expect(page.locator(".modal .card", { hasText: "Garden Gnome" })).toContainText("1 available");
});

test("the decoration page shows the owner's decoration", async ({ page, world }) => {
  await seedOwnGarden(world, { decorations: { "deco-1": { ...GNOME, squareId: 4 } }, items: { [ITEM.gnome]: 1 } });
  await page.goto(world.url("/decoration", { assetId: "deco-1" }));

  await expect(page.getByText("Garden Gnome").first()).toBeVisible();
  expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "decorationDrawerViews-self" }));
  expect(await quantityOf(world, ITEM.gnome)).toBe(1);
});

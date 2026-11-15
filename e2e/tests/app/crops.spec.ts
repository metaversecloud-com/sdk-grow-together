// Planting, watering, harvesting and removing crops in the player's own garden.
import { expect, test } from "../../fixtures";
import { ITEM, cropImage, quantityOf, seedOwnGarden, squarePosition } from "./garden";

const BUG = "EXP-459";
const slot = (page: any, squareId: number) => page.locator(".card.crop").nth(squareId - 5);

test("planting a seed drops a crop on the square and records it", async ({ page, world }) => {
  await seedOwnGarden(world);
  await page.goto(world.url("/plot"));
  await slot(page, 5).click();
  await expect(page.getByRole("heading", { name: "Plant Seed in Slot 5" })).toBeVisible();
  await page.locator(".modal .card", { hasText: "Carrots" }).click();

  await expect(slot(page, 5)).toContainText("lvl 0/2");
  const { assets } = await world.state();
  const [cropId, crop] = Object.entries(assets).find(([, a]: any) => a.uniqueName === `GrowTogether_crop_${world.profileId}`)!;
  expect(crop).toMatchObject({
    position: squarePosition(5),
    layer1: cropImage("Carrots", 0),
    isInteractive: true,
    interactivePublicKey: "e2e-public-key",
    clickableLinkTitle: "Carrots",
    clickableLink: expect.stringContaining(`/crop?ownerName=E2E%20Player&ownerProfileId=${world.profileId}`),
    dataObject: {
      seedId: ITEM.carrots,
      name: "Carrots",
      growLevel: 0,
      squareId: 5,
      appliedTools: [],
      plotAssetId: world.assetId,
      ownerId: world.profileId,
      ownerName: "E2E Player",
    },
  });
  const plot = (await world.visitorData()).worlds[world.urlSlug];
  expect(plot.plotSquares[5]).toBe(cropId);
  expect(plot.crops[cropId]).toMatchObject({ seedId: ITEM.carrots, growLevel: 0, squareId: 5 });
  expect(await quantityOf(world, ITEM.xp)).toBe(1); // planting Carrots: ceil(1 min x 2 levels x 0.4)
  expect(await world.events("particles")).toContainEqual(
    expect.objectContaining({ particleName: "dirt_grow_together", position: squarePosition(5) }),
  );
  const analytics = (await world.events("analytics")).map((e) => e.analyticName);
  expect(analytics).toEqual(expect.arrayContaining(["cropsPlanted", "carrotsPlanted"]));
});

test("a paid seed must be bought before it can be planted", async ({ request, world }) => {
  await seedOwnGarden(world);

  const response = await request.post(world.api("/crop/drop"), { data: { seedId: ITEM.tomatoes, squareId: 5 } });

  expect(response.status()).toBe(500);
  expect((await response.json()).error).toBe("You must purchase this seed before planting");
  expect((await world.visitorData()).worlds[world.urlSlug].plotSquares[5]).toBeNull();
});

test("seeds can't go on an occupied square or someone else's plot", async ({ request, world }) => {
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 5 } } });

  const occupied = await request.post(world.api("/crop/drop"), { data: { seedId: ITEM.carrots, squareId: 5 } });
  expect((await occupied.json()).error).toBe("This square is already occupied");

  const elsewhere = await request.post(world.api("/crop/drop", { assetId: "plot-2" }), {
    data: { seedId: ITEM.carrots, squareId: 6 },
  });
  expect((await elsewhere.json()).error).toBe("You must own this plot before planting seeds");

  const outside = await request.post(world.api("/crop/drop"), { data: { seedId: ITEM.carrots, squareId: 17 } });
  expect((await outside.json()).error).toBe("squareId must be between 1 and 16");
  expect(Object.keys((await world.visitorData()).worlds[world.urlSlug].crops)).toEqual(["crop-1"]);
});

test("seeds only go on crop squares (5-16)", async ({ request, world }) => {
  test.fail(true, `${BUG}: the server accepts any squareId the range check lets through, incl. decoration squares and "abc"`);
  await seedOwnGarden(world);

  const decorationSquare = await request.post(world.api("/crop/drop"), { data: { seedId: ITEM.carrots, squareId: 1 } });
  const notANumber = await request.post(world.api("/crop/drop"), { data: { seedId: ITEM.carrots, squareId: "abc" } });

  expect(decorationSquare.ok()).toBe(false);
  expect(notANumber.ok()).toBe(false);
  expect((await world.visitorData()).worlds[world.urlSlug].crops).toEqual({});
});

test("planting on two squares at once keeps both crops", async ({ request, world }) => {
  test.fail(true, `${BUG}: each planting writes back the whole player record it read, so one crop is lost (its asset stays)`);
  await seedOwnGarden(world, { extra: { latencyMs: 30 } });

  const responses = await Promise.all([
    request.post(world.api("/crop/drop"), { data: { seedId: ITEM.carrots, squareId: 5 } }),
    request.post(world.api("/crop/drop"), { data: { seedId: ITEM.carrots, squareId: 6 } }),
  ]);
  expect(responses.map((r) => r.status())).toEqual([200, 200]);

  const plot = (await world.visitorData()).worlds[world.urlSlug];
  expect(Object.keys(plot.crops)).toHaveLength(2);
  expect([plot.plotSquares[5], plot.plotSquares[6]].every(Boolean)).toBe(true);
});

test("watering a ready crop grows it one level", async ({ page, world }) => {
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 5, growLevel: 0, wateredAgo: 120 } } });
  await page.goto(world.url("/plot"));
  await expect(slot(page, 5)).toContainText("Water!");
  await slot(page, 5).click();
  await page.getByRole("button", { name: "Water (+1 growth level)" }).click();

  await expect(slot(page, 5)).toContainText("lvl 1/2");
  const plot = (await world.visitorData()).worlds[world.urlSlug];
  expect(plot.crops["crop-1"].growLevel).toBe(1);
  expect(Date.now() - Date.parse(plot.crops["crop-1"].lastWatered)).toBeLessThan(30_000);
  expect(await world.assetData("crop-1")).toMatchObject({ growLevel: 1, ownerId: world.profileId });
  expect(await world.events("set-webimage-layers")).toContainEqual(
    expect.objectContaining({ assetId: "crop-1", top: cropImage("Carrots", 1) }),
  );
  expect(await world.events("particles")).toContainEqual(expect.objectContaining({ particleName: "drop_grow_together" }));
  expect(await quantityOf(world, ITEM.xp)).toBe(1);
  const analytics = (await world.events("analytics")).map((e) => e.analyticName);
  expect(analytics).toEqual(expect.arrayContaining(["cropsWatered", "carrotsWatered"]));
});

test("a crop can't be watered while it's still growing or once it's fully grown", async ({ request, world }) => {
  await seedOwnGarden(world, {
    crops: {
      "crop-1": { squareId: 5, growLevel: 0, wateredAgo: 10 },
      "crop-2": { squareId: 6, growLevel: 2 },
    },
  });

  // The reason is only logged; the player gets the generic message.
  const growing = await request.post(world.api("/crop/water"), { data: { cropAssetId: "crop-1" } });
  expect(growing.status()).toBe(500);
  expect((await growing.json()).message).toBe("Error watering crop");

  const grown = await request.post(world.api("/crop/water"), { data: { cropAssetId: "crop-2" } });
  expect(grown.status()).toBe(500);
  const plot = (await world.visitorData()).worlds[world.urlSlug];
  expect([plot.crops["crop-1"].growLevel, plot.crops["crop-2"].growLevel]).toEqual([0, 2]);
  expect(await quantityOf(world, ITEM.xp)).toBe(0);
});

test("harvesting a grown crop pays its reward and frees the square", async ({ page, world }) => {
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 5, growLevel: 2 } } });
  await page.goto(world.url("/plot"));
  await expect(slot(page, 5)).toContainText("Harvest!");
  await slot(page, 5).click();
  await page.getByRole("button", { name: "Harvest (+5 coins)" }).click();

  await expect(page.getByText("+5 Coins, +2 XP")).toBeVisible();
  await expect(slot(page, 5)).not.toContainText("lvl");
  expect(await quantityOf(world, ITEM.coins)).toBe(105);
  expect(await quantityOf(world, ITEM.xp)).toBe(2);
  const data = await world.visitorData();
  expect(data.worlds[world.urlSlug].plotSquares[5]).toBeNull();
  expect(data.worlds[world.urlSlug].crops).toEqual({});
  expect(data.totalCoinsEarned).toBe(5);
  expect((await world.state()).assets["crop-1"]).toBeUndefined();
  expect(await world.events("particles")).toContainEqual(
    expect.objectContaining({ particleName: "coin_grow_together", position: squarePosition(5) }),
  );
  const analytics = (await world.events("analytics")).map((e) => e.analyticName);
  expect(analytics).toEqual(expect.arrayContaining(["cropsHarvested", "carrotsHarvested"]));
});

test("a crop that isn't fully grown can't be harvested", async ({ request, world }) => {
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 5, growLevel: 1 } } });

  const response = await request.post(world.api("/crop/harvest"), { data: { cropAssetId: "crop-1" } });

  expect((await response.json()).error).toBe("Crop is not ready for harvest. Current growth level: 1/2");
  expect(await quantityOf(world, ITEM.coins)).toBe(100);
  expect((await world.state()).assets["crop-1"]).toBeDefined();
});

test("harvesting the same crop twice at once pays once", async ({ request, world }) => {
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 5, growLevel: 2 } }, extra: { latencyMs: 30 } });

  const responses = await Promise.all([
    request.post(world.api("/crop/harvest"), { data: { cropAssetId: "crop-1" } }),
    request.post(world.api("/crop/harvest"), { data: { cropAssetId: "crop-1" } }),
  ]);

  expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
  expect(await quantityOf(world, ITEM.coins)).toBe(105);
});

test("reaching a new rank while harvesting pays the rank bonus and announces it", async ({ page, world }) => {
  await seedOwnGarden(world, {
    crops: { "crop-1": { squareId: 5, growLevel: 2 } },
    items: { [ITEM.coins]: 100, [ITEM.xp]: 116, [ITEM.carrots]: 1 },
  });
  await page.goto(world.url("/plot"));
  await slot(page, 5).click();
  await page.getByRole("button", { name: "Harvest (+5 coins)" }).click();

  await expect(page.getByText("+15 Coins, +2 XP")).toBeVisible();
  expect(await quantityOf(world, ITEM.coins)).toBe(115); // 5 for the carrots + 10 for "Beginner Gardener"
  expect(await world.events("fire-toast")).toContainEqual(
    expect.objectContaining({
      title: "Congrats! Your garden is level 2  and your rank is now Beginner Gardener. You earned 10 coins for your new rank!",
    }),
  );
  expect(await world.events("set-activity")).toContainEqual(expect.objectContaining({ webhookType: "GAME_HIGH_SCORE", assetId: world.assetId }));
  const analytics = (await world.events("analytics")).map((e) => e.analyticName);
  expect(analytics).toEqual(expect.arrayContaining(["levelsGained", "ranksGained"]));
});

test("removing a crop deletes it from the world and frees the square", async ({ page, world }) => {
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 7, growLevel: 1, wateredAgo: 5 } } });
  await page.goto(world.url("/plot"));
  await slot(page, 7).click();
  await page.getByRole("button", { name: "Remove" }).click();

  await expect(slot(page, 7)).not.toContainText("lvl");
  expect((await world.state()).assets["crop-1"]).toBeUndefined();
  const plot = (await world.visitorData()).worlds[world.urlSlug];
  expect(plot.plotSquares[7]).toBeNull();
  expect(plot.crops).toEqual({});
  expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "cropsRemoved" }));
});

test("harvesting a crop that was deleted from the world just clears it from the garden", async ({ request, world }) => {
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 5, growLevel: 2 } }, missingAssets: ["crop-1"] });

  const response = await request.post(world.api("/crop/harvest"), { data: { cropAssetId: "crop-1" } });

  expect(await response.json()).toMatchObject({ success: false });
  expect((await world.visitorData()).worlds[world.urlSlug].crops).toEqual({});
  expect(await quantityOf(world, ITEM.coins)).toBe(100);
});

test("the crop page shows the crop's progress and lets the owner water it", async ({ page, world }) => {
  await seedOwnGarden(world, { crops: { "crop-1": { squareId: 6, growLevel: 1, wateredAgo: 120 } } });
  await page.goto(world.url("/crop", { assetId: "crop-1" }));

  await expect(page.getByRole("heading", { name: "Slot 6" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Carrots" })).toBeVisible();
  await expect(page.getByText("Lvl 1/2")).toBeVisible();
  await expect(page.getByText("Ready to Water!")).toBeVisible();
  await page.getByRole("button", { name: "Water (+1 growth level)" }).click();

  await expect.poll(async () => (await world.assetData("crop-1")).growLevel).toBe(2);
  expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "cropDrawerViews-self" }));
});

test("the owner opening a crop the garden no longer lists removes the stray crop", async ({ page, world }) => {
  await seedOwnGarden(world, {
    extra: {
      extraAssets: {
        stray: {
          id: "stray",
          uniqueName: "GrowTogether_crop_x",
          dataObject: { seedId: ITEM.carrots, name: "Carrots", squareId: 8, ownerId: world.profileId },
        },
      },
    },
  });
  await page.goto(world.url("/crop", { assetId: "stray" }));

  await expect(page.getByText("No crop data found.")).toBeVisible();
  expect((await world.state()).assets.stray).toBeUndefined();
  expect(await world.events("close-iframe")).toContainEqual(expect.objectContaining({ droppedAssetId: "stray" }));
});

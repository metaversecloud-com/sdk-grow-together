// The Garden Store: seeds, tools, decorations and accessories bought with coins.
import { expect, test } from "../../fixtures";
import { ITEM, quantityOf, seedOwnGarden } from "./garden";

const BUG = "EXP-459";
const card = (page: any, name: string) => page.locator(".modal .card", { hasText: name });

const openStore = async (page: any, world: any, tab?: string) => {
  await page.goto(world.url("/plot"));
  await page.getByRole("button", { name: "View Store" }).click();
  await expect(page.getByRole("heading", { name: "Garden Store" })).toBeVisible();
  if (tab) await page.locator(".modal").getByRole("button", { name: tab, exact: true }).click();
};

test("the seed store lists the seeds the player can still buy", async ({ page, world }) => {
  await seedOwnGarden(world, { items: { [ITEM.coins]: 50, [ITEM.carrots]: 1 } });
  await openStore(page, world);

  await expect(card(page, "Tomatoes")).toBeVisible();
  await expect(card(page, "Pumpkins")).toBeVisible();
  await expect(card(page, "Carrots")).toHaveCount(0); // already owned
  await expect(card(page, "Retired Beans")).toHaveCount(0); // inactive in the catalog
  await expect(card(page, "Tomatoes").getByRole("button", { name: "Buy" })).toBeEnabled();
  await expect(card(page, "Pumpkins").getByRole("button", { name: "Buy" })).toBeDisabled(); // 100 coins, has 50
});

test("buying a seed spends its price and unlocks it", async ({ page, world }) => {
  await seedOwnGarden(world, { items: { [ITEM.coins]: 50, [ITEM.carrots]: 1 } });
  await openStore(page, world);
  await card(page, "Tomatoes").getByRole("button", { name: "Buy" }).click();

  await expect(card(page, "Tomatoes")).toHaveCount(0);
  await expect(page.locator(".modal").getByText("Your Money: 30 Coins")).toBeVisible();
  expect(await quantityOf(world, ITEM.coins)).toBe(30);
  expect(await quantityOf(world, ITEM.tomatoes)).toBe(1);
  expect(await world.events("fire-toast")).toContainEqual(
    expect.objectContaining({ title: "You purchased a new seed!", text: "You can now plant Tomatoes seeds in your garden." }),
  );
  const analytics = (await world.events("analytics")).map((e) => e.analyticName);
  expect(analytics).toEqual(expect.arrayContaining(["seedsUnlocked", "tomatoesUnlocked"]));
});

test("a seed can't be bought twice or without enough coins", async ({ request, world }) => {
  await seedOwnGarden(world, { items: { [ITEM.coins]: 50, [ITEM.carrots]: 1, [ITEM.tomatoes]: 1 } });

  const twice = await request.post(world.api("/seed/purchase"), { data: { seedId: ITEM.tomatoes } });
  expect((await twice.json()).error).toBe("Seed already purchased");

  const tooExpensive = await request.post(world.api("/seed/purchase"), { data: { seedId: ITEM.pumpkins } });
  expect((await tooExpensive.json()).error).toBe("Not enough coins. Need 100, have 50");

  const retired = await request.post(world.api("/seed/purchase"), { data: { seedId: ITEM.retiredSeed } });
  expect((await retired.json()).error).toBe("Invalid seed type");
  expect(await quantityOf(world, ITEM.coins)).toBe(50);
});

test("buying the free seed doesn't change the player's coins", async ({ request, world }) => {
  test.fail(true, `${BUG}: a 0-coin price is sent as a 0 quantity change, which Topia applies as +1`);
  await seedOwnGarden(world, { items: { [ITEM.coins]: 50, [ITEM.carrots]: 1 } });

  for (let i = 0; i < 3; i++) await request.post(world.api("/seed/purchase"), { data: { seedId: ITEM.carrots } });

  expect(await quantityOf(world, ITEM.coins)).toBe(50);
});

test("buying a tool adds the pack's quantity", async ({ page, world }) => {
  await seedOwnGarden(world, { items: { [ITEM.coins]: 50, [ITEM.basicMulch]: 2 } });
  await openStore(page, world, "Tools");
  await expect(card(page, "Basic Mulch")).toContainText("Price for 5: 10");
  await card(page, "Basic Mulch").getByRole("button", { name: "Buy" }).click();

  await expect(page.locator(".modal").getByText("Your Money: 40 Coins")).toBeVisible();
  await expect.poll(() => quantityOf(world, ITEM.basicMulch)).toBe(7);
  expect(await quantityOf(world, ITEM.coins)).toBe(40);
  expect(await world.events("fire-toast")).toContainEqual(
    expect.objectContaining({ title: "You purchased a new tool!", text: "You can now use a Basic Mulch in your garden." }),
  );
  expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "basicMulchPurchased" }));
});

test("buying a decoration makes one more available to place", async ({ page, world }) => {
  await seedOwnGarden(world, { items: { [ITEM.coins]: 50 } });
  await openStore(page, world, "Decorations");
  await card(page, "Garden Gnome").getByRole("button", { name: "Buy" }).click();

  await expect(page.locator(".modal").getByText("Your Money: 20 Coins")).toBeVisible();
  await expect.poll(() => quantityOf(world, ITEM.gnome)).toBe(1);
  await expect(card(page, "Garden Gnome").getByRole("button", { name: "Buy" })).toBeVisible();
  await page.locator(".modal .modal-header button").click();
  await page.locator(".card.decoration").first().click();
  await expect(card(page, "Garden Gnome")).toContainText("1 available");
});

test("an accessory can only be bought once", async ({ page, request, world }) => {
  await seedOwnGarden(world, { items: { [ITEM.coins]: 60 } });
  await openStore(page, world, "Accessories");
  await card(page, "Farmer's Straw Hat").getByRole("button", { name: "Buy" }).click();

  await expect(page.locator(".modal").getByText("Nice work, you've already purchased all currently available accessories!")).toBeVisible();
  expect(await quantityOf(world, ITEM.coins)).toBe(35);
  expect(await quantityOf(world, ITEM.strawHat)).toBe(1);
  expect(await world.events("fire-toast")).toContainEqual(expect.objectContaining({ text: "You now own Farmer's Straw Hat." }));

  const again = await request.post(world.api("/accessory/purchase"), { data: { accessoryId: ITEM.strawHat } });
  expect((await again.json()).error).toBe("Accessory already purchased");
  expect(await quantityOf(world, ITEM.coins)).toBe(35);
});

test("buying the same accessory twice at once charges once", async ({ request, world }) => {
  test.fail(true, `${BUG}: purchases have no lock; both pass the "already owned" check and both charge`);
  await seedOwnGarden(world, { items: { [ITEM.coins]: 60 }, extra: { latencyMs: 30 } });

  await Promise.all([
    request.post(world.api("/accessory/purchase"), { data: { accessoryId: ITEM.strawHat } }),
    request.post(world.api("/accessory/purchase"), { data: { accessoryId: ITEM.strawHat } }),
  ]);

  expect(await quantityOf(world, ITEM.coins)).toBe(35);
  expect(await quantityOf(world, ITEM.strawHat)).toBe(1);
});

test("two purchases at once can't spend more coins than the player has", async ({ request, world }) => {
  test.fail(true, `${BUG}: each purchase checks the balance it read before either one paid`);
  await seedOwnGarden(world, { items: { [ITEM.coins]: 30 }, extra: { latencyMs: 30 } });

  await Promise.all([
    request.post(world.api("/decoration/purchase"), { data: { decorationId: ITEM.gnome } }),
    request.post(world.api("/decoration/purchase"), { data: { decorationId: ITEM.gnome } }),
  ]);

  expect(await quantityOf(world, ITEM.coins)).toBeGreaterThanOrEqual(0);
  expect(await quantityOf(world, ITEM.gnome)).toBe(1);
});

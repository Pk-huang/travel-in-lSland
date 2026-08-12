import { expect, test } from "@playwright/test";

test("homepage loads and exposes the primary mode controls", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "天氣" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "景點" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /展開天氣面板/ }).first()).toBeVisible();
});

test("switching info modes keeps the UI responsive", async ({ page }) => {
  await page.goto("/");

  const weatherDrawer = page.locator("aside");
  await expect(page.getByText("天氣 / 路況 / 景點")).toBeVisible();

  await weatherDrawer.getByRole("button", { name: "景點" }).click();
  await expect(page.getByText("景點（")).toBeVisible();

  await weatherDrawer.getByRole("button", { name: "天氣" }).click();
  await expect(weatherDrawer.getByText("天氣測站").first()).toBeVisible();
});

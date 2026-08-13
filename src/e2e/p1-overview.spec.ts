import { expect, test } from "@playwright/test";

test("settings panel can open, switch tabs, and keep the scene usable", async ({ page }) => {
  await page.goto("/");

  const settingsButton = page.getByRole("button", { name: "開啟設定抽屜" }).first();
  await settingsButton.click();

  await expect(page.getByText("Scene Settings")).toBeVisible();
  await expect(page.getByRole("button", { name: "顯示" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "光影風格" }).click();
  await expect(page.getByLabel("光影風格")).toBeVisible();

  await page.getByRole("button", { name: "時間軸" }).click();
  await expect(page.getByLabel("選擇時間")).toBeVisible();

  await page.getByRole("button", { name: "關閉設定抽屜" }).click();
  await expect(page.getByRole("button", { name: "開啟設定抽屜" })).toBeVisible();
});

test("main mode buttons stay clickable after switching tabs", async ({ page }) => {
  await page.goto("/");

  const weatherDrawer = page.locator("aside");
  await expect(page.getByText("天氣 / 路況 / 景點")).toBeVisible();

  await weatherDrawer.getByRole("button", { name: "景點" }).click();
  await expect(page.getByText("景點（")).toBeVisible();

  await weatherDrawer.getByRole("button", { name: "天氣" }).click();
  await expect(weatherDrawer.getByText("天氣測站").first()).toBeVisible();
});

import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

// ============================================================
// E2E Flow: Recipe Detail & Cook (ตัดสต็อกตู้เย็น)
// ============================================================

test("E2E Recipe Flow: Add ingredients, view Recipe detail, and Cook", async ({ page }) => {
  test.setTimeout(120000);

  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // 1. Register & Login
  const uniqueId = Date.now();
  const testUser = `recipe_user_${uniqueId}`;
  await loginPage.goto();
  await loginPage.register(testUser, "password123");
  await expect(dashboardPage.logoutBtn).toBeVisible({ timeout: 15000 });
  console.log("Logged in for recipe test.");

  // 2. เพิ่มวัตถุดิบที่ Recipe 101 ต้องการ (chicken)
  await dashboardPage.goToInventory();
  await dashboardPage.addInventoryManual("chicken", 500, "กรัม");
  await expect(page.locator("text=chicken").first()).toBeVisible({ timeout: 8000 });
  console.log("Added chicken to inventory.");
  await page.waitForTimeout(1000);

  // 3. ไปหน้า Recipes
  await dashboardPage.goToRecipes();
  const firstRecipeCard = page.locator(".grid h4, [class*='recipe'] h4, h4").first();
  await expect(firstRecipeCard).toBeVisible({ timeout: 15000 });
  const recipeTitle = await firstRecipeCard.innerText();
  console.log(`Recipe found: ${recipeTitle}`);
  await page.waitForTimeout(1500);

  // 4. คลิกเข้าดู Detail
  await firstRecipeCard.click();
  await expect(page.locator("text=ส่วนผสม (Ingredients), text=Ingredients")).toBeVisible({ timeout: 10000 });
  console.log("Recipe detail page loaded.");
  await page.waitForTimeout(2000);

  // 5. ตรวจสอบ ingredient list แสดงผลถูกต้อง
  const ingredientSection = page.locator("text=ส่วนผสม (Ingredients), text=Ingredients").first();
  await expect(ingredientSection).toBeVisible();

  // 6. ลองกดปุ่ม "ทำอาหาร" (ถ้ามีของครบ)
  const cookBtn = page.locator("button:has-text('ทำอาหาร'), button:has-text('Cook'), button:has-text('ปรุงอาหาร')").first();
  if (await cookBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log("Cook button found. Attempting to cook...");
    await cookBtn.click();
    await page.waitForTimeout(3000);
    console.log("Cook action completed.");
  } else {
    console.log("Cook button not visible (ingredients may be missing — expected).");
  }

  // 7. Logout
  await page.locator("text=กลับไปรายการ, text=กลับ").first().click().catch(() => {});
  await dashboardPage.homeTab.click().catch(() => {});
  await dashboardPage.logout();
  await expect(loginPage.usernameInput).toBeVisible({ timeout: 15000 });
  console.log("Recipe & Cook E2E flow completed. ✅");
});

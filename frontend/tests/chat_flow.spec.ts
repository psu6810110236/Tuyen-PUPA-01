import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

// ============================================================
// E2E Flow: AI Chat — ส่งข้อความและรับการตอบกลับจาก AI
// ============================================================

test("E2E Chat Flow: Login, chat with AI, verify response", async ({ page }) => {
  test.setTimeout(90000);

  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // 1. Register & Login
  const uniqueId = Date.now();
  const testUser = `chat_user_${uniqueId}`;
  await loginPage.goto();
  await loginPage.register(testUser, "password123");
  await expect(dashboardPage.logoutBtn).toBeVisible({ timeout: 15000 });
  console.log("Logged in for chat test.");
  await page.waitForTimeout(1500);

  // 2. เพิ่มวัตถุดิบในตู้เย็นก่อน (เพื่อให้ AI มีบริบท)
  await dashboardPage.goToInventory();
  await dashboardPage.addInventoryManual("อกไก่", 200, "กรัม");
  await page.waitForTimeout(1000);
  console.log("Added อกไก่ to fridge.");

  // 3. ไปหน้า Chat
  await dashboardPage.chatTab.click();
  await page.waitForTimeout(1500);

  // 4. ตรวจว่า Chat input มองเห็นได้
  const chatInput = page.locator("input[placeholder*='พิมพ์'], textarea[placeholder*='พิมพ์']").first();
  await expect(chatInput).toBeVisible({ timeout: 10000 });
  console.log("Chat input is visible.");
  await page.waitForTimeout(1000);

  // 5. ส่งข้อความถาม AI
  const question = "อกไก่ในตู้เย็นทำอะไรกินง่ายๆ ได้บ้าง?";
  await chatInput.fill(question);
  await page.waitForTimeout(500);
  await chatInput.press("Enter");
  console.log(`Sent message: "${question}"`);

  // 6. รอ AI ตอบกลับ (bubble ที่ 2 = AI response)
  const aiResponseBubble = page.locator(
    ".flex.justify-start .bg-white, [class*='ai-bubble'], [class*='assistant']"
  ).nth(1);
  await expect(aiResponseBubble).toBeVisible({ timeout: 30000 });
  console.log("AI responded successfully. ✅");
  await page.waitForTimeout(3000);

  // 7. ตรวจว่า AI response ไม่ว่าง
  const aiText = await aiResponseBubble.innerText();
  expect(aiText.length).toBeGreaterThan(5);
  console.log(`AI response preview: "${aiText.substring(0, 80)}..."`);

  // 8. Logout
  await dashboardPage.homeTab.click().catch(() => {});
  await dashboardPage.logout();
  await expect(loginPage.usernameInput).toBeVisible({ timeout: 15000 });
  console.log("Chat E2E flow completed. ✅");
});

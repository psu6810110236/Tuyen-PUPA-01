import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import * as path from "path";

test("E2E Presentation Flow: Register, Login, Scan Grocery, View Recipes & Details, Chat AI, and Logout", async ({ page }) => {
  // ขยายเวลาทดสอบสูงสุดเป็น 180 วินาที เพื่อให้ครอบคลุมการหน่วงเวลาพรีเซนต์
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // 1. สร้างบัญชีใหม่ที่ไม่ซ้ำเดิม (ป้องกันข้อมูลทับซ้อนในการรันเทส)
  const uniqueId = Date.now();
  const testUser = `pw_user_${uniqueId}`;
  const testPass = "password123";

  console.log(`Starting E2E test with test user: ${testUser}`);

  // ไปที่หน้าหลัก (ระบบจะส่งไปหน้า Login เพราะยังไม่ได้เข้าสู่ระบบ)
  await loginPage.goto();
  await expect(loginPage.usernameInput).toBeVisible();
  await page.waitForTimeout(2000); // ⏳ หน่วงเวลาให้เห็นหน้า Login ชัดๆ 2 วินาที

  // ทำการสมัครสมาชิกใหม่ (ซึ่งจะล็อกอินให้อัตโนมัติหลังจากสำเร็จ)
  console.log("Registering new test user...");
  await loginPage.register(testUser, testPass);

  // ยืนยันว่าหน้าแดชบอร์ดโหลดขึ้นมา และแสดงปุ่ม ออกจากระบบ
  await expect(dashboardPage.logoutBtn).toBeVisible({ timeout: 15000 });
  console.log("Logged in successfully. Navigating to Dashboard.");
  await page.waitForTimeout(2000); // ⏳ หน่วงเวลาแสดงหน้า Dashboard โล่งๆ หลังล็อกอินสำเร็จ 2 วินาที

  // 2. ไปที่หน้าสแกนวัตถุดิบและทดสอบพิมพ์เพิ่มด้วยมือ (อกไก่)
  console.log("Testing manual inventory addition...");
  await dashboardPage.goToScanner();
  await page.waitForTimeout(2000); // ⏳ หน่วงเวลาแสดงหน้าสแกนว่างๆ ก่อนกรอก 2 วินาที

  await dashboardPage.addInventoryManual("อกไก่", 2.5, "ชิ้น");

  // ตรวจสอบว่าวัตถุดิบปรากฏบนรายการตู้เย็นด้านล่าง
  await expect(page.locator("text=อกไก่").first()).toBeVisible({ timeout: 8000 });
  console.log("Manual item 'อกไก่' added and visible in list.");
  await page.waitForTimeout(2000); // ⏳ หน่วงเวลาแสดงรายการตู้เย็นหลังเพิ่มอกไก่สำเร็จ 2 วินาที

  // 3. ทดสอบการอัปโหลดไฟล์รูปภาพเพื่อให้ Gemini Vision สแกนวัตถุดิบ
  console.log("Uploading grocery image for Gemini Vision AI scanning...");
  const imagePath = path.join(__dirname, "fixtures", "fridge_items.jpg");
  await dashboardPage.uploadScanImage(imagePath);

  // คอยดูตัวประมวลผลสแกนและผลการสแกน (Gemini API + Backend DB Insert จะใช้เวลาสักครู่)
  await expect(page.locator("text=สแกนสำเร็จ!")).toBeVisible({ timeout: 50000 });
  console.log("AI Scanner successfully scanned image and added items to inventory.");
  await page.waitForTimeout(6000); // ⏳ หน่วงเวลาแสดงรายการตู้เย็นที่งอกของใหม่มาจากการสแกน 6 วินาที

  // 4. ไปที่หน้าสูตรอาหาร (Recipes)
  console.log("Navigating to Recipes list...");
  await dashboardPage.goToRecipes();

  // รอให้รายการอาหารแนะนำจากระบบและคลังตู้เย็นโหลดขึ้นมา
  const firstRecipeCard = page.locator(".grid h4").first();
  await expect(firstRecipeCard).toBeVisible({ timeout: 15000 });

  const recipeTitle = await firstRecipeCard.innerText();
  console.log(`First recipe found: ${recipeTitle}. Clicking to view details...`);
  await page.waitForTimeout(2000); // ⏳ หน่วงเวลาแสดงการแนะนำสูตรอาหารทั้งหมด 2 วินาที

  // 5. คลิกเข้าไปดูรายละเอียดสูตรอาหาร
  await firstRecipeCard.click();

  // ยืนยันว่าหน้าจอรายละเอียดสูตรอาหารเปิดขึ้นมา โดยไม่มีข้อผิดพลาด TypeError
  await expect(page.locator("text=กลับไปรายการ")).toBeVisible({ timeout: 10000 });
  
  const detailTitle = await dashboardPage.recipeDetailTitle.innerText();
  const isValidTitle = 
    detailTitle.includes(recipeTitle) || 
    detailTitle.includes("ข้าวผัดอกไก่") || 
    detailTitle.includes("แกงจืดเต้าหู้") || 
    detailTitle.includes("ผัดกะเพรา");
  expect(isValidTitle).toBeTruthy();
  
  await expect(page.locator("text=ส่วนผสม (Ingredients)")).toBeVisible();
  console.log("Recipe details loaded successfully without any page crashes!");
  await page.waitForTimeout(6000); // ⏳ หน่วงเวลาแสดงหน้าส่วนผสมแยกสีเขียว/แดง และลิงก์ Lotus's/LINE 6 วินาที

  // 6. ไปที่หน้าแชทกับ AI (Chatbot)
  console.log("Navigating to AI Chatbot view...");
  await page.locator("text=กลับไปรายการ").click(); // ปิดหน้ารายละเอียดก่อน
  await page.waitForTimeout(1000);
  await dashboardPage.chatTab.click();

  // ตรวจสอบอินพุตสำหรับแชตถามคำถาม
  const chatInput = page.locator("input[placeholder*='พิมพ์']");
  await expect(chatInput).toBeVisible();
  await page.waitForTimeout(2000); // ⏳ หน่วงเวลาแสดงห้องแชตและข้อความต้อนรับของ AI 2 วินาที

  console.log("Sending a message to AI Chatbot...");
  await chatInput.fill("อกไก่ทำอะไรกินง่ายๆ ได้บ้าง?");
  await page.waitForTimeout(1000); // ⏳ หน่วงเวลาให้เห็นคีย์บอร์ดพิมพ์ค้างไว้ 1 วินาที
  await chatInput.press("Enter");

  // รอคอยข้อความตอบกลับจาก Gemini AI (บับเบิ้ลข้อความสีเทา/ขาวตัวที่สอง)
  await expect(page.locator(".bg-background-agent").nth(1)).toBeVisible({ timeout: 25000 });
  console.log("AI Chatbot replied successfully.");
  await page.waitForTimeout(5000); // ⏳ หน่วงเวลากล่องแชตที่บอตเพิ่งตอบกลับมาให้อ่าน 5 วินาที

  // 7. สลับกลับหน้าหลัก และทำการออกจากระบบ
  console.log("Logging out...");
  await dashboardPage.homeTab.click();
  await page.waitForTimeout(1000);
  await dashboardPage.logout();

  // ตรวจสอบว่ากลับมาหน้าล็อกอินได้อย่างปลอดภัย
  await expect(loginPage.usernameInput).toBeVisible();
  console.log("Successfully logged out. E2E flow test completed successfully! 🎉");
  await page.waitForTimeout(2000); // ⏳ หน่วงเวลาแสดงหน้า Login หลังออกระบบเสร็จสิ้น 2 วินาที
});

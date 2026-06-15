import { Page, Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  
  // Navigation Tabs (Mobile/Desktop friendly locators)
  readonly homeTab: Locator;
  readonly scannerTab: Locator;
  readonly recipeTab: Locator;
  readonly chatTab: Locator;
  readonly logoutBtn: Locator;

  // Scanner View Elements
  readonly uploadInput: Locator;
  readonly scanningIndicator: Locator;
  readonly openManualFormBtn: Locator;
  readonly manualNameInput: Locator;
  readonly manualQtyInput: Locator;
  readonly manualUnitSelect: Locator;
  readonly submitManualBtn: Locator;
  readonly successMessage: Locator;

  // Recipe View Elements
  readonly recipeCard: (title: string) => Locator;
  readonly recipeDetailTitle: Locator;
  readonly lineShareBtn: Locator;
  readonly lotusLink: () => Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation (Selects buttons containing the labels, working across layout styles)
    this.homeTab = page.locator("button:has-text('หน้าหลัก')").first();
    this.scannerTab = page.locator("button:has-text('สแกนวัตถุดิบ')").first();
    this.recipeTab = page.locator("button:has-text('สูตรอาหาร')").first();
    this.chatTab = page.locator("button:has-text('แชทกับ AI')").first();
    this.logoutBtn = page.locator("button:has-text('ออกจากระบบ')").first();

    // Scanner View elements
    this.uploadInput = page.locator("input[type='file']");
    this.scanningIndicator = page.locator("text=กำลังวิเคราะห์รูปภาพ...");
    this.openManualFormBtn = page.locator("button:has-text('พิมพ์เพิ่มวัตถุดิบเอง')").first();
    this.manualNameInput = page.locator("#inv-name");
    this.manualQtyInput = page.locator("#inv-qty");
    this.manualUnitSelect = page.locator("#inv-unit");
    this.submitManualBtn = page.locator("form >> button[type='submit']");
    this.successMessage = page.locator("text=เพิ่มสำเร็จ, text=✅");

    // Recipes View elements
    this.recipeCard = (title: string) => page.locator(`h4:has-text('${title}')`).first();
    this.recipeDetailTitle = page.locator("h2.font-heading").first();
    this.lineShareBtn = page.locator("a:has-text('ส่งรายการซื้อเข้า LINE')").first();
    this.lotusLink = () => page.locator(`a:has-text('ค้นหาใน Lotus\\'s')`).first();
  }

  async goToScanner() {
    await this.scannerTab.click();
    await expect(this.openManualFormBtn).toBeVisible();
  }

  async goToRecipes() {
    await this.recipeTab.click();
  }

  async logout() {
    await this.logoutBtn.click();
  }

  async addInventoryManual(name: string, quantity: number, unit: string) {
    await this.openManualFormBtn.click();
    await this.manualNameInput.fill(name);
    await this.manualQtyInput.fill(quantity.toString());
    await this.manualUnitSelect.selectOption(unit);
    await this.submitManualBtn.click();
  }

  async uploadScanImage(filePath: string) {
    // อัปโหลดไฟล์รูปภาพลงใน input[type=file] ซ่อนอยู่
    await this.uploadInput.setInputFiles(filePath);
  }

  async verifyRecipeDetail(recipeTitle: string) {
    // ดึงสูตรอาหาร แนะนำปุ่มสูตรอาหาร
    const card = this.recipeCard(recipeTitle);
    await card.click();
    // ยืนยันว่าหน้าดีเทลถูกเปิดขึ้นมาและหัวข้อตรงกัน
    await expect(this.recipeDetailTitle).toContainText(recipeTitle);
  }
}

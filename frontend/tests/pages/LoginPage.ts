import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly loginTabBtn: Locator;
  readonly registerTabBtn: Locator;
  readonly submitBtn: Locator;
  readonly switchModeBtn: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator("#auth-username");
    this.passwordInput = page.locator("#auth-password");
    this.confirmPasswordInput = page.locator("#auth-confirm-password");
    this.loginTabBtn = page.locator("button:has-text('เข้าสู่ระบบ')").first();
    this.registerTabBtn = page.locator("button:has-text('สมัครสมาชิก')").first();
    this.submitBtn = page.locator("button[type='submit']");
    this.switchModeBtn = page.locator("p >> button:has-text('สมัครสมาชิกเลย'), p >> button:has-text('เข้าสู่ระบบ')");
    this.errorMessage = page.locator("text=⚠️");
    this.successMessage = page.locator("text=✅");
  }

  async goto() {
    await this.page.goto("/");
  }

  async switchToRegister() {
    await this.registerTabBtn.click();
  }

  async switchToLogin() {
    await this.loginTabBtn.click();
  }

  async register(username: string, password: string) {
    await this.switchToRegister();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.submitBtn.click();
  }

  async login(username: string, password: string) {
    await this.switchToLogin();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }
}

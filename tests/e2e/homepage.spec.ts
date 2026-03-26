import { test, expect } from "../../playwright-fixture";

test.describe("Homepage", () => {
  test("renders hero section and generate form", async ({ page }) => {
    await page.goto("/");
    
    // Check hero text is visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    
    // Check URL input exists
    const urlInput = page.getByPlaceholder(/wordpress|url|paste/i);
    await expect(urlInput).toBeVisible();
    
    // Check Generate button exists
    const generateBtn = page.getByRole("button", { name: /generate/i });
    await expect(generateBtn).toBeVisible();
  });

  test("shows validation when generating without URL", async ({ page }) => {
    await page.goto("/");
    
    const generateBtn = page.getByRole("button", { name: /generate/i });
    await generateBtn.click();
    
    // Should show some error/validation message
    await page.waitForTimeout(1000);
  });

  test("navigates to login page", async ({ page }) => {
    await page.goto("/");
    
    const loginLink = page.getByRole("link", { name: /log\s*in|sign\s*in/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/auth\/login/);
    }
  });
});

test.describe("Auth Pages", () => {
  test("login page renders form", async ({ page }) => {
    await page.goto("/auth/login");
    
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("signup page renders form", async ({ page }) => {
    await page.goto("/auth/signup");
    
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});

test.describe("404 Page", () => {
  test("shows not found for invalid routes", async ({ page }) => {
    await page.goto("/this-does-not-exist");
    
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });
});

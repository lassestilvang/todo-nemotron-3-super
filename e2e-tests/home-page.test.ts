import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Todo/);
  });

  test('displays the main heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shows login button for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Sign In')).toBeVisible();
  });
});
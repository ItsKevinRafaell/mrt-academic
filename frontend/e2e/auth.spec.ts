import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /register|daftar/i }).click();
    await expect(page.url()).toContain('/register');
  });
});

test.describe('Dashboard', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.url()).toContain('/login');
  });
});

test.describe('Akademik', () => {
  test('should show course list page', async ({ page }) => {
    await page.goto('/akademik');
    await expect(page.getByRole('heading', { name: /akademik/i })).toBeVisible();
  });
});

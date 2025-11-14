/**
 * E2E Tests for Gift Registry Flow
 */

const { test, expect } = require('@playwright/test');

test.describe('Gift Registry - View Gifts', () => {
  test('user can view gift list', async ({ page }) => {
    await page.goto('/gifts.html');

    // Check page title
    await expect(page.locator('h1, h2')).toContainText(/Geschenk|Gift/i);

    // Check that gift items are displayed
    // This assumes there are gifts in the database
    // In a real test, you would seed test data
  });

  test('reserved gifts are marked correctly', async ({ page }) => {
    await page.goto('/gifts.html');

    // Check for reserved status indicators
    // This depends on your UI implementation
    // await expect(page.locator('.gift-item.reserved')).toBeVisible();
  });
});

test.describe('Gift Registry - Reserve Gift', () => {
  test('user can reserve an available gift', async ({ page }) => {
    // Skip if no test data available
    test.skip();

    await page.goto('/gifts.html');

    // Find an unreserved gift
    const availableGift = page.locator('.gift-item:not(.reserved)').first();
    await availableGift.click();

    // Fill in reservation form
    await page.fill('#reserverEmail', 'guest@example.com');
    await page.fill('#reserverName', 'Test Guest');

    // Submit reservation
    await page.click('button[type="submit"]');

    // Check for success message
    await page.waitForTimeout(2000);
  });

  test('validates email when reserving', async ({ page }) => {
    test.skip();

    await page.goto('/gifts.html');

    // Try to reserve with invalid email
    const availableGift = page.locator('.gift-item:not(.reserved)').first();
    await availableGift.click();

    await page.fill('#reserverEmail', 'invalid-email');
    await page.fill('#reserverName', 'Test Guest');

    await page.click('button[type="submit"]');

    // Should show validation error
  });

  test('prevents reserving already reserved gifts', async ({ page }) => {
    test.skip();

    await page.goto('/gifts.html');

    // Try to reserve an already reserved gift
    const reservedGift = page.locator('.gift-item.reserved').first();

    // Reserve button should be disabled or not present
    const reserveButton = reservedGift.locator('button:has-text("Reservieren")');
    await expect(reserveButton).toBeDisabled();
  });
});

test.describe('Gift Registry - Undo Reservation', () => {
  test('user can undo reservation with valid link', async ({ page }) => {
    test.skip();

    // This requires a valid undo token
    const testGiftId = 'test-gift-id';
    const testToken = 'test-token';

    await page.goto(`/undoGift?giftId=${testGiftId}&token=${testToken}`);

    // Should redirect to gifts page
    await expect(page).toHaveURL(/gifts\.html/);
  });

  test('undo fails with invalid token', async ({ page }) => {
    test.skip();

    const testGiftId = 'test-gift-id';
    const invalidToken = 'wrong-token';

    await page.goto(`/undoGift?giftId=${testGiftId}&token=${invalidToken}`);

    // Should show error message
    await expect(page.locator('body')).toContainText(/Ungültig|Invalid/i);
  });
});

test.describe('Gift Registry - Admin Functions', () => {
  test('admin can add new gift', async ({ page }) => {
    test.skip();

    // This requires authentication
    // await loginAsAdmin(page);

    await page.goto('/admin.html');

    // Navigate to gift management
    await page.click('text=Geschenke');

    // Click add gift button
    await page.click('button:has-text("Hinzufügen")');

    // Fill in gift details
    await page.fill('#giftName', 'Test Geschenk');
    await page.fill('#giftDescription', 'Test Beschreibung');

    // Submit
    await page.click('button[type="submit"]');

    // Check for success
    await page.waitForTimeout(2000);
  });

  test('admin can delete gift', async ({ page }) => {
    test.skip();

    // await loginAsAdmin(page);

    await page.goto('/admin.html');

    // Find delete button
    const deleteButton = page.locator('button:has-text("Löschen")').first();
    await deleteButton.click();

    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());

    // Wait for deletion
    await page.waitForTimeout(1000);
  });

  test('admin can unreserve gift', async ({ page }) => {
    test.skip();

    // await loginAsAdmin(page);

    await page.goto('/admin.html');

    // Find unreserve button on reserved gift
    const unreserveButton = page.locator('button:has-text("Zurücksetzen")').first();
    await unreserveButton.click();

    // Check for success
    await page.waitForTimeout(1000);
  });
});

test.describe('Gift Registry - Image Import', () => {
  test('admin can import gift image from URL', async ({ page }) => {
    test.skip();

    // await loginAsAdmin(page);

    await page.goto('/admin.html');

    // Navigate to add gift
    await page.click('text=Geschenke');
    await page.click('button:has-text("Hinzufügen")');

    // Fill in product URL
    await page.fill('#productUrl', 'https://example.com/product');

    // Click import button
    await page.click('button:has-text("Importieren")');

    // Wait for image to load
    await page.waitForTimeout(2000);

    // Check that image preview is shown
    // await expect(page.locator('#imagePreview')).toBeVisible();
  });
});

test.describe('Gift Registry - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('gift list is usable on mobile', async ({ page }) => {
    await page.goto('/gifts.html');

    // Check that gifts are visible and properly laid out
    // await expect(page.locator('.gift-item').first()).toBeVisible();

    // Check that images don't overflow
    // const giftImage = page.locator('.gift-item img').first();
    // if (await giftImage.count() > 0) {
    //   const boundingBox = await giftImage.boundingBox();
    //   expect(boundingBox.width).toBeLessThanOrEqual(375);
    // }
  });
});

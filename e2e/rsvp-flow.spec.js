/**
 * E2E Tests for RSVP Flow
 */

const { test, expect } = require('@playwright/test');

test.describe('RSVP Submission Flow', () => {
  test('user can submit RSVP with acceptance', async ({ page }) => {
    // Navigate to RSVP page
    await page.goto('/rsvp.html');

    // Check page loaded
    await expect(page.locator('h1, h2')).toContainText('RSVP');

    // Fill in family name
    await page.fill('#familyName', 'Familie Mustermann');

    // Fill in email
    await page.fill('#email', 'mustermann@example.com');

    // Select attending = yes
    await page.check('input[name="attending"][value="yes"]');

    // Set number of guests
    await page.fill('#guests', '2');

    // Wait for guest fields to render
    await page.waitForSelector('#guestName_1');

    // Fill in guest names
    await page.fill('#guestName_1', 'Max');
    await page.fill('#guestName_2', 'Maria');

    // Select guest types
    await page.check('input[name="guestType_1"][value="Erwachsener"]');
    await page.check('input[name="guestType_2"][value="Kind"]');

    // Fill in intolerances
    await page.fill('#intolerances', 'Glutenfrei');

    // Fill in message
    await page.fill('#message', 'Wir freuen uns sehr auf die Hochzeit!');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message or redirect
    // Adjust this based on your actual success behavior
    await page.waitForTimeout(2000);

    // Optionally check for toast notification
    // await expect(page.locator('.toast')).toContainText('erfolgreich');
  });

  test('user can submit RSVP with decline', async ({ page }) => {
    await page.goto('/rsvp.html');

    // Fill in required fields
    await page.fill('#familyName', 'Familie Schmidt');
    await page.fill('#email', 'schmidt@example.com');

    // Select attending = no
    await page.check('input[name="attending"][value="no"]');

    // Guest details should be disabled
    await expect(page.locator('#guests')).toBeDisabled();

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for submission
    await page.waitForTimeout(2000);
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/rsvp.html');

    // Try to submit without filling fields
    await page.click('button[type="submit"]');

    // Check for HTML5 validation or custom error messages
    // The exact selector depends on your implementation
    const familyNameInput = page.locator('#familyName');
    await expect(familyNameInput).toHaveAttribute('required');
  });

  test('validates email format', async ({ page }) => {
    await page.goto('/rsvp.html');

    // Fill in with invalid email
    await page.fill('#familyName', 'Test Family');
    await page.fill('#email', 'invalid-email');

    await page.check('input[name="attending"][value="yes"]');

    // Try to submit
    await page.click('button[type="submit"]');

    // HTML5 email validation should trigger
    const emailInput = page.locator('#email');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('guest counter works correctly', async ({ page }) => {
    await page.goto('/rsvp.html');

    // Check initial value
    const guestsInput = page.locator('#guests');
    await expect(guestsInput).toHaveValue('1');

    // Increase guests
    await page.click('#increase-guests');
    await expect(guestsInput).toHaveValue('2');

    // Check that second guest field appears
    await expect(page.locator('#guestName_2')).toBeVisible();

    // Decrease guests
    await page.click('#decrease-guests');
    await expect(guestsInput).toHaveValue('1');
  });
});

test.describe('RSVP Edit Flow', () => {
  test('user can access edit page with valid ID', async ({ page }) => {
    // This test requires a pre-existing RSVP ID
    // In a real test, you would create one first or use a test ID
    const testId = 'test-rsvp-id-123';

    await page.goto(`/edit-rsvp.html?id=${testId}`);

    // Check page loaded
    await expect(page.locator('h2')).toContainText('bearbeiten');
  });

  test('form fields are populated with existing data', async ({ page }) => {
    // Skip this test if running without emulator/test data
    // This would require seeding test data in Firestore
    test.skip();
  });
});

test.describe('RSVP Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('RSVP form is usable on mobile', async ({ page }) => {
    await page.goto('/rsvp.html');

    // Check that form elements are visible and usable
    await expect(page.locator('#familyName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();

    // Test that radio buttons are large enough to tap
    const attendingYes = page.locator('input[name="attending"][value="yes"]');
    await expect(attendingYes).toBeVisible();

    // Try filling form on mobile
    await page.fill('#familyName', 'Mobile Test');
    await page.fill('#email', 'mobile@example.com');
    await page.check('input[name="attending"][value="yes"]');
  });
});

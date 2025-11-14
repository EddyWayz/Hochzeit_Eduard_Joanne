/**
 * E2E Tests for Admin Panel
 */

const { test, expect } = require('@playwright/test');

test.describe('Admin Authentication', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });

  test('admin can login', async ({ page }) => {
    test.skip(); // Requires Firebase Auth setup

    await page.goto('/login');

    // Fill in credentials
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'test-password');

    // Submit login
    await page.click('button[type="submit"]');

    // Should redirect to admin panel
    await expect(page).toHaveURL(/admin/);
  });

  test('admin can logout', async ({ page }) => {
    test.skip(); // Requires authentication

    // await loginAsAdmin(page);

    await page.goto('/admin.html');

    // Click logout button
    await page.click('button:has-text("Abmelden")');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Admin - RSVP Management', () => {
  test('admin can view all RSVPs', async ({ page }) => {
    test.skip(); // Requires authentication

    await page.goto('/admin.html');

    // Check that RSVPs table is visible
    await expect(page.locator('table')).toBeVisible();

    // Check for RSVP entries
    // await expect(page.locator('tbody tr')).toHaveCount(greaterThan(0));
  });

  test('admin can filter RSVPs by status', async ({ page }) => {
    test.skip();

    await page.goto('/admin.html');

    // Click filter for accepting guests only
    await page.click('button:has-text("Zusagen")');

    // Check that only accepting guests are shown
    // Implementation depends on your UI
  });

  test('admin can search RSVPs', async ({ page }) => {
    test.skip();

    await page.goto('/admin.html');

    // Find search input
    await page.fill('input[type="search"]', 'Mustermann');

    // Check filtered results
    await page.waitForTimeout(500);
    // await expect(page.locator('tbody tr')).toHaveCount(1);
  });

  test('admin can edit RSVP', async ({ page }) => {
    test.skip();

    await page.goto('/admin.html');

    // Click edit button on first RSVP
    await page.click('button:has-text("Bearbeiten")').first();

    // Modify data
    await page.fill('#notes', 'Admin note added');

    // Save
    await page.click('button:has-text("Speichern")');

    // Check for success
    await page.waitForTimeout(1000);
  });

  test('admin can delete RSVP', async ({ page }) => {
    test.skip();

    await page.goto('/admin.html');

    // Click delete button
    const deleteButton = page.locator('button:has-text("Löschen")').first();
    await deleteButton.click();

    // Handle confirmation dialog
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('wirklich');
      dialog.accept();
    });

    // Wait for deletion
    await page.waitForTimeout(1000);
  });

  test('admin can export RSVP data', async ({ page }) => {
    test.skip();

    await page.goto('/admin.html');

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Exportieren")');

    const download = await downloadPromise;

    // Check filename
    expect(download.suggestedFilename()).toMatch(/rsvp.*\.(csv|xlsx)/i);
  });

  test('admin can see RSVP statistics', async ({ page }) => {
    test.skip();

    await page.goto('/admin.html');

    // Check that statistics are displayed
    await expect(page.locator('.stat:has-text("Zusagen")')).toBeVisible();
    await expect(page.locator('.stat:has-text("Absagen")')).toBeVisible();
    await expect(page.locator('.stat:has-text("Gäste gesamt")')).toBeVisible();
  });
});

test.describe('Admin - Contact Form Messages', () => {
  test('admin can view contact messages', async ({ page }) => {
    test.skip();

    await page.goto('/admin.html');

    // Navigate to contact messages
    await page.click('text=Kontakt');

    // Check that messages are displayed
    // await expect(page.locator('.message-item')).toBeVisible();
  });
});

test.describe('Admin - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('admin panel is usable on mobile', async ({ page }) => {
    test.skip();

    await page.goto('/admin.html');

    // Check that tables are scrollable or responsive
    await expect(page.locator('table')).toBeVisible();

    // Check that action buttons are accessible
    // await expect(page.locator('button').first()).toBeVisible();
  });
});

test.describe('Admin - Security', () => {
  test('admin panel requires authentication', async ({ page }) => {
    // Clear all cookies to ensure no session
    await page.context().clearCookies();

    await page.goto('/admin');

    // Should not see admin content
    await expect(page).not.toHaveURL(/admin\.html/);
  });

  test('session expires after timeout', async ({ page }) => {
    test.skip(); // Requires long-running test

    // await loginAsAdmin(page);

    // Wait for session to expire (5 days in production, shorter in test)
    // await page.waitForTimeout(SESSION_TIMEOUT);

    // Try to access admin page
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

// Helper function for authentication (to be implemented)
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.fill('#email', process.env.TEST_ADMIN_EMAIL || 'admin@example.com');
  await page.fill('#password', process.env.TEST_ADMIN_PASSWORD || 'test-password');
  await page.click('button[type="submit"]');
  await page.waitForURL(/admin/);
}

/**
 * Tests for Email Template Rendering
 */

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

describe('Email Templates', () => {
  const templateDir = path.join(__dirname, '../templates');
  const templates = [
    'rsvp_confirmation.html',
    'rsvp_update_confirmation.html',
    'rsvp_decline.html',
    'contact_confirmation.html',
    'reservation.html'
  ];

  // Test that all required templates exist
  templates.forEach(templateName => {
    test(`${templateName} should exist`, () => {
      const templatePath = path.join(templateDir, templateName);
      expect(fs.existsSync(templatePath)).toBe(true);
    });
  });

  // Test RSVP Confirmation template
  test('rsvp_confirmation.html should render correctly', () => {
    const templatePath = path.join(templateDir, 'rsvp_confirmation.html');
    const templateSrc = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSrc);

    const testData = {
      familyName: 'Mustermann',
      email: 'test@example.com',
      attending: 'Ja',
      guests: 3,
      intolerances: 'Keine',
      editUrl: 'https://example.com/edit-rsvp.html?id=123'
    };

    const html = template(testData);

    expect(html).toContain('Mustermann');
    expect(html).toBeTruthy();
    expect(html.length).toBeGreaterThan(100);
  });

  // Test RSVP Update Confirmation template
  test('rsvp_update_confirmation.html should render correctly', () => {
    const templatePath = path.join(templateDir, 'rsvp_update_confirmation.html');
    const templateSrc = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSrc);

    const testData = {
      familyName: 'Schmidt',
      email: 'schmidt@example.com',
      attending: 'Ja',
      guests: 2,
      intolerances: 'Glutenfrei',
      editUrl: 'https://example.com/edit-rsvp.html?id=456'
    };

    const html = template(testData);

    expect(html).toContain('Schmidt');
    expect(html).toBeTruthy();
  });

  // Test RSVP Decline template
  test('rsvp_decline.html should render correctly', () => {
    const templatePath = path.join(templateDir, 'rsvp_decline.html');
    const templateSrc = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSrc);

    const testData = {
      familyName: 'Weber',
      email: 'weber@example.com',
      editUrl: 'https://example.com/edit-rsvp.html?id=789'
    };

    const html = template(testData);

    expect(html).toContain('Weber');
    expect(html).toBeTruthy();
  });

  // Test Contact Confirmation template
  test('contact_confirmation.html should render correctly', () => {
    const templatePath = path.join(templateDir, 'contact_confirmation.html');
    const templateSrc = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSrc);

    const testData = {
      Name: 'Max Mustermann',
      email: 'max@example.com',
      Betreff: 'Test Betreff',
      Nachricht: 'Dies ist eine Testnachricht'
    };

    const html = template(testData);

    expect(html).toContain('Max Mustermann');
    expect(html).toBeTruthy();
  });

  // Test Gift Reservation template
  test('reservation.html should render correctly', () => {
    const templatePath = path.join(templateDir, 'reservation.html');
    const templateSrc = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSrc);

    const testData = {
      reserverName: 'Anna',
      giftName: 'Kaffeemaschine',
      giftImage: 'https://example.com/image.jpg',
      undoUrl: 'https://example.com/undo?id=123&token=abc'
    };

    const html = template(testData);

    expect(html).toContain('Anna');
    expect(html).toContain('Kaffeemaschine');
    expect(html).toBeTruthy();
  });

  // Test template compilation without errors
  test('all templates should compile without errors', () => {
    templates.forEach(templateName => {
      const templatePath = path.join(templateDir, templateName);
      const templateSrc = fs.readFileSync(templatePath, 'utf8');

      expect(() => {
        Handlebars.compile(templateSrc);
      }).not.toThrow();
    });
  });

  // Test that templates handle missing optional variables gracefully
  test('templates should handle missing optional variables', () => {
    const templatePath = path.join(templateDir, 'reservation.html');
    const templateSrc = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSrc);

    const minimalData = {
      reserverName: 'Anna',
      giftName: 'Kaffeemaschine',
      undoUrl: 'https://example.com/undo'
      // Missing giftImage
    };

    expect(() => {
      const html = template(minimalData);
      expect(html).toBeTruthy();
    }).not.toThrow();
  });
});

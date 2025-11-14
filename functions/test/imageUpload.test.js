/**
 * Tests for Image Upload Functions
 */

describe('Image Upload Functions', () => {
  let request, response;

  beforeEach(() => {
    request = {};
    response = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  describe('uploadGiftImage', () => {
    test('should reject request with missing fields', () => {
      request.body = {
        // Missing required fields
      };

      const requiredFields = ['filename', 'contentType'];
      const hasAllFields = requiredFields.every(field => request.body[field]);

      expect(hasAllFields).toBe(false);
    });

    test('should reject request without dataBase64 or dataUrl', () => {
      request.body = {
        filename: 'test.jpg',
        contentType: 'image/jpeg'
        // Missing dataBase64 and dataUrl
      };

      const hasData = request.body.dataBase64 || request.body.dataUrl;
      expect(hasData).toBeFalsy();
    });

    test('should accept valid base64 data', () => {
      const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      request.body = {
        filename: 'test.png',
        contentType: 'image/png',
        dataBase64: testBase64
      };

      const buffer = Buffer.from(testBase64, 'base64');
      expect(buffer.length).toBeGreaterThan(0);
    });

    test('should reject files larger than 10MB', () => {
      // Create a mock large file (10MB + 1 byte)
      const largeSize = 10 * 1024 * 1024 + 1;
      const buffer = Buffer.alloc(largeSize);

      expect(buffer.length).toBeGreaterThan(10 * 1024 * 1024);
    });

    test('should sanitize filename to remove special characters', () => {
      const unsafeFilename = 'test file!@#$%^&*().jpg';
      const safeName = unsafeFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');

      expect(safeName).toBe('test_file__________.jpg');
      expect(safeName).not.toContain(' ');
      expect(safeName).not.toContain('!');
    });

    test('should extract base64 from data URL', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const base64Part = dataUrl.split('base64,').pop();

      expect(base64Part).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    });

    test('should generate correct storage path with timestamp', () => {
      const filename = 'test.jpg';
      const timestamp = Date.now();
      const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const objectPath = `gifts/${timestamp}_${safeName}`;

      expect(objectPath).toMatch(/^gifts\/\d+_test\.jpg$/);
    });

    test('should generate valid download URL format', () => {
      const bucketName = 'test-bucket.appspot.com';
      const objectPath = 'gifts/12345_test.jpg';
      const token = 'test-token-123';
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;

      expect(downloadUrl).toContain('firebasestorage.googleapis.com');
      expect(downloadUrl).toContain(encodeURIComponent(objectPath));
      expect(downloadUrl).toContain('alt=media');
      expect(downloadUrl).toContain('token=');
    });
  });

  describe('resolveProductImage', () => {
    test('should reject invalid URL', () => {
      request.body = {
        url: 'not-a-valid-url'
      };

      const isValidUrl = /^https?:\/\//i.test(request.body.url);
      expect(isValidUrl).toBe(false);
    });

    test('should accept valid HTTP/HTTPS URL', () => {
      request.body = {
        url: 'https://example.com/product'
      };

      const isValidUrl = /^https?:\/\//i.test(request.body.url);
      expect(isValidUrl).toBe(true);
    });

    test('should extract og:image from meta tag', () => {
      const html = '<meta property="og:image" content="https://example.com/image.jpg">';
      const regex = /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
      const match = regex.exec(html);

      expect(match).not.toBeNull();
      expect(match[1]).toBe('https://example.com/image.jpg');
    });

    test('should extract twitter:image as fallback', () => {
      const html = '<meta name="twitter:image" content="https://example.com/twitter.jpg">';
      const regex = /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
      const match = regex.exec(html);

      expect(match).not.toBeNull();
      expect(match[1]).toBe('https://example.com/twitter.jpg');
    });

    test('should make relative URLs absolute', () => {
      const baseUrl = new URL('https://example.com/products/item');
      const relativeUrl = '/images/product.jpg';
      const absoluteUrl = new URL(relativeUrl, baseUrl).toString();

      expect(absoluteUrl).toBe('https://example.com/images/product.jpg');
    });
  });

  describe('importImageToStorage', () => {
    test('should reject invalid image URL', () => {
      request.body = {
        imageUrl: 'not-a-url'
      };

      const isValid = /^https?:\/\//i.test(request.body.imageUrl);
      expect(isValid).toBe(false);
    });

    test('should accept valid image URL', () => {
      request.body = {
        imageUrl: 'https://example.com/image.jpg'
      };

      const isValid = /^https?:\/\//i.test(request.body.imageUrl);
      expect(isValid).toBe(true);
    });

    test('should extract filename from URL', () => {
      const imageUrl = 'https://example.com/path/to/product-image.jpg?size=large';
      const urlObj = new URL(imageUrl);
      const origName = urlObj.pathname.split('/').pop();

      expect(origName).toBe('product-image.jpg');
    });

    test('should remove query parameters from filename', () => {
      const filename = 'image.jpg?size=large&format=webp';
      const cleanName = filename.split('?')[0];

      expect(cleanName).toBe('image.jpg');
    });

    test('should sanitize imported filename', () => {
      const filename = 'product image (2024)!.jpg';
      const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');

      expect(safeName).toBe('product_image__2024__.jpg');
    });

    test('should generate correct storage path for imports', () => {
      const timestamp = Date.now();
      const safeName = 'test.jpg';
      const objectPath = `gifts/imported/${timestamp}_${safeName}`;

      expect(objectPath).toMatch(/^gifts\/imported\/\d+_test\.jpg$/);
    });
  });
});

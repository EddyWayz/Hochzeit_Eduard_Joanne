/**
 * Tests for Utility Functions
 */

// Import the functions (they are exported at the end of utils.js)
const {
  normalizeStorageUrl,
  validateEmail,
  validateForm,
  debounce,
  throttle,
  escapeHtml,
  formatDate,
  checkRateLimit
} = require('../utils.js');

describe('Email Validation', () => {
  test('validates correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
  });

  test('rejects invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('invalid@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('invalid @example.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('Form Validation', () => {
  let form;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="test-form">
        <input type="text" name="name" value="" />
        <input type="email" name="email" value="" />
        <input type="text" name="message" value="" />
      </form>
    `;
    form = document.getElementById('test-form');
  });

  test('validates required fields', () => {
    const rules = {
      name: { required: true, message: 'Name ist erforderlich' }
    };

    const result = validateForm(form, rules);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('name');
  });

  test('validates email format', () => {
    form.querySelector('[name="email"]').value = 'invalid-email';

    const rules = {
      email: { required: true, email: true }
    };

    const result = validateForm(form, rules);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('validates minimum length', () => {
    form.querySelector('[name="message"]').value = 'Hi';

    const rules = {
      message: { min: 10, message: 'Nachricht zu kurz' }
    };

    const result = validateForm(form, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('10');
  });

  test('validates maximum length', () => {
    form.querySelector('[name="message"]').value = 'a'.repeat(1001);

    const rules = {
      message: { max: 1000 }
    };

    const result = validateForm(form, rules);

    expect(result.valid).toBe(false);
  });

  test('passes validation with valid data', () => {
    form.querySelector('[name="name"]').value = 'John Doe';
    form.querySelector('[name="email"]').value = 'john@example.com';
    form.querySelector('[name="message"]').value = 'This is a valid message';

    const rules = {
      name: { required: true },
      email: { required: true, email: true },
      message: { required: true, min: 10, max: 1000 }
    };

    const result = validateForm(form, rules);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Storage URL Normalization', () => {
  test('normalizes Firebase Storage URL with wrong bucket', () => {
    const wrongUrl = 'https://firebasestorage.googleapis.com/v0/b/wrong-bucket/o/path/to/file.jpg';
    const correctBucket = 'correct-bucket.appspot.com';

    const normalized = normalizeStorageUrl(wrongUrl, correctBucket);

    expect(normalized).toContain('correct-bucket.appspot.com');
  });

  test('returns URL unchanged if bucket is correct', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/correct-bucket/o/path/to/file.jpg';
    const correctBucket = 'correct-bucket';

    const normalized = normalizeStorageUrl(url, correctBucket);

    expect(normalized).toBe(url);
  });

  test('returns non-Firebase URLs unchanged', () => {
    const url = 'https://example.com/image.jpg';
    const correctBucket = 'any-bucket';

    const normalized = normalizeStorageUrl(url, correctBucket);

    expect(normalized).toBe(url);
  });

  test('handles null/undefined URLs', () => {
    expect(normalizeStorageUrl(null, 'bucket')).toBeNull();
    expect(normalizeStorageUrl(undefined, 'bucket')).toBeUndefined();
  });
});

describe('Debounce', () => {
  jest.useFakeTimers();

  test('delays function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('only executes once for multiple rapid calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  jest.useRealTimers();
});

describe('Throttle', () => {
  jest.useFakeTimers();

  test('allows immediate execution', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 300);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('prevents execution until limit expires', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 300);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(300);
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  jest.useRealTimers();
});

describe('HTML Escaping', () => {
  test('escapes HTML special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const escaped = escapeHtml(input);

    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&gt;');
  });

  test('escapes ampersands', () => {
    const input = 'Tom & Jerry';
    const escaped = escapeHtml(input);

    expect(escaped).toContain('&amp;');
  });

  test('escapes quotes', () => {
    const input = 'He said "Hello"';
    const escaped = escapeHtml(input);

    expect(escaped).toContain('&quot;');
  });
});

describe('Date Formatting', () => {
  test('formats Date object correctly', () => {
    const date = new Date('2025-06-15T14:30:00');
    const formatted = formatDate(date, 'de-DE');

    expect(formatted).toContain('2025');
    expect(formatted).toContain('06');
    expect(formatted).toContain('15');
  });

  test('handles null/undefined dates', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  test('handles Firestore Timestamp objects', () => {
    const mockTimestamp = {
      toDate: jest.fn(() => new Date('2025-06-15T14:30:00'))
    };

    const formatted = formatDate(mockTimestamp, 'de-DE');

    expect(mockTimestamp.toDate).toHaveBeenCalled();
    expect(formatted).toContain('2025');
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('allows initial attempts', () => {
    const result = checkRateLimit('test-key', 5, 60000);
    expect(result).toBe(true);
  });

  test('blocks after max attempts', () => {
    const key = 'test-key';
    const maxAttempts = 3;

    // Make max attempts
    for (let i = 0; i < maxAttempts; i++) {
      expect(checkRateLimit(key, maxAttempts, 60000)).toBe(true);
    }

    // Next attempt should be blocked
    expect(checkRateLimit(key, maxAttempts, 60000)).toBe(false);
  });

  test('resets after time window', () => {
    jest.useFakeTimers();
    const key = 'test-key';
    const maxAttempts = 2;
    const windowMs = 1000;

    checkRateLimit(key, maxAttempts, windowMs);
    checkRateLimit(key, maxAttempts, windowMs);

    // Should be blocked
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(false);

    // Advance time past window
    jest.advanceTimersByTime(windowMs + 1);

    // Should be allowed again
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(true);

    jest.useRealTimers();
  });
});

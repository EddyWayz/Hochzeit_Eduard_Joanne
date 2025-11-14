/**
 * Frontend Test Setup
 * Initializes the browser testing environment
 */

// Import testing library utilities
require('@testing-library/jest-dom');

// Mock Firebase
global.firebase = {
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn()
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      add: jest.fn(),
      where: jest.fn(() => ({
        get: jest.fn()
      }))
    }))
  })),
  storage: jest.fn(() => ({
    ref: jest.fn(() => ({
      put: jest.fn(),
      getDownloadURL: jest.fn()
    }))
  }))
};

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost',
  pathname: '/',
  search: '',
  hash: ''
};

// Mock console methods to reduce noise (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error // Keep error for debugging
};

// Set timeout
jest.setTimeout(5000);

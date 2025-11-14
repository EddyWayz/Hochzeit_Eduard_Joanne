/**
 * Jest Test Setup
 * Initializes the testing environment for Firebase Functions
 */

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.GCLOUD_PROJECT = 'hochzeiteduardjoanne';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Increase timeout for integration tests
jest.setTimeout(10000);

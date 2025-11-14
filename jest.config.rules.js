module.exports = {
  displayName: 'firestore-rules',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/firestore.rules.test.js'
  ],
  verbose: true,
  testTimeout: 30000, // Rules tests need more time
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

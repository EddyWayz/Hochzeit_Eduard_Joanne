module.exports = {
  displayName: 'frontend',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/assets/js'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'assets/js/**/*.js',
    '!assets/js/**/*.test.js',
    '!assets/js/**/__tests__/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/test-setup.frontend.js'],
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  testTimeout: 5000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  globals: {
    'CONFIG': {
      firebase: {
        apiKey: 'test-api-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'hochzeiteduardjoanne',
        storageBucket: 'test.appspot.com',
        messagingSenderId: '123456789',
        appId: 'test-app-id'
      }
    }
  }
};

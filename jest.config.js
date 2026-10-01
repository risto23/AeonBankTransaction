// Pin the timezone so date formatting assertions are deterministic
// regardless of where the tests run.
process.env.TZ = 'UTC';

module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/helpers.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.spec.tsx', '**/tests/**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@kavachid/sdk$': path.resolve(__dirname, '../kavach-sdk/src/index.ts'),
    '^(\\.\\.?\\/.+)\\.js$': '$1',
  },
};

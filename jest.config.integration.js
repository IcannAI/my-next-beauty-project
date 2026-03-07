// 專門用於 integration tests 的設定
// 執行：npx jest --config jest.config.integration.js tests/integration/ --runInBand

/** @type {import('jest').Config} */
const config = {
  // 使用 Next.js 自帶的 SWC transformer（不需額外安裝套件）
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest', {}],
  },

  // module aliases（對應 tsconfig.json 的 paths）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },

  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],

  // 逾時設定（DB 操作較慢）
  testTimeout: 30000,

  // 不轉換 node_modules（除了 ESM-only 套件）
  transformIgnorePatterns: [
    '/node_modules/(?!(@prisma|nanoid|uuid)/)',
  ],

  // 載入 .env
  setupFiles: ['dotenv/config'],

  // 每個 test suite 後清除 mock
  clearMocks: true,
  restoreMocks: true,
};

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: './tsconfig.test.json',
    }],
  },
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/tests/integration/**/*.test.ts'],
};
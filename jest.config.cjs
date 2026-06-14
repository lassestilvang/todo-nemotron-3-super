module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/test/react/**/*.test.tsx', '**/test/react-hooks/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          lib: ['ESNext', 'dom'],
          target: 'ES5',
          module: 'CommonJS',
          moduleResolution: 'node',
          allowImportingTsExtensions: true,
          noEmit: true,
          strict: true,
          skipLibCheck: true,
          isolatedModules: true,
          baseUrl: '.',
          types: ['jest', 'node', 'jsdom'],
        },
        babelrc: false,
        transpileOnly: true,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(sonner|canvas-confetti)/)',
  ],
};
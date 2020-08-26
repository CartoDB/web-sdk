module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['__tests__/.*/cases/','__tests__/stubs/*', 'dist'],
  rootDir: './',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFiles: [
    '<rootDir>/src/viz/__tests__/stubs/jest.stub.js'
  ]
};

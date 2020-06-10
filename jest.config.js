module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['__tests__/.*/cases/'],
  rootDir: './',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/lib/$1'
  }
};

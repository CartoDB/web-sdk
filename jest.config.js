module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['__tests__/.*/cases/', 'dist'],
  rootDir: './',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/lib/$1'
  }
};

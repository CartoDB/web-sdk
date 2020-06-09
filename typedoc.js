/**
 * Configuration for reference, auto-generated from .ts files and their tsdoc comments
 */
module.exports = {
  // excludeNotDocumented: true,
  exclude: ['**/node_modules/**/*.ts', '**/__tests__/**/*', '**/*.types.ts'],
  excludeExternals: true,
  excludeNotExported: true,
  excludePrivate: true,
  excludeProtected: true,
  ignoreCompilerErrors: false,
  inputFiles: './src/index.ts',
  listInvalidSymbolLinks: true,
  mode: 'file',
  module: 'es2015',
  name: '@carto/web-sdk',
  out: './docs/api',
  plugin: 'none',
  target: 'es6',
  theme: 'default',
  tsconfig: './tsconfig.json'
};

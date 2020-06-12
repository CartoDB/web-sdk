/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const mode = process.env.NODE_ENV || 'development';
const path = require('path');

// This is main configuration object.
// Here you write different options and tell Webpack what to do
module.exports = {
  // Default mode for Webpack is production.
  // Depending on mode Webpack will apply different things
  // on final bundle.
  mode,

  devtool: 'source-map',

  entry: './src/lib/index.ts',

  output: {
    path: path.resolve(__dirname, 'dist/umd'),
    filename: 'index.min.js',
    library: 'carto',
    libraryTarget: 'umd'
  },

  externals: {
    '@luma.gl/core': {
      amd: '@luma.gl/core',
      root: 'luma',
      commonjs: '@luma.gl/core',
      commonjs2: '@luma.gl/core'
    },
    '@deck.gl/core': {
      amd: '@deck.gl/core',
      root: 'deck',
      commonjs: '@deck.gl/core',
      commonjs2: '@deck.gl/core'
    }
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },

      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      },

      {
        test: /\.js$/,
        use: 'source-map-loader',
        enforce: 'pre'
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.mjs', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src/lib/')
    }
  },

  plugins: [
    // Uncomment for bundle analysis
    // new BundleAnalyzerPlugin()
  ]
};

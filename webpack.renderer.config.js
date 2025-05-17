const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: ['./src/renderer/polyfills.js', './src/renderer/index.tsx'],
  target: 'electron-renderer',
  output: {
    path: path.join(__dirname, 'dist/renderer'),
    filename: 'index.js'
  },
  node: {
    __dirname: false,
    __filename: false
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    // Add fallbacks for Node.js core modules
    fallback: {
      path: false,
      fs: false,
      crypto: false,
      stream: false,
      buffer: false,
      util: false,
      assert: false,
      http: false,
      https: false,
      os: false,
      url: false,
      process: false,
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // Skip type checking to speed up compilation
            transpileOnly: true
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]',
                auto: true
              }
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html'
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/debug.html',
      filename: 'debug.html'
    }),
    // Provide global variables required by some packages
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    // Define Node.js environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.type': JSON.stringify('renderer')
    })
  ],
  // Enable hot module replacement for CSS changes
  devServer: {
    hot: true,
    contentBase: path.join(__dirname, 'dist/renderer')
  },
  // Configure watch options for faster updates
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000,
    ignored: /node_modules/
  }
};
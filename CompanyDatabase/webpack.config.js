import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { root } from '#config';



export default (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: './client/src/index.js', // Entry point for the app
    output: {
      path: path.resolve(root, 'dist'),
      filename: 'src/bundle.js', // Output bundle for JS
      clean: true, // Clean the output directory before emit
    },
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'source-map', // Include source maps for dev mode
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader', // Transpile ES6+ to compatible JS
          },
        },
        {
          test: /\.css$/, // For CSS files
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader', // Load CSS files
          ],
        },
      ],
    },
    optimization: {
      minimize: isProd, // Minify for production mode
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false, // Remove comments in prod mode
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(), // Minify CSS files in production
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'style/cssbundle.css', // Output CSS bundle
      }),
      new HtmlWebpackPlugin({
        template: './client/index.html', // HTML template
        filename: 'index.html', // Output HTML file in /dist
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx'], // Resolve JavaScript and JSX files
    },
  };
};

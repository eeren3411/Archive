import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { root } from '#config';

const clientPath = path.join(root, 'client');
const distPath = path.join(root, 'dist');


export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
      entry: path.join(clientPath, 'index.js'), // Entry point
      output: {
          path: distPath,
          filename: 'src/jsbundle-[contenthash].js',
      },
      mode: isProduction ? 'production' : 'development',
      devtool: isProduction ? false : 'source-map', // Enable source-maps in dev mode
      module: {
          rules: [
              {
                  test: /\.(js|jsx)$/,
                  exclude: /node_modules/,
                  use: {
                      loader: 'babel-loader',
                      options: {
                          presets: ['@babel/preset-env', '@babel/preset-react'],
                      },
                  },
              },
              {
                  test: /\.css$/,
                  exclude: /colors/,
                  use: [
                      MiniCssExtractPlugin.loader, // Extract CSS into separate files (use style-loader to load styles into javascript)
                      'css-loader', // Translates CSS into CommonJS
                  ],
              }
          ],
      },
      plugins: [
          new CleanWebpackPlugin(), // Clean the dist folder before building
          new HtmlWebpackPlugin({ // Use html template.
              template: path.join(clientPath, 'index.html'),
              filename: 'index.html'
          }),
          new MiniCssExtractPlugin({ // Minicss settings
              filename: 'style/cssbundle-[contenthash].css',
          }),
          new CopyPlugin({ // Do not minify the colors
            patterns: [
              {from: path.join(clientPath, "colors"), to:path.join(distPath, "colors")}
            ]
          })
      ],
      optimization: {
          minimize: isProduction, // Minimize in production mode
          minimizer: [
              new TerserPlugin(), // Javascript minimizer
              new CssMinimizerPlugin(), // CSS minimizer
          ]
      }
  };
};

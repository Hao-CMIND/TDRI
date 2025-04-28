import path from 'path'
import { readFile } from 'fs/promises'
import common from './webpack.common.mjs'
import PugLintPlugin from 'puglint-webpack-plugin'
import SassLintPlugin from 'sass-lint-webpack'
import ESLintPlugin from 'eslint-webpack-plugin'
import { merge } from 'webpack-merge'
import { htmlPlugins } from './import.mjs'
import pugrc from './.pug-lintrc.mjs'

const EXT = process.env.EXTENSION
const devConf = merge(common, {
  module: {
    rules: [
      {
        test: /\.s?[ac]ss$/i,
        use: [
          {
            loader: 'style-loader',
            options: {
              insert: function insertBeforeAt(element) {
                const parent = document.querySelector('head')
                const target = document.querySelector('[rel="icon"]')

                const lastInsertedElement = window._lastElementInsertedByStyleLoader
                if (!lastInsertedElement) {
                  target.insertAdjacentElement('afterend', element)
                } else if (lastInsertedElement.nextSibling) {
                  lastInsertedElement.insertAdjacentElement('afterend', element)
                } else {
                  parent.appendChild(element)
                }
                window._lastElementInsertedByStyleLoader = element
                // setTimeout(() => {
                //   const { id } = element.textContent.match(/\/\* filename:(?<id>.+) \*\//m).groups
                //   element.id = id
                // }, 500);
              }
            }
          },
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        type: 'asset/resource',
        include: [path.resolve('src', 'img')],
        exclude: /spriteSVG|inlineSVG|embedSVG/,
        generator: { filename: 'img/[name][ext]' }
      }
    ]
  },
  plugins: htmlPlugins(EXT),
  optimization: {
    runtimeChunk: 'multiple'
  },
  devServer: {
    // watchFiles: {
    //   paths: path.resolve('src', 'demo.pug'),
    //   options: {
    //     usePolling: true
    //   }
    // },
    // headers: {
    //   'Cross-Origin-Embedder-Policy': 'require-corp',
    //   'Cross-Origin-Opener-Policy': 'same-origin',
    //   'Cross-Origin-Resource-Policy': 'same-origin',
    // },
    // https: {
    //   key: await readFile('./mkcert/key.pem'),
    //   cert: await readFile('./mkcert/cert.pem'),
    //   ca: await readFile('./mkcert/rootCA.pem'),
    // },
    historyApiFallback: true,
    open: ['demo.html'],
    compress: true,
    hot: true,
    port: 80,
    client: {
      overlay: false
    }
  },
  devtool: 'eval-cheap-module-source-map',
  mode: 'development'
})
devConf.plugins.push(
  new PugLintPlugin({
    context: path.resolve('src'),
    files: '**/*.pug',
    config: { emitError: true, ...pugrc }
  }),
  new SassLintPlugin(),
  new ESLintPlugin({
    exclude: '/node_modules/',
    fix: true,
    failOnWarning: true
  })
)
export default devConf

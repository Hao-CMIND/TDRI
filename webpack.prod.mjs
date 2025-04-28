import path from 'path'
import common from './webpack.common.mjs'
import HtmlMinimizerPlugin from 'html-minimizer-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import autoprefixer from 'autoprefixer'
import TerserPlugin from 'terser-webpack-plugin'
import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin'
import { merge } from 'webpack-merge'
import { PurgeCSSPlugin } from 'purgecss-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import { htmlPlugins } from './import.mjs'
const EXT = process.env.EXTENSION
const minimizer = []
const rules = [
  {
    test: /\.s?[ac]ss$/i,
    exclude: [path.resolve('src', 'sass','demo.scss')],
    use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
  },
  {
    test: /\.(jpe?g|png|gif)$/i,
    type: 'asset',
    include: [path.resolve('src', 'img')],
    exclude: /nobase64/,
    parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
    generator: { filename: 'img/[name][ext]' }
  },
  {
    test: /\.(jpe?g|png|gif)$/i,
    type: 'asset/resource',
    include: [path.resolve('src', 'img', 'nobase64')],
    generator: { filename: 'img/[name][ext]' }
  },
  {
    test: /\.s?[ac]ss$/i,
    include: [path.resolve('src', 'sass','demo.scss')],
    use: ['style-loader', 'css-loader', 'sass-loader']
  },
]
if (+process.env.OPTIMIZE) {
  // prettier-ignore
  rules[0].use.splice(2, 0,
    { loader: 'postcss-loader', options: { postcssOptions: { plugins: [autoprefixer] } } },
    'group-css-media-queries-loader'
  )
  if(+process.env.IMG) {
    rules.push({
      test: /\.(jpe?g|png|gif|svg)$/i,
      include: [path.resolve('src', 'img')],
      exclude: /bar|pie|benifits|print/,
      use: [
        {
          loader: ImageMinimizerPlugin.loader,
          options: {
            minimizer: {
              implementation: ImageMinimizerPlugin.imageminMinify,
              options: {
                // prettier-ignore
                plugins: ['imagemin-gifsicle', 'imagemin-mozjpeg', 'imagemin-pngquant',
                  ['imagemin-svgo', {
                      floatPrecision: 1,
                      plugins: ['preset-default', 'removeDimensions',
                        {
                          name: 'removeAttrs',
                          params: { attrs: ['stroke-miterlimit', 'id', 'x', 'y', 'xmlns:xlink', 'xml:space'] }
                        }
                      ]
                    }
                  ]
                ]
              }
            }
          }
        }
      ]
    })
  }
  minimizer.push(
    new TerserPlugin({
      exclude: /membership|interestedPartyList|dataAnalysis|dashboard/,
      extractComments: false,
      parallel: true,
      terserOptions: { mangle: true, module: false, format: { comments: false } }
    }),
    /* new PurgeCSSPlugin({
      paths: glob.sync(path.resolve('src', '**', '*'), { nodir: true }),
      only: ['demo', 'style']
    }), */
    new CssMinimizerPlugin({
      parallel: true,
      minimizerOptions: { preset: ['default', { discardComments: { removeAll: true } }] }
    }),
    new HtmlMinimizerPlugin({
      test: /\.(cs)?html$/i,
      minimizerOptions: {
        caseSensitive: true,
        collapseBooleanAttributes: true,
        collapseWhitespace: process.env.EXTENSION !== '.cshtml',
        conservativeCollapse: false,
        keepClosingSlash: false,
        minifyCSS: false,
        minifyJS: false,
        minifyURLs: text => text.replace(/https?\:/, ''),
        noNewlinesBeforeTagClose: true,
        removeAttributeQuotes: true,
        removeComments: process.env.EXTENSION !== '.cshtml',
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        removeTagWhitespace: true,
        sortAttributes: true,
        sortClassName: false
      },
      async minify(data, minimizerOptions) {
        const [[filename, input]] = Object.entries(data)
        const htmlMinifier = await import('html-minifier-terser')
        return {
          code: await htmlMinifier.minify(input, minimizerOptions),
          warnings: [],
          errors: []
        }
      }
    })
  )
}

const prodConf = merge(common, {
  output: {
    path: path.resolve('dist'),
    publicPath: './'
  },
  module: {
    rules
  },
  plugins: htmlPlugins(EXT),
  optimization: {
    minimize: true,
    usedExports: true,
    mangleExports: true,
    minimizer
  },
  // cache: {
  //   type: 'filesystem',
  //   cacheDirectory: path.resolve('.temp_cache')
  //   // compression: 'gzip'
  // },
  mode: 'production'
})
prodConf.plugins.push(
  new CleanWebpackPlugin(),
  new MiniCssExtractPlugin({
    filename:`css/style.css?timestamp=`+String(Date.now()).slice(6)
  }),
  new CopyPlugin({
    patterns: [{
      from: path.resolve('src','img', 'og.jpg'),
      to: path.resolve('dist','img', 'og.jpg')
    }]
  })
)
export default prodConf

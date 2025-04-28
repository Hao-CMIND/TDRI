import path from 'path'
import webpack from 'webpack'
import SVGSpritePlugin from 'svg-sprite-loader/plugin.js'
import Server from 'webpack-dev-server'
import { cachePlugins, langs } from './import.mjs'
const { DefinePlugin } = webpack
export const primary = 'transparent'
const project = 'tdri'
const staticDomain = 'https://whatlife.no-ip.org'
const EXT = process.env.EXTENSION
const common = {
  context: path.resolve('src'),
  entry: {
    script: '/js/script.js'/* ,
    dataVisualize: '/js/dataVisualize.js'  */},
  output: {
    path: path.resolve('dist'),
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].js' // name保留 /* webpackChunkName:'name' */
  },
  module: {
    noParse: /jquery/,
    rules: [
      {
        test: /\.mp4$/i,
        type: 'asset/resource',
        include: [path.resolve('src', 'video')],
        generator: {
          publicPath: './video/',
          filename: '[name][ext]',
          outputPath: 'video/'
        }
      },
      {
        test: /\.js$/i,
        use: {
          loader: 'babel-loader',
          options: { cacheDirectory: true }
        },
        exclude: /node_modules/,
        include: [path.resolve('src', 'js')]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/i,
        type: 'asset/resource',
        include: [path.resolve('src', 'font')],
        generator: {
          publicPath: '../font/',
          filename: '[name][ext]',
          outputPath: 'font/'
        }
      },
      {
        test: /\.pug$/i,
        include: /src/,
        use: {
          loader: 'pug-loader',
          options: {
            doctype: 'html',
            pretty: process.env.NODE_ENV === 'development' || EXT === '.cshtml'
          }
        }
      },
      {
        test: /\.svg$/,
        include: /spriteSVG/,
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              extract: true,
              publicPath: './img/',
              symbolId: '[name]'
            }
          }
        ]
      },
      {
        test: /\.svg$/,
        include: /inlineSVG|embedSVG/,

        use: ['svg-url-loader'],
        type: 'javascript/auto'
      }
    ]
  },
  plugins: [
    new DefinePlugin({
      env: JSON.stringify(process.env.NODE_ENV),
      ext: JSON.stringify(EXT),
      langs: JSON.stringify(langs),
      primary: JSON.stringify(primary),
      project: JSON.stringify(project),
      baseDir: JSON.stringify('/test/'+project),
      projectName: JSON.stringify('設計研究院工作平台'),
      staticDomain: JSON.stringify(staticDomain),
      testingDomain: JSON.stringify('https://tdri.cmind.com.tw/'),
      isProd: `${process.env.NODE_ENV === 'production'}`,
      isDev: `${process.env.NODE_ENV === 'development'}`,
      staticURL: JSON.stringify(staticDomain + '/test/' + project),
      externalIP: JSON.stringify('http://' + Server.internalIPSync('v4'))
    }),
    new SVGSpritePlugin({
      plainSprite: true,
      spriteAttrs: {
        'xmlns:xlink': null,
        'stroke-': null
      }
    })
  ],
  stats: 'minimal',
  optimization: {
    splitChunks: {
      chunks: 'initial',
      minChunks: 1,
      automaticNameDelimiter: '~',
      cacheGroups: {
        ...cachePlugins({
          axios: 'axios',
          bootstrap: 'bootstrap|bs5',
          popper: '@popperjs'
        }),
        d3Vendors: {
          name: 'd3',
          test: /d3-.+.m?js$/,
        },
        chartApi: {
          name: 'chart',
          test: /chart\/*.js/,
        },
        // staggerAnimateFn: {
        //   name: 'staggerAnimate',
        //   test:  /staggerAnimate\.m?js$/,
        //   priority: -8
        //   // test(module, chunks, cacheGroupKey){
        //   //   console.log(module)
        //   //   console.log(chunks)
        //   //   console.log(cacheGroupKey)
        //   //   return /staggerAnimate\.m?js$/
        //   // }
        // },
        vendors: {
          name: 'vendors',
          test: /\.m?js$/,
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  }
}

if(!Boolean(+process.env.OPTIMIZE)){
  common.entry.demo = '/js/demo.js'
}
export default common

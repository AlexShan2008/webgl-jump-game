const path = require('path');
const cleanWebpackPlugin = require('clean-webpack-plugin'); //删除上次打包的文件；
const htmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// Create multiple instances

module.exports = {
  entry: {
    index: './src/index.js'
  },
  output: {
    filename: '[name].[hash:8].js', //打包后会生成index.js和login.js文件 8位hash值
    path: path.resolve(__dirname, 'dist') //绝对路径
  },
  //对模块的处理
  module: {
    rules: [
      {
        // html 中引用image
        test: /\.html$/,
        use: 'html-withimg-loader'
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: ['css-loader', 'postcss-loader'],
          publicPath: '../'
        })
      },
      {
        test: /\.(jsx|js)$/,
        use: 'babel-loader',
        include: path.resolve(__dirname, "src"),// 只转化src目录下的js
        exclude: /node_modules/  // 排除掉node_modules，优化打包速度
      },
      {
        test: /\.(png|svg|jpe?g|gif|bmp|webp)$/i,
        use: [
          {
            // 图片
            loader: 'url-loader',
            options: {
              limit: 10000,    // 小于9k的图片自动转成base64格式，并且不会存在实体图片
              outputPath: 'static/img/'   // 图片打包后存放的目录
            }
          }
        ]
      }
    ]
  },
  //对应的插件
  plugins: [
    new cleanWebpackPlugin(['dist']),
    new ExtractTextPlugin('css/style.css'),
    new htmlWebpackPlugin({
      filename: 'index.html',
      template: './public/index.html',
      chunks: ['index'],
      hash: true, //mdn文件名带md5蹉
      minify: {
        collapseWhitespace: true, //去空格
        removeAttributeQuotes: true //去双引号
      }
    })
  ]
}

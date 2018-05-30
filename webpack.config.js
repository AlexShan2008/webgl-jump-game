const path = require('path');
const cleanWebpackPlugin = require('clean-webpack-plugin'); //删除上次打包的文件；
const htmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// Create multiple instances

module.exports = {
  // 多入口文件的两种写法; 1.写成数组的方式，输入多个，entry:
  // ['./src/index.js','./src/login.js']，输出一个文件bundle.js 2.对象的方式：输入多个，输出多个
  entry: {
    index: './src/index.js'
  },
  output: {
    // 1. filename: 'bundle.[hash:8].js',//8位hash值，指定输出文件名
    // 2. [name]就可以将出口文件名和入口文件名一一对应
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
  resolve: {
    // 别名
    // alias: {
    //   $: './src/jquery.js'
    // },
    // 省略后缀
    extensions: ['.js', '.json', '.css']
  },
  //对应的插件
  plugins: [
    new cleanWebpackPlugin(['dist']),
    new webpack.HotModuleReplacementPlugin(),//模块打包热更新
    // 拆分后会把css文件放到dist目录下的css/style.css
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
  ],
  //开发服务器的配置
  devServer: {
    contentBase: './dist',
    host: 'localhost',
    port: 3000,
    open: true,
    hot: true, //需要配置一个插件webpack.HotModuleReplacementPlugin
  }
}

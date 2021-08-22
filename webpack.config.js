const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(glb|gltf)$/,
        exclude: /node_modules/,
        use:
        [
          {
            loader: 'file-loader',
            options:
            {
              outputPath: 'assets/'
            }
          }
        ]
    },
    ]
  },
  watchOptions: {
    ignored: /node_modules/
  }
}
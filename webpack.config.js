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
    extensions: ['.tsx', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/i,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.(glb|gltf)$/i,
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
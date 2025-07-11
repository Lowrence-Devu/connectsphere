module.exports = {
  webpack: {
    resolve: {
      fallback: {
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        util: require.resolve('util')
      }
    }
  }
}; 
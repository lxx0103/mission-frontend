module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  configureWebpack: config => {
      config.externals = {
          'better-sqlite3': 'commonjs better-sqlite3'
      };
  },
  pluginOptions: {
    electronBuilder: {
      preload: 'src/preload.js',
      externals: [ 'better-sqlite3' ],
    }
  }
}

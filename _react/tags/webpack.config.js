var getConfig = require('hjs-webpack')

module.exports = getConfig({
  in: 'src/tag.js',
  out: 'public',
  clearBeforeBuild: true,
  html: false
});

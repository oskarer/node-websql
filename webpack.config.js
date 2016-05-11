// var nodeExternals = require('webpack-node-externals');
module.exports = {
  // target: 'node', // in order to ignore built-in modules like path, fs, etc.
  // externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  entry: "./lib/index.js",
  output: {
      path: __dirname + "/dist",
      filename: "bundle.js"
  }
};

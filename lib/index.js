'use strict';

var SQLiteDatabase = require('./sqljs/SQLiteDatabase');
// var SQLiteDatabase = require('./sqlite/SQLiteDatabase');
var customOpenDatabase = require('./custom');

module.exports = customOpenDatabase(SQLiteDatabase);

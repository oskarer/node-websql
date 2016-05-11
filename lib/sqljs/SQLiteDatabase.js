'use strict';

var sqlJs = require('./sql-debug.js');
var SQLiteResult = require('./SQLiteResult');

var READ_ONLY_ERROR = new Error(
  'could not prepare statement (23 not authorized)');

function SQLiteDatabase(name) {
  this._db = new sqlJs.Database();
}

function run(db, sql, args, cb) {
  // console.log('EXECUTING', sql, args)
  var results = [];
  try {
    results = db.exec(sql, args);
  } catch (error) {
    // console.log('ERROR', error, error.message);
    return cb(new SQLiteResult(error));
  }
  var rows = [];
  results.forEach(function(result) {
    // console.log(JSON.stringify(result))
    var values = result.values;
    var columns = result.columns;

    var partialRows = values.map(function(value) {
      var row = {};
      // console.log('VALUE', value)
      value.forEach(function(columnValue, index) {
        row[columns[index]] = columnValue;
        // console.log('NEW ROW', row);
      });
      return row;
    });
    rows = rows.concat(partialRows);
  });
  // console.log('ROWS CONSTRUCTED', rows)
  var insertId = void 0;
  var rowsAffected = db.getRowsModified();
  var resultSet = new SQLiteResult(null, insertId, rowsAffected, rows);
  cb(resultSet);
}

function runNonSelect(db, sql, args, cb) {
  db.run(sql, args, function (err) {
    if (err) {
      return cb(new SQLiteResult(err));
    }
    /* jshint validthis:true */
    var executionResult = this;
    var insertId = executionResult.lastID;
    var rowsAffected = executionResult.changes;
    var rows = [];
    var resultSet = new SQLiteResult(null, insertId, rowsAffected, rows);
    cb(resultSet);
  });
}

SQLiteDatabase.prototype.exec = function exec(queries, readOnly, callback) {
  // console.log(queries)
  var db = this._db;
  var len = queries.length;
  var results = new Array(len);

  var i = 0;

  function checkDone() {
    if (++i === len) {
      callback(null, results);
    } else {
      doNext();
    }
  }

  function onQueryComplete(i) {
    return function (res) {
      results[i] = res;
      checkDone();
    };
  }

  function doNext() {
    var query = queries[i];
    var sql = query.sql;
    var args = query.args;

    // TODO: It seems like the node-sqlite3 API either allows:
    // 1) all(), which returns results but not rowsAffected or lastID
    // 2) run(), which doesn't return results, but returns rowsAffected and lastID
    // So we try to sniff whether it's a SELECT query or not.
    // This is inherently error-prone, although it will probably work in the 99%
    // case.
    var isSelect = /^\s*SELECT\b/i.test(sql);

    if (readOnly && !isSelect) {
      onQueryComplete(i)(new SQLiteResult(READ_ONLY_ERROR));
    } else {
      run(db, sql, args, onQueryComplete(i));
    }
  }

  doNext();
};

module.exports = SQLiteDatabase;

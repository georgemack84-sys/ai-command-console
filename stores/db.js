const stateDatabase = require("../services/stateDatabase");

function withConnection(work) {
  return stateDatabase.withDatabase((conn) => work(conn));
}

const db = {
  prepare(sql) {
    return withConnection((conn) => conn.prepare(sql));
  },

  exec(sql) {
    return withConnection((conn) => conn.exec(sql));
  },

  pragma(statement, options) {
    return withConnection((conn) => conn.pragma(statement, options));
  },

  transaction(work) {
    return withConnection((conn) => conn.transaction(() => work(conn)));
  },

  getDatabasePath: stateDatabase.getDatabasePath,
  readDatabaseNow: stateDatabase.readDatabaseNow,
  withDatabase: stateDatabase.withDatabase,
  runInTransaction: stateDatabase.runInTransaction,
  closeDatabase: stateDatabase.closeDatabase,
};

module.exports = db;

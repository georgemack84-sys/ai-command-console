const TRANSACTION_TIMEOUT_MS = 5000;

function runImmediateTransaction(db, work) {
  if (db.inTransaction) {
    return work(db);
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      if (db.inTransaction) {
        db.exec("ROLLBACK");
      }
    } catch {}
    throw error;
  }
}

function withTransaction(callback) {
  const start = Date.now();
  const { withDatabase } = require("./stateDatabase");

  return withDatabase((db) =>
    runImmediateTransaction(db, (activeDb) => {
      if (Date.now() - start > TRANSACTION_TIMEOUT_MS) {
        throw new Error("TRANSACTION_TIMEOUT");
      }
      return callback(activeDb);
    })
  );
}

module.exports = {
  TRANSACTION_TIMEOUT_MS,
  runImmediateTransaction,
  withTransaction,
};

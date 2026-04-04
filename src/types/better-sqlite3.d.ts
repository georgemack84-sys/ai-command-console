declare module "better-sqlite3" {
  class Statement {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  class Database {
    constructor(path: string);
    pragma(statement: string): unknown;
    exec(sql: string): void;
    prepare(sql: string): Statement;
    close(): void;
  }

  namespace Database {}

  export = Database;
}

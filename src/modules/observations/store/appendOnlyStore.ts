export interface AppendOnlyStore<T> {
  append(record: T): { status: "APPENDED"; record: T };
  list(): T[];
}

export function createAppendOnlyStore<T>(initialRecords: T[] = []): AppendOnlyStore<T> {
  const records = initialRecords.map((record) => structuredClone(record));

  return {
    append(record) {
      const stored = structuredClone(record);
      records.push(stored);
      return { status: "APPENDED", record: structuredClone(stored) };
    },
    list() {
      return records.map((record) => structuredClone(record));
    },
  };
}

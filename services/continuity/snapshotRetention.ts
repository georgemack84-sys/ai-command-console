import fs from "node:fs";
import path from "node:path";

export function applySnapshotRetention({
  root,
  retain = 5,
}: {
  root: string;
  retain?: number;
}) {
  if (!fs.existsSync(root)) {
    return;
  }
  const entries = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      fullPath: path.join(root, entry.name),
      mtimeMs: fs.statSync(path.join(root, entry.name)).mtimeMs,
    }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  for (const entry of entries.slice(Math.max(0, retain))) {
    fs.rmSync(entry.fullPath, { recursive: true, force: true });
  }
}

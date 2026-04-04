import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { closeDatabase } = require("../../services/stateDatabase");

export const DATA_DIR = path.join(process.cwd(), "data", "agents");

export function snapshotFiles(files) {
  return Object.fromEntries(
    files.map((file) => {
      const fullPath = path.join(DATA_DIR, file);
      if (!fs.existsSync(fullPath)) {
        return [file, { kind: "missing" }];
      }

      if (path.extname(fullPath) === ".sqlite") {
        return [file, { kind: "binary", content: fs.readFileSync(fullPath) }];
      }

      return [file, { kind: "text", content: fs.readFileSync(fullPath, "utf8") }];
    })
  );
}

export function restoreFiles(snapshot) {
  closeDatabase();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const [file, entry] of Object.entries(snapshot)) {
    const fullPath = path.join(DATA_DIR, file);
    if (!entry || entry.kind === "missing") {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      continue;
    }

    if (entry.kind === "binary") {
      fs.writeFileSync(fullPath, entry.content);
      continue;
    }

    fs.writeFileSync(fullPath, entry.content, "utf8");
  }
}

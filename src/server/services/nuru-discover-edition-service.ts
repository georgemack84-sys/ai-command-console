import type { NuruDiscoverCatalogItem } from "@/src/server/services/nuru-discover-catalog-service";
import { listNuruDiscoverCatalog } from "@/src/server/services/nuru-discover-catalog-service";
import { listNuruDiscoverPaths, type NuruDiscoverPath } from "@/src/server/services/nuru-discover-path-service";

export type NuruDiscoverEdition = {
  date: string;
  editionVersion: "discover-edition-deterministic-v1";
  featured: NuruDiscoverCatalogItem | null;
  supporting: NuruDiscoverCatalogItem[];
  paths: NuruDiscoverPath[];
  rationale: string;
};

function dayOffset(date: string, size: number) {
  if (size === 0) return 0;
  return [...date].reduce((total, character) => total + character.charCodeAt(0), 0) % size;
}

/** Creates a stable daily arrangement from catalog and approved-path inputs. */
export function buildNuruDiscoverEdition(catalog: NuruDiscoverCatalogItem[], paths: NuruDiscoverPath[], date = new Date().toISOString().slice(0, 10)): NuruDiscoverEdition {
  const ordered = [...catalog].sort((left, right) => right.confidence - left.confidence || left.title.localeCompare(right.title));
  const offset = dayOffset(date, ordered.length);
  const rotated = ordered.length ? [...ordered.slice(offset), ...ordered.slice(0, offset)] : [];
  const featured = rotated[0] ?? null;
  const supporting = rotated.slice(1, 4);
  const pathDescription = paths.length + " human-approved exploration path" + (paths.length === 1 ? " is" : "s are") + " available.";
  return {
    date,
    editionVersion: "discover-edition-deterministic-v1",
    featured,
    supporting,
    paths,
    rationale: featured
      ? "The featured record is selected from the human-admitted catalog using a stable daily ordering: documented confidence first, then a date-based rotation. " + pathDescription
      : "No edition is published until a human governor admits durable knowledge to the Discover catalog.",
  };
}

export async function getNuruDiscoverEdition() {
  const [catalog, paths] = await Promise.all([listNuruDiscoverCatalog(100), listNuruDiscoverPaths(3)]);
  return buildNuruDiscoverEdition(catalog, paths);
}

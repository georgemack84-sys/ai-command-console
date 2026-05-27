type PaletteMeta = "recommendation" | "macro" | "session" | "command";

export type PaletteItem = {
  key: string;
  label: string;
  value: string;
  meta: PaletteMeta;
};

export type PaletteGroup = {
  meta: PaletteMeta;
  title: string;
  items: PaletteItem[];
};

export type TerminalFilterSnapshot = {
  queue: string;
  review: string;
  alert: string;
  schedule: string;
};

export type SavedTerminalView = {
  id: string;
  name: string;
  filters: TerminalFilterSnapshot;
  createdAt: string;
};

const GROUP_TITLES: Record<PaletteMeta, string> = {
  recommendation: "Recommended",
  macro: "Macros",
  session: "Sessions",
  command: "Commands",
};

function fuzzyScore(haystack: string, needle: string) {
  if (!needle) {
    return 1;
  }

  if (haystack === needle) {
    return 2000;
  }

  if (haystack.startsWith(needle)) {
    return 1500 - (haystack.length - needle.length);
  }

  const includesIndex = haystack.indexOf(needle);
  if (includesIndex >= 0) {
    return 1100 - includesIndex * 3 - (haystack.length - needle.length);
  }

  let score = 0;
  let haystackIndex = 0;
  let lastMatch = -1;

  for (const char of needle) {
    const foundAt = haystack.indexOf(char, haystackIndex);
    if (foundAt === -1) {
      return -1;
    }

    score += 18;
    if (lastMatch >= 0) {
      score += Math.max(0, 10 - (foundAt - lastMatch - 1));
    }
    if (foundAt === haystackIndex) {
      score += 8;
    }

    lastMatch = foundAt;
    haystackIndex = foundAt + 1;
  }

  return score - haystack.length;
}

export function rankPaletteItems(items: PaletteItem[], query: string) {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) {
    return items.slice(0, 16);
  }

  return items
    .map((item, index) => {
      const labelScore = fuzzyScore(item.label.toLowerCase(), trimmedQuery);
      const valueScore = fuzzyScore(item.value.toLowerCase(), trimmedQuery);
      const score = Math.max(labelScore, valueScore);
      return { item, score, index };
    })
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.index - right.index;
    })
    .slice(0, 16)
    .map((entry) => entry.item);
}

export function groupPaletteItems(items: PaletteItem[]): PaletteGroup[] {
  const grouped = new Map<PaletteMeta, PaletteItem[]>();

  for (const item of items) {
    const current = grouped.get(item.meta) || [];
    current.push(item);
    grouped.set(item.meta, current);
  }

  return (["recommendation", "macro", "session", "command"] as PaletteMeta[])
    .map((meta) => ({
      meta,
      title: GROUP_TITLES[meta],
      items: grouped.get(meta) || [],
    }))
    .filter((group) => group.items.length > 0);
}

export function saveTerminalView(
  views: SavedTerminalView[],
  name: string,
  filters: TerminalFilterSnapshot,
  createId: () => string,
  createdAt: string,
) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return views;
  }

  const nextView: SavedTerminalView = {
    id: createId(),
    name: trimmedName,
    filters,
    createdAt,
  };

  return [nextView, ...views.filter((view) => view.name !== trimmedName)].slice(0, 6);
}

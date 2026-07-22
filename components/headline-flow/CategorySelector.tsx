"use client";

import { categoryLabels } from "@/lib/news/categories";
import { headlineCategories, type HeadlineCategory } from "@/types/headline";

export function CategorySelector({
  value,
  onChange,
}: {
  value: HeadlineCategory;
  onChange: (category: HeadlineCategory) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Headline categories">
      {headlineCategories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-100 ${
            value === category ? "border-sky-200 bg-white text-slate-950" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          }`}
        >
          {categoryLabels[category]}
        </button>
      ))}
    </div>
  );
}

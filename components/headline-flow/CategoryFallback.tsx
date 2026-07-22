import type { HeadlineCategory } from "@/types/headline";
import { categoryFallbacks } from "@/lib/news/categories";

export function CategoryFallback({ category, label }: { category: HeadlineCategory; label?: string }) {
  const fallback = categoryFallbacks[category];
  return (
    <div className="flex h-full min-h-[260px] items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#0b1c32,#102c4c_48%,#071322)]">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(125,211,252,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.12)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative mx-8 flex aspect-square w-52 max-w-[58%] items-center justify-center rounded-full border border-sky-200/20 bg-sky-300/10 shadow-[0_0_80px_rgba(56,189,248,0.18)]">
        <div className="absolute inset-6 rounded-full border border-white/10" />
        <div className="text-center">
          <p className="font-display text-4xl font-black tracking-normal text-white sm:text-5xl">{fallback.symbol}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">{label ?? fallback.label}</p>
        </div>
      </div>
    </div>
  );
}

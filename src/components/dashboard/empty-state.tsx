import Link from "next/link";
import { Inbox } from "lucide-react";
import { buttonVariants } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[26px] border border-dashed border-white/12 bg-white/[0.035] p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-[20px] border border-white/10 bg-white/6 p-3 text-slate-100">
          <Inbox className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
          <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

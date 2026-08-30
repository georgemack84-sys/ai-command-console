import type { Metadata } from "next";
import { HeadlineFlowClient } from "@/src/components/headline-flow/headline-flow-client";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Headline Flow",
  description: "Live current-event story packages with direct article trails and feed diagnostics.",
};

export default async function HeadlineFlowPage() {
  await requireSessionUser();

  return (
    <main className="min-h-screen bg-black p-3 text-white sm:p-6">
      <div className="mx-auto max-w-[1720px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#141b25_0%,#050912_100%)] p-2 shadow-[0_34px_120px_rgba(0,0,0,0.68)]">
        <HeadlineFlowClient />
      </div>
    </main>
  );
}

import type { HeadlineCategory } from "@/types/headline";

export type VisualMode = "ARTICLE_IMAGE" | "CATEGORY_FALLBACK" | "DATA_VISUAL" | "MULTI_SOURCE";

export type SynchronizedVisualRecord = {
  storyId: string;
  headline: string;
  articleUrl: string;
  visualMode: "ARTICLE_IMAGE" | "CATEGORY_FALLBACK";
  image?: {
    url: string;
    alt: string;
    caption?: string;
    credit?: string;
    width: number;
    height: number;
  };
  fallback?: {
    fallbackCategory: HeadlineCategory;
    label: string;
    symbol: string;
  };
  qualityScore: number;
  explanation: string;
  rejectedReasons: string[];
  synchronizedAt: string;
};

export type VisualSynchronizationOptions = {
  preserveExistingImage?: boolean;
};

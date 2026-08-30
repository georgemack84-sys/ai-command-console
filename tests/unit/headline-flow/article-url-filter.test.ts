import { describe, expect, it } from "vitest";
import { getArticleUrlRejectionReason, isLikelyArticleUrl } from "@/src/server/headline-flow/domain/article-url-filter";

describe("headline flow article URL filter", () => {
  it("accepts specific article URLs", () => {
    expect(isLikelyArticleUrl("https://news.example.com/2026/08/27/city-approves-overnight-cooling-centers")).toBe(true);
    expect(isLikelyArticleUrl("https://news.example.com/world/specific-current-event-with-enough-slug-detail")).toBe(true);
    expect(isLikelyArticleUrl("https://www.bbc.co.uk/news/articles/c74k8zwvez0o?at_medium=RSS&at_campaign=rss")).toBe(true);
    expect(isLikelyArticleUrl("https://www.sciencedaily.com/releases/2026/08/260826055508.htm")).toBe(true);
  });

  it("rejects generic website and topic URLs", () => {
    expect(getArticleUrlRejectionReason("https://news.example.com")).toBe("homepage");
    expect(getArticleUrlRejectionReason("https://news.example.com/world")).toBe("section_page");
    expect(getArticleUrlRejectionReason("https://news.example.com/search?q=current+events")).toBe("search_page");
    expect(getArticleUrlRejectionReason("https://news.example.com/news")).toBe("section_page");
  });

  it("rejects asset URLs and vague short slugs", () => {
    expect(getArticleUrlRejectionReason("https://news.example.com/images/photo.jpg")).toBe("asset_url");
    expect(getArticleUrlRejectionReason("https://news.example.com/story/update")).toBe("not_article_like");
  });
});

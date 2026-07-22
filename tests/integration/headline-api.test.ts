import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/headlines/route";

describe("/api/headlines", () => {
  it("returns mock headlines by default", async () => {
    const response = await GET(new Request("http://localhost/api/headlines?category=technology&limit=5"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.provider).toBe("mock");
    expect(body.stories.length).toBeGreaterThan(0);
  });

  it("rejects invalid categories", async () => {
    const response = await GET(new Request("http://localhost/api/headlines?category=bad&limit=5"));
    expect(response.status).toBe(400);
  });

  it("supports explicit mock fallback mode", async () => {
    const response = await GET(new Request("http://localhost/api/headlines?category=top&limit=3&mock=true"));
    const body = await response.json();

    expect(body.provider).toBe("mock");
    expect(body.count).toBeLessThanOrEqual(3);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { createAdapterServer } from "./server.mjs";

const servers = [];

const request = async (server, path, options = {}) => {
  const address = server.address();
  return fetch(`http://127.0.0.1:${address.port}${path}`, options);
};

const listen = (options) =>
  new Promise((resolve) => {
    const server = createAdapterServer(options);
    servers.push(server);
    server.listen(0, () => resolve(server));
  });

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("adapter service", () => {
  it("normalizes a weather response", async () => {
    const responses = [
      {
        ok: true,
        json: async () => ({
          results: [{ name: "Brooklyn", latitude: 40.7, longitude: -73.9 }],
        }),
      },
      {
        ok: true,
        json: async () => ({
          current: { temperature_2m: 21, weather_code: 3 },
          daily: {
            sunrise: ["2026-09-19T06:42"],
            sunset: ["2026-09-19T18:58"],
          },
        }),
      },
    ];
    const server = await listen({ fetchImpl: async () => responses.shift() });
    const response = await request(server, "/weather?city=Brooklyn");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      city: "Brooklyn",
      temperature: 21,
      weatherCode: 3,
      sunrise: "2026-09-19T06:42",
      sunset: "2026-09-19T18:58",
    });
  });

  it("rejects unconfirmed Proprium requests", async () => {
    const server = await listen();
    const response = await request(server, "/proprium/capability-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "PENDING" }),
    });
    expect(response.status).toBe(400);
  });
});

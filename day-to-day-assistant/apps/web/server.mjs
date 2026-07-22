import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const host = process.env.D2D_WEB_HOST ?? "127.0.0.1";
const port = Number(process.env.D2D_WEB_PORT ?? "5174");
const root = fileURLToPath(new URL(".", import.meta.url));

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

createServer(async (request, response) => {
  const requestPath = new URL(request.url ?? "/", `http://${host}:${port}`).pathname;
  const appRoutes = new Set([
    "/",
    "/setup",
    "/login",
    "/health",
    "/today",
    "/calendar",
    "/calendar/day",
    "/calendar/week",
    "/calendar/month",
    "/calendar/agenda",
    "/calendars",
    "/notes",
    "/notebooks",
    "/search",
    "/attachments",
    "/knowledge",
    "/memory",
    "/preferences",
    "/automation",
    "/routines",
    "/integrations",
    "/connectors",
    "/operations",
    "/diagnostics",
    "/assistant",
    "/conversations",
    "/assistant/settings",
    "/assistant/plans",
    "/assistant/actions",
    "/tasks",
    "/reminders",
    "/contacts",
    "/follow-ups",
    "/activity",
    "/settings",
    "/settings/profile",
    "/settings/preferences",
    "/settings/security",
    "/settings/sessions",
    "/session-expired",
    "/error",
  ]);
  const isAppRoute = appRoutes.has(requestPath) || requestPath.startsWith("/notes/") || requestPath.startsWith("/conversations/");
  const path = isAppRoute ? "/index.html" : requestPath;
  const filePath = join(root, "src", path.replace(/^\//, ""));
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] ?? "text/plain" });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
  }
}).listen(port, host, () => {
  console.log(`Web listening on http://${host}:${port}`);
});

# Remote optional adapters

The Capacitor bundle contains no server routes and must work without network access.

Run locally with `npm run adapter:dev`. Deploy `adapters/index.mjs` as a separate Node.js HTTPS service, then configure the mobile/web app with `NEXT_PUBLIC_AXIOM_ADAPTERS_URL`.

For a generic container deployment:

```bash
docker build -f adapters/Dockerfile -t axiom-time-adapter .
docker run --env-file adapters/.env -p 8787:8787 axiom-time-adapter
```

Copy `adapters/.env.example` to a local `.env` only for development. In production, configure the same variables in your host's secret settings. Confirm `GET /health` returns `{ "status": "ok" }` before assigning the public HTTPS URL to `NEXT_PUBLIC_AXIOM_ADAPTERS_URL` and rebuilding the mobile bundle.

The service exposes these endpoints:

- `GET /weather?city={city}`: returns the normalized weather payload formerly provided by the local route.
- `POST /proprium/capability-requests`: accepts only confirmed, typed capability requests and forwards them to Axiom OS Proprium using server-held credentials.

The browser never receives Proprium credentials. Adapter failure is optional-context failure; clocks, alarms, timers, and stopwatches still operate locally.

Set `AXIOM_ADAPTER_ALLOWED_ORIGINS` to your app origins (comma-separated). `AXIOM_PROPRIUM_URL` and `AXIOM_PROPRIUM_TOKEN` live only in the service host's secret store. The adapter accepts only confirmed capability requests, applies a small per-IP request limit, and does not log city names or request payloads.

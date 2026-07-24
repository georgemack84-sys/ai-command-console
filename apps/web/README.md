# Proprium frontend

Run locally with `npm install`, copy `.env.example` to `.env.local`, then use `npm run dev`. Public configuration is validated before production builds. `.env.docker` supplies Docker Compose build interpolation only:

```bash
docker compose --env-file ./apps/web/.env.docker build web
```

Changing a `NEXT_PUBLIC_*` value requires rebuilding the image; it is not runtime configuration. Run `npm run validate` for the local quality gates.

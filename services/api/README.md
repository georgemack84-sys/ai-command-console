# Proprium API

The backend is a .NET 8 layered solution. Run the complete qualification suite with:

```bash
dotnet test services/api/Proprium.sln
dotnet build services/api/Proprium.sln
docker compose build api
docker compose up api
```

The platform endpoints are `/api/v1`, `/api/v1/health`, `/api/v1/health/live`, and `/api/v1/health/ready`. OpenAPI is at `/openapi/v1.json`; Swagger UI is available in Development only.

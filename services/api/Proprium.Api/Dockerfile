FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY Directory.Build.props Directory.Packages.props global.json ./
COPY services/api/ ./services/api/
RUN dotnet restore services/api/Proprium.sln
RUN dotnet format services/api/Proprium.sln --verify-no-changes --no-restore
RUN dotnet test services/api/Proprium.sln -c Release --no-restore --filter "Category!=Integration"
RUN dotnet publish services/api/Proprium.Api/Proprium.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
RUN addgroup --system --gid 10001 proprium && adduser --system --uid 10001 --ingroup proprium proprium
COPY --from=build --chown=proprium:proprium /app/publish .
USER proprium
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Proprium.Api.dll"]

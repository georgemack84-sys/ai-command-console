# ADR-0004: Use minimal API endpoint modules

**Status:** Accepted  
**Date:** 2026-07-22

The backend uses ASP.NET Core minimal APIs. `Program.cs` is the composition root and endpoint modules reside in `Proprium.Api/Endpoints`. MVC controllers are prohibited to keep HTTP composition explicit and thin.

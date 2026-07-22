SHELL := pwsh

.PHONY: help doctor bootstrap dev stop restart logs test test-backend test-frontend test-integration test-smoke lint format format-check typecheck quality migrate migration migration-status database-shell database-reset pre-commit-install pre-commit clean health reset-dev

help:
	@Write-Host "bootstrap          Check machine, create .env, migrate local database"
	@Write-Host "doctor             Run machine readiness checks"
	@Write-Host "dev                Start local API and web development servers"
	@Write-Host "stop               Stop project services on configured development ports"
	@Write-Host "restart            Stop then start development services"
	@Write-Host "health             Check API health"
	@Write-Host "test               Run foundational backend and frontend tests"
	@Write-Host "test-smoke         Validate running API and web shell"
	@Write-Host "quality            Run format-check, lint, and typecheck"
	@Write-Host "database-reset     Destructive: requires D2D_CONFIRM_DATABASE_RESET=yes"

doctor:
	./scripts/bootstrap/check_machine.ps1

bootstrap:
	./scripts/bootstrap/bootstrap.ps1

dev:
	./scripts/development/dev.ps1

stop:
	./scripts/development/stop.ps1

restart: stop dev

logs:
	@Get-Content .dev/api.out.log,.dev/api.err.log,.dev/web.out.log,.dev/web.err.log -ErrorAction SilentlyContinue

test:
	./scripts/test/test.ps1

test-backend:
	./scripts/test/test-backend.ps1

test-frontend:
	./scripts/test/test-frontend.ps1

test-integration:
	./scripts/test/test-integration.ps1

test-smoke:
	./scripts/test/smoke.ps1

lint:
	./scripts/test/lint.ps1

format:
	./scripts/test/format.ps1

format-check:
	./scripts/test/format-check.ps1

typecheck:
	./scripts/test/typecheck.ps1

quality: format-check lint typecheck

migrate:
	./scripts/development/migrate.ps1

migration:
	@Write-Error "Migration creation is deferred until Alembic dependency installation is approved."

migration-status:
	./scripts/database/status.ps1

database-shell:
	docker compose exec postgres psql -U d2d -d day_to_day_assistant

database-reset:
	./scripts/database/reset.ps1

pre-commit-install:
	@if (Get-Command pre-commit -ErrorAction SilentlyContinue) { pre-commit install } else { Write-Host "pre-commit not installed; install it before enabling hooks." }

pre-commit:
	./scripts/test/pre-commit.ps1

clean:
	@Remove-Item -Recurse -Force .dev,coverage,htmlcov -ErrorAction SilentlyContinue

reset-dev:
	./scripts/development/reset-dev.ps1

health:
	./scripts/development/health.ps1

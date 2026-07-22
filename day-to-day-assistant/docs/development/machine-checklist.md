# Development-Machine Checklist

## Supported Baseline

- Operating systems: Windows 11, macOS 14+, Ubuntu 24.04 LTS or comparable Linux
- Python: 3.12.x
- Node.js: 22.x
- Package manager: npm included with Node.js 22
- Docker: Docker Desktop or Docker Engine with Compose v2
- Make: GNU Make or compatible wrapper
- Shell: PowerShell 7 recommended on Windows

## Required Ports

- Frontend: 5174 by default, with fallback ports 5175-5178 during local development
- Backend API: 8010
- PostgreSQL: 5432

## Checklist

- [ ] Git installed
- [ ] Git identity configured
- [ ] Repository access configured
- [ ] Docker installed
- [ ] Docker daemon running
- [ ] Docker Compose available
- [ ] Python 3.12 installed
- [ ] Node.js 22 installed
- [ ] npm available
- [ ] Make available
- [ ] Required ports available or documented as intentionally occupied
- [ ] At least 2 GB free disk space
- [ ] Environment file can be created
- [ ] Repository directory is writable

## Verification

```powershell
./scripts/bootstrap/check_machine.ps1
```

```bash
./scripts/bootstrap/check_machine.sh
```

## Common Failures

- Docker daemon not running: start Docker Desktop or the Docker service.
- Port conflict: stop the conflicting service or adjust `.env`.
- Python not on PATH: install Python 3.12 or use the bundled Codex runtime during local desktop development.
- Node not on PATH: install Node.js 22 or use the bundled Codex runtime during local desktop development.

## Windows Notes

Use PowerShell 7 where possible. Docker Desktop must be running before PostgreSQL can start through Compose.

## macOS Notes

Install Docker Desktop, Node.js 22, Python 3.12, and Make. Use the shell scripts or Make targets.

## Linux Notes

Install Docker Engine with Compose v2, Python 3.12, Node.js 22, and Make. Ensure your user can access the Docker daemon.

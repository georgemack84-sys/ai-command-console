.DEFAULT_GOAL := help

.PHONY: help bootstrap dev stop build test lint format migrate reset-db health export-permissions

help:
	@node scripts/proprium-command.cjs help

bootstrap dev stop build test lint format migrate health export-permissions:
	@node scripts/proprium-command.cjs $@

reset-db:
	@node scripts/proprium-command.cjs reset-db --force

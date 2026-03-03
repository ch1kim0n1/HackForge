# HackForge v2 Summary

## Release goal

v2 turns HackForge into a reliable all-in-one hackathon starter by prioritizing correctness, consistency, and executable documentation.

## Delivered outcomes

- Guided beginner runner (`./runner.sh`) with interactive template selection
- Default template output outside HackForge root when using runner mode
- Runner mode self-deletion sequence after successful generation
- Safe self-deletion guardrails (deletes only validated HackForge root)
- Unified API contract across web stacks (`/api/health` + `/api/items` CRUD)
- Stack input normalization (`--stack` accepts key and friendly name)
- Fully applied web options (`folderStructure`, `includeDocker`, `features`)
- Optional features implemented with executable auth/database/docs/testing outputs
- Production hardening baseline (security middleware, metrics/readiness, Docker healthchecks, CI quality gates)
- Expanded tests: matrix generation and docs command checks

## Documentation map

- `README.md`: overview and core behavior
- `QUICKSTART.md`: shortest beginner path
- `STARTUP.md`: full startup and safety details
- `USAGE.md`: runner + CLI reference
- `MIGRATION.md`: migration details from v1

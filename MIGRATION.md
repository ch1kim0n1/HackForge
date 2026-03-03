# Migration Guide: v1 to v2

## Version

- v1.x to v2.0.0

## Breaking changes

1. Runner behavior

- New beginner command: `./runner.sh`
- Runner generates template output in the parent directory of HackForge.
- Runner schedules deletion of the HackForge directory after successful generation.
- Deletion now has hard safety checks and only runs for the validated `HackForge` repo folder.

2. Removed implicit output copy from core CLI

- Old behavior: interactive mode copied generated projects to `../output`.
- New behavior: core CLI writes to configured output path only (`--output-dir` or current directory).

3. Standardized web API contract

- Old pattern: many templates consumed `/api/data`.
- New pattern: all web templates use:
  - `GET /api/health`
  - `GET /api/items`
  - `POST /api/items`
  - `PUT /api/items/:id`
  - `DELETE /api/items/:id`

4. Stack input normalization

- `--stack` accepts canonical keys and friendly names.
- Canonical keys are still preferred for automation.

## Self-destruct opt-out

To keep HackForge after runner execution:

```bash
HACKFORGE_SKIP_SELF_DESTRUCT=1 ./runner.sh
```

## Command migration examples

```bash
# beginner flow
./runner.sh

# advanced flow with explicit output path
node bin/forge.js --name app --stack react-express --output-dir ../
```

## API integration migration

If your generated frontend or tests call `/api/data`, update to `/api/items`.

```diff
- GET /api/data
+ GET /api/items
```

# MindCore Forge v2

MindCore Forge is an all-in-one hackathon starter generator.

## Beginner flow (recommended)

1. Clone and install dependencies.
2. Run `./runner.sh`.
3. Select template preferences in the guided terminal window.
4. HackForge generates the project outside the HackForge folder (in its parent directory).
5. HackForge schedules self-deletion after successful generation.

## Start here

- Fastest onboarding: `QUICKSTART.md`
- Full startup and safety notes: `STARTUP.md`
- Command reference: `USAGE.md`
- Migration details: `MIGRATION.md`

## Install

```bash
git clone https://github.com/ch1kim0n1/HackForge.git
cd HackForge
npm install
```

## Run with guided runner

```bash
./runner.sh
```

Dependency behavior:
- JS projects install with `npm install` automatically when install is enabled.
- Non-JS toolchains (Python/Go/Rust/Flutter) are scaffolded and manual commands are printed after generation.

By default, runner mode deletes the HackForge folder after a successful generation.
Deletion runs only if strict safety checks pass:
- target path matches current repo realpath
- folder name is exactly `HackForge`
- marker + package identity checks pass

To disable self-deletion (for development/testing):

```bash
HACKFORGE_SKIP_SELF_DESTRUCT=1 ./runner.sh
```

## Advanced CLI (optional)

```bash
# Interactive
node bin/forge.js

# Non-interactive
node bin/forge.js --name my-app --stack react-express --description "Realtime dashboard"

# Output somewhere else
node bin/forge.js --name my-app --stack react-express --output-dir ../
```

## Web API contract

Generated web templates follow:

- `GET /api/health`
- `GET /api/items`
- `POST /api/items`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`

## Optional feature implementations

- `auth`: backend auth routes + frontend auth service
- `database`: SQLite init/migration scripts + DB env wiring
- `api-docs`: OpenAPI spec + docs endpoint wiring
- `testing`: executable frontend/backend contract tests
- `cicd`: CI workflow with lint/test/security audit
- `env`: generated `.env.example` files with required keys

## Production baseline included

- security middleware and auth secret wiring
- readiness + metrics endpoints (`/api/ready`, `/metrics`)
- Docker healthchecks and restart policies
- CI lint/test/security audit stages

## Testing

```bash
npm test
```

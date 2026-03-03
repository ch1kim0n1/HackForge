# Startup Guide (Developers)

This guide explains the beginner runner flow and the advanced CLI flow.

## Prerequisites

- Node.js 18+ recommended
- npm

## Install

```bash
git clone https://github.com/ch1kim0n1/HackForge.git
cd HackForge
npm install
```

## Beginner runner flow

Use this when you want a plug-and-play guided experience.

```bash
./runner.sh
```

What happens:

1. Runner asks for project name, stack, description, and options.
2. For web stacks, runner asks folder structure, Docker, and features.
3. Template is generated in the parent directory of HackForge.
4. JS projects run `npm install` automatically when install is enabled.
5. Non-JS toolchain bootstrap (Python/Go/Rust/Flutter) is scaffold-only by default and printed as manual commands.
6. Runner prints generated project path.
7. Runner schedules HackForge self-deletion.
8. Self-deletion executes only when target path identity checks pass and target is exactly the `HackForge` folder.

To disable self-deletion during development:

```bash
HACKFORGE_SKIP_SELF_DESTRUCT=1 ./runner.sh
```

## Advanced CLI flow

Use this for automation or CI.

```bash
node bin/forge.js --name my-app --stack react-express --description "Sample app"
```

Useful options:

- `--output-dir <path>`
- `--folder-structure <separate|monorepo|nested>`
- `--features <auth,database,api-docs,testing,cicd,env>`
- `--no-docker`
- `--skip-install`
- `--dry-run`
- `--json`

## Validate installation

```bash
npm test
node bin/forge.js --list-stacks
```

## Generated web contract

- `GET /api/health`
- `GET /api/items`
- `POST /api/items`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`

## Hardening defaults in generated web stacks

- `/metrics` and `/api/ready` endpoints
- environment-driven CORS and secret configuration
- Docker healthchecks and restart policies
- CI workflow with lint, test, and security audit steps

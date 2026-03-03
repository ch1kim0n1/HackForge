# Usage

## Guided runner (beginner mode)

```bash
./runner.sh
```

Runner behavior:

- interactive template selection
- output generated outside HackForge root (parent directory)
- self-deletes HackForge after successful generation (only after strict path/identity checks)

Disable self-deletion when needed:

```bash
HACKFORGE_SKIP_SELF_DESTRUCT=1 ./runner.sh
```

## CLI (advanced mode)

```bash
# Interactive
node bin/forge.js

# Non-interactive
node bin/forge.js --name analytics --stack react-go --description "Analytics dashboard"

# Friendly stack name
node bin/forge.js --name analytics --stack "React + Go/Gin" --description "Analytics dashboard"

# Custom output location
node bin/forge.js --name analytics --stack react-go --output-dir ../

# Dry run
node bin/forge.js --name preview --stack vue-express --dry-run

# JSON output
node bin/forge.js --name api --stack spring-boot --json --dry-run

# List stacks
node bin/forge.js --list-stacks
```

## CLI options

- `-n, --name <name>`
- `-s, --stack <stack>`
- `-d, --description <desc>`
- `--output-dir <path>`
- `--folder-structure <separate|monorepo|nested>`
- `--features <csv>`
- `--no-docker`
- `--list-stacks`
- `--dry-run`
- `--skip-install`
- `--json`
- `--smart`
- `-h, --help`

#!/usr/bin/env node

const { run, generate, listStacks } = require('../src/index.js');

// Parse CLI arguments
const args = process.argv.slice(2);

function parseArgs(args) {
  const parsed = { flags: {} };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      parsed.flags.help = true;
    } else if (arg === '--list-stacks') {
      parsed.flags.listStacks = true;
    } else if (arg === '--dry-run') {
      parsed.flags.dryRun = true;
    } else if (arg === '--skip-install') {
      parsed.flags.skipInstall = true;
    } else if (arg === '--json') {
      parsed.flags.json = true;
    } else if ((arg === '--name' || arg === '-n') && args[i + 1]) {
      parsed.name = args[++i];
    } else if ((arg === '--stack' || arg === '-s') && args[i + 1]) {
      parsed.stack = args[++i];
    } else if ((arg === '--description' || arg === '-d') && args[i + 1]) {
      parsed.description = args[++i];
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`
MindCore · Forge - Hackathon project bootstrapper

USAGE:
  forge                                    Interactive mode (prompts)
  forge --name <name> --stack <stack>      Non-interactive mode

OPTIONS:
  -n, --name <name>          Project name (lowercase alphanumeric with hyphens)
  -s, --stack <stack>        Stack key (use --list-stacks to see options)
  -d, --description <desc>   Project description (default: "A hackathon project")
      --list-stacks          List all available stacks as JSON
      --dry-run              Preview what would be generated without creating files
      --skip-install         Create files but skip dependency installation
      --json                 Output result as JSON (non-interactive mode only)
  -h, --help                 Show this help message

EXAMPLES:
  forge                                          # Interactive mode
  forge --name my-app --stack react-express      # React + Express project
  forge --name api --stack fastapi               # Python FastAPI backend
  forge --name game --stack pygame               # Pygame project
  forge --list-stacks                            # Show all stacks
  forge --list-stacks | jq '.web'                # Filter web stacks
  forge --name test --stack nextjs --dry-run     # Preview without creating

STACK CATEGORIES:
  Web Full-Stack    react-express, vue-express, nextjs, angular-express, ...
  Mobile            react-native, flutter, swift-ios, kotlin-android
  CLI & Desktop     go-cli, python-cli, rust-cli, electron
  Backend API       spring-boot, rails-api, phoenix
  Data Science      jupyter, pytorch, tensorflow
  Games             pygame, phaser
  Infrastructure    terraform, kubernetes, docker-compose, ansible
`);
}

const parsed = parseArgs(args);

if (parsed.flags.help) {
  printHelp();
  process.exit(0);
}

if (parsed.flags.listStacks) {
  const stacks = listStacks();
  console.log(JSON.stringify(stacks, null, 2));
  process.exit(0);
}

// Non-interactive mode: if --name and --stack are provided
if (parsed.name && parsed.stack) {
  generate({
    projectName: parsed.name,
    stack: parsed.stack,
    projectDescription: parsed.description || 'A hackathon project',
    dryRun: parsed.flags.dryRun || false,
    skipInstall: parsed.flags.skipInstall || false,
    jsonOutput: parsed.flags.json || false,
  }).catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
} else if (parsed.name || parsed.stack) {
  // Partial args — tell user what's missing
  console.error('Error: Both --name and --stack are required for non-interactive mode.');
  console.error('Run "forge --help" for usage information.');
  process.exit(1);
} else {
  // Interactive mode
  run(parsed.flags).catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

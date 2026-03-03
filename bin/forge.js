#!/usr/bin/env node

const { run, generate, listStacks } = require('../src/index.js');

const args = process.argv.slice(2);

function parseArgs(argv) {
  const parsed = { flags: {} };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

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
    } else if (arg === '--smart') {
      parsed.flags.smart = true;
    } else if (arg === '--no-docker') {
      parsed.flags.noDocker = true;
    } else if (arg === '--output-dir' && argv[i + 1]) {
      parsed.outputDir = argv[++i];
    } else if ((arg === '--name' || arg === '-n') && argv[i + 1]) {
      parsed.name = argv[++i];
    } else if ((arg === '--stack' || arg === '-s') && argv[i + 1]) {
      parsed.stack = argv[++i];
    } else if ((arg === '--description' || arg === '-d') && argv[i + 1]) {
      parsed.description = argv[++i];
    } else if (arg === '--folder-structure' && argv[i + 1]) {
      parsed.folderStructure = argv[++i];
    } else if (arg === '--features' && argv[i + 1]) {
      parsed.features = argv[++i];
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`
MindCore · Forge v2 - All-in-one hackathon starter

USAGE:
  forge                                         Interactive mode (prompts)
  forge --smart                                 Smart AI interactive mode
  forge --name <name> --stack <stack>           Non-interactive mode

OPTIONS:
  --smart                       Enable AI recommendations and enrichment
  -n, --name <name>             Project name (lowercase alphanumeric with hyphens)
  -s, --stack <stack>           Stack key OR stack display name
  -d, --description <desc>      Project description
      --output-dir <path>        Output directory (defaults to current working directory)
      --folder-structure <val>  separate | monorepo | nested (web stacks)
      --features <list>         Comma-separated: auth,database,api-docs,testing,cicd,env
      --no-docker               Disable Docker assets for web stacks
      --list-stacks             List all available stacks as JSON
      --dry-run                 Preview without creating files
      --skip-install            Skip dependency installation
      --json                    Output result as JSON (non-interactive only)
  -h, --help                    Show this help message

EXAMPLES:
  forge --name my-app --stack react-express --description "Realtime app"
  forge --name my-app --stack "React + Express" --description "Friendly name works"
  forge --name my-api --stack spring-boot --json
  forge --name demo --stack react-fastapi --output-dir ../ --folder-structure monorepo --features env,testing,cicd --dry-run
  forge --list-stacks
`);
}

const parsed = parseArgs(args);

if (parsed.flags.help) {
  printHelp();
  process.exit(0);
}

if (parsed.flags.listStacks) {
  console.log(JSON.stringify(listStacks(), null, 2));
  process.exit(0);
}

if (parsed.name && parsed.stack) {
  generate({
    projectName: parsed.name,
    stack: parsed.stack,
    projectDescription: parsed.description || 'A hackathon project',
    dryRun: Boolean(parsed.flags.dryRun),
    skipInstall: Boolean(parsed.flags.skipInstall),
    jsonOutput: Boolean(parsed.flags.json),
    folderStructure: parsed.folderStructure,
    outputDir: parsed.outputDir,
    includeDocker: parsed.flags.noDocker ? false : undefined,
    features: parsed.features
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
} else if (parsed.name || parsed.stack) {
  console.error('Error: Both --name and --stack are required for non-interactive mode.');
  console.error('Run "forge --help" for usage information.');
  process.exit(1);
} else {
  run(parsed.flags).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

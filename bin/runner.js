#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');
const inquirer = require('inquirer');
const chalk = require('chalk');

const { generate, listStacks } = require('../src/index');
const { resolveStackInput } = require('../src/stacks');

const DEFAULT_FEATURES = ['env', 'testing', 'cicd'];

function assertProjectName(projectName) {
  if (!/^[a-z0-9-]+$/.test(projectName)) {
    return 'Project name must be lowercase alphanumeric with hyphens only.';
  }

  if (projectName.includes('..') || projectName.includes('/') || projectName.includes('\\')) {
    return 'Project name cannot contain paths or forbidden characters.';
  }

  return true;
}

function scheduleSelfDestruct(repoRoot) {
  if (process.env.HACKFORGE_SKIP_SELF_DESTRUCT === '1') {
    console.log(chalk.yellow('\nSelf-destruct skipped because HACKFORGE_SKIP_SELF_DESTRUCT=1.'));
    return;
  }

  const selfDestructScript = path.join(repoRoot, 'bin', 'self-destruct.js');
  const child = spawn(process.execPath, [selfDestructScript, repoRoot], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
}

function buildStackChoices() {
  const grouped = listStacks();
  const choices = [];

  Object.entries(grouped).forEach(([category, stacks]) => {
    choices.push(new inquirer.Separator(`\n=== ${category} ===`));
    stacks.forEach(stack => {
      choices.push({
        name: `${stack.name} (${stack.key}) - ${stack.description}`,
        value: stack.key,
        short: stack.name
      });
    });
  });

  return choices;
}

async function collectConfiguration(defaultOutputDir) {
  const stackChoices = buildStackChoices();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: 'my-hackathon-project',
      validate: assertProjectName
    },
    {
      type: 'list',
      name: 'stack',
      message: 'Choose a template stack:',
      choices: stackChoices,
      pageSize: 18
    },
    {
      type: 'input',
      name: 'description',
      message: 'Brief project description:',
      default: 'A hackathon project'
    },
    {
      type: 'confirm',
      name: 'installDependencies',
      message: 'Install dependencies automatically?',
      default: true
    }
  ]);

  const stack = resolveStackInput(answers.stack);
  if (!stack) {
    throw new Error(`Unable to resolve stack: ${answers.stack}`);
  }

  const config = {
    projectName: answers.projectName,
    stack: answers.stack,
    projectDescription: answers.description,
    outputDir: defaultOutputDir,
    skipInstall: !answers.installDependencies
  };

  if (stack.config.type === 'web' && !stack.config.framework) {
    const webAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'folderStructure',
        message: 'Folder structure:',
        choices: [
          { name: 'separate (frontend + backend)', value: 'separate' },
          { name: 'monorepo (apps/frontend + apps/backend)', value: 'monorepo' },
          { name: 'nested (frontend/backend)', value: 'nested' }
        ],
        default: 'separate'
      },
      {
        type: 'confirm',
        name: 'includeDocker',
        message: 'Include Docker files?',
        default: true
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Optional features:',
        choices: [
          { name: 'auth', value: 'auth' },
          { name: 'database', value: 'database' },
          { name: 'api-docs', value: 'api-docs' },
          { name: 'testing', value: 'testing' },
          { name: 'cicd', value: 'cicd' },
          { name: 'env', value: 'env' }
        ],
        default: DEFAULT_FEATURES
      }
    ]);

    config.folderStructure = webAnswers.folderStructure;
    config.includeDocker = webAnswers.includeDocker;
    config.features = webAnswers.features;
  }

  return config;
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const defaultOutputDir = path.dirname(repoRoot);

  console.log(chalk.cyan.bold('\nHackForge Runner'));
  console.log(chalk.gray('Beginner setup mode: guided template generation.'));
  console.log(chalk.gray(`Templates will be generated in: ${defaultOutputDir}`));

  const config = await collectConfiguration(defaultOutputDir);

  const summary = [
    `Project: ${config.projectName}`,
    `Stack: ${config.stack}`,
    `Description: ${config.projectDescription}`,
    `Output directory: ${config.outputDir}`,
    `Install dependencies: ${config.skipInstall ? 'no' : 'yes'}`
  ];

  if (config.folderStructure) {
    summary.push(`Folder structure: ${config.folderStructure}`);
    summary.push(`Docker: ${config.includeDocker ? 'yes' : 'no'}`);
    summary.push(`Features: ${(config.features || []).join(', ') || 'none'}`);
  }

  console.log(chalk.cyan('\nConfiguration summary:'));
  summary.forEach(line => console.log(`  - ${line}`));

  const confirmation = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Generate project now?',
      default: true
    }
  ]);

  if (!confirmation.proceed) {
    console.log(chalk.yellow('Generation cancelled.'));
    process.exit(0);
  }

  const result = await generate(config);

  console.log(chalk.green(`\nProject created at: ${result.directory}`));
  console.log(chalk.yellow('HackForge will now run safe self-delete in 2 seconds (only this HackForge folder).'));
  console.log(chalk.gray('Set HACKFORGE_SKIP_SELF_DESTRUCT=1 to disable this behavior.'));

  scheduleSelfDestruct(repoRoot);
}

main().catch(error => {
  console.error(chalk.red(`\nRunner error: ${error.message}`));
  process.exit(1);
});

import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const args = new Set(process.argv.slice(2));
const skipApiParity = args.has('--skip-api-parity');
const skipFrontend = args.has('--skip-frontend');
const skipBackend = args.has('--skip-backend');
const includeE2E = args.has('--include-e2e');

function runCommand(command, commandArgs, options = {}) {
  const executable = process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;

  return new Promise((resolve, reject) => {
    const child = spawn(executable, commandArgs, {
      cwd: options.cwd ?? repoRoot,
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${commandArgs.join(' ')} failed with exit code ${code}`));
    });

    child.on('error', reject);
  });
}

async function runStep(name, action) {
  console.log(`\n==> ${name}`);
  await action();
}

async function main() {
  if (!skipApiParity) {
    await runStep('API contract parity', async () => {
      await runCommand('node', ['tools/check-api-parity.mjs']);
    });
  }

  await runStep('Backend dependency consistency', async () => {
    await runCommand('node', ['tools/check-backend-deps.mjs']);
  });

  if (!skipFrontend) {
    await runStep('Frontend unit tests', async () => {
      await runCommand('npm', ['test'], { cwd: path.join(repoRoot, 'frontend') });
    });
  }

  if (!skipBackend) {
    await runStep('Backend unit and integration tests', async () => {
      await runCommand('python', ['-m', 'pytest', '-m', 'unit or integration'], { cwd: path.join(repoRoot, 'backend') });
    });
  }

  if (includeE2E) {
    await runStep('Frontend PR e2e subset', async () => {
      await runCommand('npm', ['run', 'test:e2e:pr'], { cwd: path.join(repoRoot, 'frontend') });
    });
  }

  console.log('\nVerification completed successfully.');
}

main().catch((error) => {
  console.error(`\nVerification failed: ${error.message}`);
  process.exit(1);
});

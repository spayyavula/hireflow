import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const requirementsFile = path.join(repoRoot, 'backend', 'requirements.txt');
const pyprojectFile = path.join(repoRoot, 'backend', 'pyproject.toml');

function normalizePackageName(specifier) {
  return specifier
    .trim()
    .split(/[<>=!~]/, 1)[0]
    .split('[', 1)[0]
    .trim()
    .toLowerCase();
}

function parseRequirements() {
  const source = fs.readFileSync(requirementsFile, 'utf8');
  return new Set(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map(normalizePackageName)
  );
}

function parsePyprojectDependencies() {
  const source = fs.readFileSync(pyprojectFile, 'utf8');
  const lines = source.split(/\r?\n/);
  const packages = new Set();

  const startIndex = lines.findIndex((line) => line.trim() === 'dependencies = [');
  if (startIndex === -1) {
    return packages;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (trimmed === ']') {
      break;
    }

    const dependencyMatch = trimmed.match(/^"([^"]+)"\s*,?$/);
    if (dependencyMatch) {
      packages.add(normalizePackageName(dependencyMatch[1]));
    }
  }

  return packages;
}

function formatList(items) {
  return items.sort().map((item) => `- ${item}`).join('\n');
}

function main() {
  const requirementsPackages = parseRequirements();
  const pyprojectPackages = parsePyprojectDependencies();

  const missingInPyproject = [...requirementsPackages].filter((pkg) => !pyprojectPackages.has(pkg));
  const missingInRequirements = [...pyprojectPackages].filter((pkg) => !requirementsPackages.has(pkg));

  if (missingInPyproject.length > 0 || missingInRequirements.length > 0) {
    console.error('Backend dependency consistency check failed.');

    if (missingInPyproject.length > 0) {
      console.error('\nPackages present in backend/requirements.txt but missing in backend/pyproject.toml:');
      console.error(formatList(missingInPyproject));
    }

    if (missingInRequirements.length > 0) {
      console.error('\nPackages present in backend/pyproject.toml but missing in backend/requirements.txt:');
      console.error(formatList(missingInRequirements));
    }

    process.exit(1);
  }

  console.log(`Backend dependency consistency check passed. Verified ${requirementsPackages.size} packages.`);
}

main();

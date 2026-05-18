import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const backendRoutesDir = path.join(repoRoot, 'backend', 'api', 'routes');
const webApiFile = path.join(repoRoot, 'frontend', 'src', 'api.js');
const mobileApiFile = path.join(repoRoot, 'mobile', 'src', 'services', 'api.js');
const readmeFile = path.join(repoRoot, 'README.md');

function normalizeRoutePath(p) {
  return p
    .replace(/\$\{[^}]+\}/g, ':param')
    .replace(/\{[^/}]+\}/g, ':param')
    .replace(/\?.*$/, '')
    .replace(/\/+/g, '/');
}

function parseBackendRoutes() {
  const signatures = new Set();
  const paths = new Set();
  const files = fs.readdirSync(backendRoutesDir).filter((f) => f.endsWith('.py'));

  for (const file of files) {
    const fullPath = path.join(backendRoutesDir, file);
    const source = fs.readFileSync(fullPath, 'utf8');

    const prefixMatch = source.match(/APIRouter\(\s*prefix\s*=\s*"([^"]+)"/);
    const prefix = prefixMatch ? prefixMatch[1] : '';

    const routeRegex = /@router\.(get|post|put|patch|delete)\(\s*"([^"]*)"/g;
    let match;
    while ((match = routeRegex.exec(source)) !== null) {
      const method = match[1].toUpperCase();
      const route = match[2];
      const combined = `${prefix}${route}`;
      const normalized = normalizeRoutePath(combined);
      signatures.add(`${method} ${normalized}`);
      paths.add(normalized);
    }
  }

  return { signatures, paths };
}

function parseClientApi(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const signatures = new Set();
  const paths = new Set();

  // this._fetch('/api/path', { method: 'POST' })
  const fetchRegex = /this\._fetch\(\s*(["'`])([^"'`]+)\1\s*(?:,\s*\{([\s\S]*?)\})?\s*\)/g;
  let match;
  while ((match = fetchRegex.exec(source)) !== null) {
    const rawPath = match[2];
    if (!rawPath.startsWith('/api/')) continue;

    const optionsBlock = match[3] || '';
    const methodMatch = optionsBlock.match(/method\s*:\s*['"]([A-Za-z]+)['"]/);
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

    const normalized = normalizeRoutePath(rawPath);
    signatures.add(`${method} ${normalized}`);
    paths.add(normalized);
  }

  // direct fetch(`${BASE_URL}/api/path`, { method: 'POST' })
  const directRegex = /fetch\(\s*`\$\{[^}]+\}(\/api\/[^`]+)`\s*,\s*\{([\s\S]*?)\}\s*\)/g;
  while ((match = directRegex.exec(source)) !== null) {
    const rawPath = match[1];
    const optionsBlock = match[2] || '';
    const methodMatch = optionsBlock.match(/method\s*:\s*['"]([A-Za-z]+)['"]/);
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

    const normalized = normalizeRoutePath(rawPath);
    signatures.add(`${method} ${normalized}`);
    paths.add(normalized);
  }

  return { signatures, paths };
}

function parseReadmeApiPaths() {
  const source = fs.readFileSync(readmeFile, 'utf8');
  const sectionMatch = source.match(/## API Endpoints([\s\S]*?)## Testing/);
  if (!sectionMatch) {
    return new Set();
  }

  const section = sectionMatch[1];
  const paths = new Set();
  const rowRegex = /^\|\s*[^|]+\|\s*`([^`]+)`\s*\|/gm;

  let match;
  while ((match = rowRegex.exec(section)) !== null) {
    const rawPath = match[1];
    if (!rawPath.startsWith('/api/')) continue;
    paths.add(normalizeRoutePath(rawPath));
  }

  return paths;
}

function main() {
  const backend = parseBackendRoutes();
  const web = parseClientApi(webApiFile);
  const mobile = parseClientApi(mobileApiFile);
  const readmePaths = parseReadmeApiPaths();

  const clientPaths = new Set([...web.paths, ...mobile.paths]);
  const clientSignatures = new Set([...web.signatures, ...mobile.signatures]);
  const missingPaths = [...clientPaths].filter((p) => !backend.paths.has(p));
  const missingReadmePaths = [...readmePaths].filter((p) => !backend.paths.has(p));
  const methodMismatches = [...clientSignatures].filter((s) => {
    const pathOnly = s.replace(/^[A-Z]+\s+/, '');
    return backend.paths.has(pathOnly) && !backend.signatures.has(s);
  });

  if (missingPaths.length > 0) {
    console.error('API parity check failed. Client endpoints not found in backend:');
    for (const p of missingPaths.sort()) {
      console.error(`- ${p}`);
    }
    process.exit(1);
  }

  if (missingReadmePaths.length > 0) {
    console.error('API parity check failed. README endpoints not found in backend:');
    for (const p of missingReadmePaths.sort()) {
      console.error(`- ${p}`);
    }
    process.exit(1);
  }

  if (methodMismatches.length > 0) {
    console.warn('API parity warning. Path exists but method differs for:');
    for (const s of methodMismatches.sort()) {
      console.warn(`- ${s}`);
    }
  }

  console.log(
    `API parity check passed. Verified ${clientPaths.size} client endpoint paths and ${readmePaths.size} README endpoint paths.`
  );
}

main();

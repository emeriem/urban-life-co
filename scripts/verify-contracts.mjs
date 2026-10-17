import { readFileSync } from 'node:fs';

const tests = JSON.parse(readFileSync('tests/tests.json', 'utf8'));
const backend = readFileSync('backend/index.ts', 'utf8');
const frontend = readFileSync('src/App.tsx', 'utf8');

const requiredFields = ['name', 'description', 'viewport', 'covers', 'steps', 'expected'];
const names = new Set();
for (const [index, test] of tests.entries()) {
  for (const field of requiredFields) {
    if (test[field] === undefined || test[field] === null || test[field] === '') {
      throw new Error(`Test ${index + 1} is missing required field: ${field}`);
    }
  }
  if (!Array.isArray(test.covers) || test.covers.length === 0) throw new Error(`Test ${test.name} needs coverage labels`);
  if (!Array.isArray(test.steps) || test.steps.length === 0) throw new Error(`Test ${test.name} needs executable steps`);
  if (!['desktop', 'mobile'].includes(test.viewport)) throw new Error(`Test ${test.name} has an invalid viewport`);
  if (names.has(test.name)) throw new Error(`Duplicate test name: ${test.name}`);
  names.add(test.name);
}
if (tests.length < 5) throw new Error(`Expected at least five regression tests; found ${tests.length}`);
if (tests.filter(test => test.sanity === true).length !== 1) throw new Error('Exactly one regression test must be marked sanity: true');

const routes = [...backend.matchAll(/['"](GET|POST|PUT|PATCH|DELETE)\s+([^'"]+)['"]\s*:/g)]
  .map(match => ({ method: match[1], path: normalizePath(match[2]) }));
const calls = [...frontend.matchAll(/\bapi\.(get|post|put|patch|delete)\(\s*(['"`])([\s\S]*?)\2/g)]
  .map(match => ({ method: match[1].toUpperCase(), path: normalizePath(match[3]) }));
const missing = calls.filter(call => !routes.some(route => route.method === call.method && route.path === call.path));
if (missing.length) {
  throw new Error('Frontend calls without matching backend routes:\n' + missing.map(call => `- ${call.method} ${call.path}`).join('\n'));
}
console.log(`Contract check passed: ${tests.length} regression tests, ${routes.length} backend routes, ${calls.length} frontend API call patterns.`);

function normalizePath(path) {
  return path
    .replace(/\$\{[^}]+\}/g, ':param')
    .replace(/:[^/]+/g, ':param')
    .replace(/\/+$/, '') || '/';
}

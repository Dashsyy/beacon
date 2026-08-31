const fs = require('fs');
const path = require('path');

const PROJECT_MARKERS = ['.git', '.idea', 'composer.json', 'package.json', 'artisan'];
const SKIP_DIR_NAMES = new Set([
  'node_modules', 'vendor', '.git', '.idea', '.svn', '.hg',
  'dist', 'build', '.next', '.nuxt', 'target', '.venv', 'venv', '__pycache__',
]);
const MAX_DEPTH = 5;

function isProject(dirPath) {
  return PROJECT_MARKERS.some((marker) => fs.existsSync(path.join(dirPath, marker)));
}

function findProjectDirs(rootPath, onProgress) {
  if (isProject(rootPath)) return [rootPath];

  const results = [];

  function walk(currentPath, depth) {
    if (depth > MAX_DEPTH) return;
    if (onProgress) onProgress({ currentDir: currentPath, foundCount: results.length });

    let entries;
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      if (entry.name.startsWith('.') || SKIP_DIR_NAMES.has(entry.name)) continue;

      const fullPath = path.join(currentPath, entry.name);
      if (isProject(fullPath)) {
        results.push(fullPath);
        if (onProgress) onProgress({ currentDir: fullPath, foundCount: results.length });
      } else {
        walk(fullPath, depth + 1);
      }
    }
  }

  walk(rootPath, 0);
  return results;
}

module.exports = { findProjectDirs };

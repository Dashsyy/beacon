const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { findProjectDirs, ScanCancelledError } = require('../src/main/scanner.js');

function makeTree(relDirs) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'beacon-scan-test-'));
  for (const relDir of relDirs) {
    fs.mkdirSync(path.join(root, relDir), { recursive: true });
  }
  return root;
}

test('finds a project when the marker is directly at the chosen root', async () => {
  const root = makeTree(['.git']);
  const found = await findProjectDirs(root);
  assert.deepEqual(found, [root]);
});

test('finds projects nested under grouping folders that have no marker of their own', async () => {
  const root = makeTree(['FlatProject/.git', 'ClientA/ProjectX/.git', 'ClientA/ProjectY']);
  fs.writeFileSync(path.join(root, 'ClientA/ProjectY/composer.json'), '{}');

  const found = (await findProjectDirs(root)).sort();
  const expected = [
    path.join(root, 'ClientA/ProjectX'),
    path.join(root, 'ClientA/ProjectY'),
    path.join(root, 'FlatProject'),
  ].sort();
  assert.deepEqual(found, expected);
});

test('never descends into vendor or node_modules once a project is found', async () => {
  const root = makeTree(['ProjectA/vendor/somepkg']);
  fs.writeFileSync(path.join(root, 'ProjectA/composer.json'), '{}');
  fs.writeFileSync(path.join(root, 'ProjectA/vendor/somepkg/composer.json'), '{}');

  const found = await findProjectDirs(root);
  assert.deepEqual(found, [path.join(root, 'ProjectA')]);
});

test('ignores hidden and empty folders with no project markers', async () => {
  const root = makeTree(['.hidden', 'EmptyFolder']);
  const found = await findProjectDirs(root);
  assert.deepEqual(found, []);
});

test('cancellation stops the walk before it finishes', async () => {
  const root = makeTree(Array.from({ length: 10 }, (_, i) => `Project${i}/.git`));
  let seen = 0;

  await assert.rejects(
    findProjectDirs(root, {
      onProgress: () => {
        seen++;
      },
      isCancelled: () => seen >= 3,
    }),
    ScanCancelledError
  );
  assert.ok(seen < 10, 'should stop well before visiting every project');
});

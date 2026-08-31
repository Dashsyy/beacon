const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { installElectronMock } = require('./helpers/mock-electron');

const STORE_PATH = require.resolve('../src/main/store.js');

function freshStore() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'beacon-store-test-'));
  const uninstall = installElectronMock(tmpDir);
  delete require.cache[STORE_PATH];
  const store = require(STORE_PATH);
  return { store, tmpDir, uninstall };
}

test('addMany adds new projects with favorite/groups defaults and dedupes existing paths', () => {
  const { store, uninstall } = freshStore();
  try {
    let result = store.addMany(['/tmp/a', '/tmp/b']);
    assert.equal(result.addedCount, 2);
    assert.equal(result.projects.length, 2);
    assert.equal(result.projects[0].favorite, false);
    assert.deepEqual(result.projects[0].groups, []);

    result = store.addMany(['/tmp/a', '/tmp/c']);
    assert.equal(result.addedCount, 1, 'should skip the already-added /tmp/a');
    assert.equal(result.projects.length, 3);
  } finally {
    uninstall();
  }
});

test('toggleFavorite flips a project\'s favorite state', () => {
  const { store, uninstall } = freshStore();
  try {
    store.add('/tmp/x');
    let list = store.toggleFavorite('/tmp/x');
    assert.equal(list.find((p) => p.path === '/tmp/x').favorite, true);

    list = store.toggleFavorite('/tmp/x');
    assert.equal(list.find((p) => p.path === '/tmp/x').favorite, false);
  } finally {
    uninstall();
  }
});

test('setGroups replaces a project\'s group tags', () => {
  const { store, uninstall } = freshStore();
  try {
    store.add('/tmp/y');
    const list = store.setGroups('/tmp/y', ['ClientA', 'Laravel']);
    assert.deepEqual(list.find((p) => p.path === '/tmp/y').groups, ['ClientA', 'Laravel']);
  } finally {
    uninstall();
  }
});

test('remove deletes a project by path', () => {
  const { store, uninstall } = freshStore();
  try {
    store.addMany(['/tmp/a', '/tmp/b']);
    const list = store.remove('/tmp/a');
    assert.equal(list.length, 1);
    assert.equal(list[0].path, '/tmp/b');
  } finally {
    uninstall();
  }
});

test('list sorts projects alphabetically by name', () => {
  const { store, uninstall } = freshStore();
  try {
    store.addMany(['/tmp/zebra', '/tmp/apple']);
    const list = store.list();
    assert.deepEqual(list.map((p) => p.name), ['apple', 'zebra']);
  } finally {
    uninstall();
  }
});

test('backfills favorite/groups defaults for legacy entries missing those fields', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'beacon-store-test-'));
  const uninstall = installElectronMock(tmpDir);
  fs.writeFileSync(
    path.join(tmpDir, 'projects.json'),
    JSON.stringify([{ name: 'old', path: '/tmp/old' }])
  );
  delete require.cache[STORE_PATH];
  const store = require(STORE_PATH);
  try {
    const list = store.list();
    assert.equal(list[0].favorite, false);
    assert.deepEqual(list[0].groups, []);
  } finally {
    uninstall();
  }
});

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const STORE_PATH = path.join(app.getPath('userData'), 'projects.json');

function readAll() {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(projects) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(projects, null, 2), 'utf-8');
}

function list() {
  return readAll().sort((a, b) => a.name.localeCompare(b.name));
}

function add(projectPath) {
  return addMany([projectPath]).projects;
}

function addMany(projectPaths) {
  const projects = readAll();
  const existingPaths = new Set(projects.map((p) => p.path));
  let addedCount = 0;
  for (const projectPath of projectPaths) {
    if (existingPaths.has(projectPath)) continue;
    existingPaths.add(projectPath);
    projects.push({ name: path.basename(projectPath), path: projectPath });
    addedCount++;
  }
  if (addedCount > 0) writeAll(projects);
  return { projects: list(), addedCount };
}

function remove(projectPath) {
  const projects = readAll().filter((p) => p.path !== projectPath);
  writeAll(projects);
  return list();
}

module.exports = { list, add, addMany, remove };

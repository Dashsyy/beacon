const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const store = require('./store');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 600,
    minWidth: 360,
    minHeight: 400,
    title: 'Project Launcher',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('projects:list', () => store.list());

ipcMain.handle('projects:add', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { projects: store.list(), added: false };
  }
  const projects = store.add(result.filePaths[0]);
  return { projects, added: true };
});

ipcMain.handle('projects:remove', (_event, projectPath) => {
  return store.remove(projectPath);
});

ipcMain.handle('projects:scan', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'Choose a folder to scan for projects',
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { projects: store.list(), addedCount: 0, scanned: false };
  }

  const root = result.filePaths[0];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const subdirPaths = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => path.join(root, entry.name));

  const { projects, addedCount } = store.addMany(subdirPaths);
  return { projects, addedCount, scanned: true };
});

ipcMain.handle('projects:open', (_event, projectPath) => {
  return new Promise((resolve) => {
    let settled = false;
    const child = spawn('code', [projectPath], { detached: true, stdio: 'ignore' });
    child.on('error', () => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, error: `Could not find the "code" command. Open VS Code and run "Shell Command: Install 'code' command in PATH" from the Command Palette.` });
    });
    child.unref();
    setImmediate(() => {
      if (settled) return;
      settled = true;
      resolve({ ok: true });
    });
  });
});

ipcMain.handle('projects:reveal', (_event, projectPath) => {
  shell.showItemInFolder(projectPath);
});

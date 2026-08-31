# Beacon

A tiny macOS app for opening your projects in VS Code without `cd`-ing around in the terminal. Save a project once, then open it with a click (or a few keystrokes).

## Features

- **+ Add** (or the 📁 icon inside the filter box) — pick a single project folder via the native folder picker.
- **Scan** — pick a parent folder (e.g. `~/Projects`) and it recursively finds every real project inside it, however deep it's nested. A folder counts as a project if it contains `.git`, `.idea`, `composer.json`, `package.json`, or `artisan`. It never descends into `vendor/` or `node_modules/`. Scanning shows live progress and is cancelable, and found projects go through a checklist before anything is added.
- **Filter box** — type to narrow the list; press **Enter** to open the first match.
- **Favorites** — star a project; the Favorites tab shows only starred ones.
- **Groups** — tag a project with one or more labels (🏷️); the Groups tab sections the list by tag.
- **Reveal in Finder** (📂) — confirm a path before opening it.
- Click a project to open it in VS Code (`code <path>`). Click **✕** to remove it from the list.

## Requirements

- Node.js
- VS Code with the `code` shell command installed (Command Palette → "Shell Command: Install 'code' command in PATH")

## Usage

```bash
npm install
npm start
```

## Building a standalone app

```bash
npm run dist
```

Produces a `.dmg` in `dist/` you can drag into Applications and pin to the Dock.

## Data

Saved projects are stored as JSON in Electron's app-data directory (`~/Library/Application Support/beacon/projects.json`), not in this repo.

## Project structure

```
src/
  main/         Electron main process (Node, filesystem, IPC handlers)
    index.js    window creation, app lifecycle
    store.js    reads/writes projects.json
    scanner.js  recursive project-folder finder
  preload.js    the only bridge between main and renderer (contextBridge)
  renderer/     the UI (runs in a sandboxed browser context, no Node access)
    index.html
    renderer.js
    style.css
test/           unit tests for store.js and scanner.js
```

`store.js` and `scanner.js` are plain logic with no Electron-specific APIs beyond `app.getPath`, which is why they're the two modules covered by tests — `main/index.js` and `renderer.js` are mostly wiring and are exercised by hand (see the golden-path checklist below).

## Contributing

```bash
npm install
npm test    # runs the unit tests (test/) via Node's built-in test runner — no extra dependencies
npm start   # run the app itself
```

There's no test coverage for the Electron glue (window creation, IPC wiring, DOM rendering) — after any change, run the app and manually check: add a project, scan a folder, favorite/tag a project, and open a project in VS Code.

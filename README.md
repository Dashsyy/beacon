# Project Launcher

A tiny macOS app for opening your projects in VS Code without `cd`-ing around in the terminal. Save a project once, then open it with a click (or a few keystrokes).

## Features

- **+ Add** — pick a single project folder via the native folder picker.
- **Scan** — pick a parent folder (e.g. `~/PhpstormProjects`) and it recursively finds every real project inside it, however deep it's nested. A folder counts as a project if it contains `.git`, `.idea`, `composer.json`, `package.json`, or `artisan`. It never descends into `vendor/` or `node_modules/`.
- **Filter box** — type to narrow the list; press **Enter** to open the first match.
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

Saved projects are stored as JSON in Electron's app-data directory (`~/Library/Application Support/Project Launcher/projects.json`), not in this repo.

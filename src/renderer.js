const searchEl = document.getElementById('search');
const addBtn = document.getElementById('addBtn');
const scanBtn = document.getElementById('scanBtn');
const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');

let projects = [];

function currentFilter() {
  return searchEl.value.trim().toLowerCase();
}

function visibleProjects() {
  const q = currentFilter();
  if (!q) return projects;
  return projects.filter(
    (p) => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q)
  );
}

function render() {
  const items = visibleProjects();
  listEl.innerHTML = '';
  emptyEl.hidden = projects.length !== 0;

  for (const project of items) {
    const li = document.createElement('li');
    li.className = 'item';

    const info = document.createElement('div');
    info.className = 'item-info';

    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = project.name;

    const pathEl = document.createElement('div');
    pathEl.className = 'item-path';
    pathEl.textContent = project.path;

    info.appendChild(name);
    info.appendChild(pathEl);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'item-remove';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove from list';
    removeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      projects = await window.api.remove(project.path);
      render();
    });

    li.appendChild(info);
    li.appendChild(removeBtn);
    li.addEventListener('click', () => openProject(project.path));

    listEl.appendChild(li);
  }
}

async function openProject(projectPath) {
  const result = await window.api.open(projectPath);
  if (!result.ok) {
    alert(result.error);
  }
}

addBtn.addEventListener('click', async () => {
  const result = await window.api.add();
  projects = result.projects;
  render();
});

scanBtn.addEventListener('click', async () => {
  const originalLabel = scanBtn.textContent;
  scanBtn.textContent = 'Scanning…';
  scanBtn.disabled = true;
  try {
    const result = await window.api.scan();
    projects = result.projects;
    render();
    if (result.scanned) {
      alert(`Added ${result.addedCount} new project(s).`);
    }
  } finally {
    scanBtn.textContent = originalLabel;
    scanBtn.disabled = false;
  }
});

searchEl.addEventListener('input', render);

searchEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const items = visibleProjects();
    if (items.length > 0) openProject(items[0].path);
  }
});

(async () => {
  projects = await window.api.list();
  render();
})();

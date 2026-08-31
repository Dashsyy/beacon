const searchEl = document.getElementById('search');
const addBtn = document.getElementById('addBtn');
const scanBtn = document.getElementById('scanBtn');
const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');

const scanModal = document.getElementById('scanModal');
const scanModalTitle = document.getElementById('scanModalTitle');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const scanCandidateList = document.getElementById('scanCandidateList');
const scanCancelBtn = document.getElementById('scanCancelBtn');
const scanConfirmBtn = document.getElementById('scanConfirmBtn');

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
    if (!result.scanned) return;
    if (result.candidates.length === 0) {
      alert(
        result.alreadyAddedCount > 0
          ? `Found ${result.alreadyAddedCount} project(s) — all already in your list.`
          : 'No projects found in that folder.'
      );
      return;
    }
    openScanModal(result);
  } finally {
    scanBtn.textContent = originalLabel;
    scanBtn.disabled = false;
  }
});

function candidateCheckboxes() {
  return Array.from(scanCandidateList.querySelectorAll('input[type="checkbox"]'));
}

function updateSelectAllState() {
  const boxes = candidateCheckboxes();
  const allChecked = boxes.every((b) => b.checked);
  const noneChecked = boxes.every((b) => !b.checked);
  selectAllCheckbox.checked = allChecked;
  selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
}

function renderCandidates(candidates) {
  scanCandidateList.innerHTML = '';
  for (const candidate of candidates) {
    const li = document.createElement('li');

    const label = document.createElement('label');
    label.className = 'candidate-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.path = candidate.path;
    checkbox.addEventListener('change', updateSelectAllState);

    const info = document.createElement('div');
    info.className = 'candidate-info';

    const name = document.createElement('div');
    name.className = 'candidate-name';
    name.textContent = candidate.name;

    const pathEl = document.createElement('div');
    pathEl.className = 'candidate-path';
    pathEl.textContent = candidate.path;

    info.appendChild(name);
    info.appendChild(pathEl);
    label.appendChild(checkbox);
    label.appendChild(info);
    li.appendChild(label);
    scanCandidateList.appendChild(li);
  }
}

function openScanModal(result) {
  scanModalTitle.textContent =
    result.alreadyAddedCount > 0
      ? `Found ${result.candidates.length} new project(s) (${result.alreadyAddedCount} already added)`
      : `Found ${result.candidates.length} project(s)`;
  renderCandidates(result.candidates);
  selectAllCheckbox.checked = true;
  selectAllCheckbox.indeterminate = false;
  scanModal.hidden = false;
}

function closeScanModal() {
  scanModal.hidden = true;
  scanCandidateList.innerHTML = '';
}

selectAllCheckbox.addEventListener('change', () => {
  candidateCheckboxes().forEach((b) => {
    b.checked = selectAllCheckbox.checked;
  });
  selectAllCheckbox.indeterminate = false;
});

scanCancelBtn.addEventListener('click', closeScanModal);

scanConfirmBtn.addEventListener('click', async () => {
  const selectedPaths = candidateCheckboxes()
    .filter((b) => b.checked)
    .map((b) => b.dataset.path);
  closeScanModal();
  if (selectedPaths.length === 0) return;
  const result = await window.api.addPaths(selectedPaths);
  projects = result.projects;
  render();
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

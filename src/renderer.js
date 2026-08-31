const searchEl = document.getElementById('search');
const addBtn = document.getElementById('addBtn');
const scanBtn = document.getElementById('scanBtn');
const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));

const scanModal = document.getElementById('scanModal');
const scanProgressView = document.getElementById('scanProgressView');
const scanProgressDir = document.getElementById('scanProgressDir');
const scanProgressCount = document.getElementById('scanProgressCount');
const scanResultsView = document.getElementById('scanResultsView');
const scanModalTitle = document.getElementById('scanModalTitle');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const scanCandidateList = document.getElementById('scanCandidateList');
const scanCancelBtn = document.getElementById('scanCancelBtn');
const scanConfirmBtn = document.getElementById('scanConfirmBtn');

let projects = [];
let activeTab = 'all';

function currentFilter() {
  return searchEl.value.trim().toLowerCase();
}

function searchFilteredProjects() {
  const q = currentFilter();
  if (!q) return projects;
  return projects.filter(
    (p) => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q)
  );
}

function createProjectRow(project) {
  const li = document.createElement('li');
  li.className = 'item';

  const favoriteBtn = document.createElement('button');
  favoriteBtn.className = 'item-favorite' + (project.favorite ? ' active' : '');
  favoriteBtn.textContent = project.favorite ? '★' : '☆';
  favoriteBtn.title = project.favorite ? 'Unfavorite' : 'Favorite';
  favoriteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    projects = await window.api.toggleFavorite(project.path);
    render();
  });

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

  if (project.groups.length > 0) {
    const chips = document.createElement('div');
    chips.className = 'item-groups';
    for (const group of project.groups) {
      const chip = document.createElement('span');
      chip.className = 'group-chip';
      chip.textContent = group;
      chips.appendChild(chip);
    }
    info.appendChild(chips);
  }

  const groupsBtn = document.createElement('button');
  groupsBtn.className = 'item-reveal';
  groupsBtn.textContent = '🏷️';
  groupsBtn.title = 'Edit groups';
  groupsBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const input = prompt('Groups (comma-separated):', project.groups.join(', '));
    if (input === null) return;
    const groups = [...new Set(input.split(',').map((g) => g.trim()).filter(Boolean))];
    projects = await window.api.setGroups(project.path, groups);
    render();
  });

  const revealBtn = document.createElement('button');
  revealBtn.className = 'item-reveal';
  revealBtn.textContent = '📂';
  revealBtn.title = 'Reveal in Finder';
  revealBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.api.reveal(project.path);
  });

  const removeBtn = document.createElement('button');
  removeBtn.className = 'item-remove';
  removeBtn.textContent = '✕';
  removeBtn.title = 'Remove from list';
  removeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    projects = await window.api.remove(project.path);
    render();
  });

  const actions = document.createElement('div');
  actions.className = 'item-actions';
  actions.appendChild(groupsBtn);
  actions.appendChild(revealBtn);
  actions.appendChild(removeBtn);

  li.appendChild(favoriteBtn);
  li.appendChild(info);
  li.appendChild(actions);
  li.addEventListener('click', () => openProject(project.path));

  return li;
}

function createGroupHeader(label) {
  const li = document.createElement('li');
  li.className = 'group-header';
  li.textContent = label;
  return li;
}

function createEmptyTabMessage(text) {
  const li = document.createElement('li');
  li.className = 'tab-empty-msg';
  li.textContent = text;
  return li;
}

function render() {
  listEl.innerHTML = '';
  emptyEl.hidden = projects.length !== 0;
  if (projects.length === 0) return;

  const searched = searchFilteredProjects();

  if (activeTab === 'favorites') {
    const favorites = searched.filter((p) => p.favorite);
    if (favorites.length === 0) {
      listEl.appendChild(createEmptyTabMessage('No favorites yet — click the star on a project.'));
      return;
    }
    favorites.forEach((p) => listEl.appendChild(createProjectRow(p)));
    return;
  }

  if (activeTab === 'groups') {
    const groupNames = [...new Set(searched.flatMap((p) => p.groups))].sort((a, b) =>
      a.localeCompare(b)
    );
    const ungrouped = searched.filter((p) => p.groups.length === 0);

    if (groupNames.length === 0 && ungrouped.length === 0) {
      listEl.appendChild(createEmptyTabMessage('No groups yet — click 🏷️ on a project to tag it.'));
      return;
    }

    for (const groupName of groupNames) {
      listEl.appendChild(createGroupHeader(groupName));
      searched
        .filter((p) => p.groups.includes(groupName))
        .forEach((p) => listEl.appendChild(createProjectRow(p)));
    }

    if (ungrouped.length > 0) {
      listEl.appendChild(createGroupHeader('Ungrouped'));
      ungrouped.forEach((p) => listEl.appendChild(createProjectRow(p)));
    }
    return;
  }

  searched.forEach((p) => listEl.appendChild(createProjectRow(p)));
}

function visibleProjects() {
  if (activeTab === 'favorites') {
    return searchFilteredProjects().filter((p) => p.favorite);
  }
  return searchFilteredProjects();
}

async function openProject(projectPath) {
  const result = await window.api.open(projectPath);
  if (!result.ok) {
    alert(result.error);
  }
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
});

addBtn.addEventListener('click', async () => {
  const result = await window.api.add();
  projects = result.projects;
  render();
});

scanBtn.addEventListener('click', async () => {
  scanBtn.disabled = true;
  let progressStarted = false;
  const unsubscribe = window.api.onScanProgress((progress) => {
    if (!progressStarted) {
      progressStarted = true;
      showScanProgressView();
    }
    scanProgressDir.textContent = progress.currentDir;
    scanProgressCount.textContent = `Found: ${progress.foundCount}`;
  });
  try {
    const result = await window.api.scan();
    if (!result.scanned) {
      closeScanModal();
      return;
    }
    if (result.candidates.length === 0) {
      closeScanModal();
      alert(
        result.alreadyAddedCount > 0
          ? `Found ${result.alreadyAddedCount} project(s) — all already in your list.`
          : 'No projects found in that folder.'
      );
      return;
    }
    openScanModal(result);
  } finally {
    unsubscribe();
    scanBtn.disabled = false;
  }
});

function showScanProgressView() {
  scanProgressDir.textContent = '';
  scanProgressCount.textContent = 'Found: 0';
  scanProgressView.hidden = false;
  scanResultsView.hidden = true;
  scanModal.hidden = false;
}

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
    li.className = 'candidate-item';

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

    const revealBtn = document.createElement('button');
    revealBtn.className = 'item-reveal';
    revealBtn.textContent = '📂';
    revealBtn.title = 'Reveal in Finder';
    revealBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.api.reveal(candidate.path);
    });

    li.appendChild(checkbox);
    li.appendChild(info);
    li.appendChild(revealBtn);
    li.addEventListener('click', (e) => {
      if (e.target === checkbox || e.target === revealBtn) return;
      checkbox.checked = !checkbox.checked;
      updateSelectAllState();
    });

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
  scanProgressView.hidden = true;
  scanResultsView.hidden = false;
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

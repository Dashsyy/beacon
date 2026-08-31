const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  list: () => ipcRenderer.invoke('projects:list'),
  add: () => ipcRenderer.invoke('projects:add'),
  scan: () => ipcRenderer.invoke('projects:scan'),
  addPaths: (paths) => ipcRenderer.invoke('projects:addPaths', paths),
  remove: (projectPath) => ipcRenderer.invoke('projects:remove', projectPath),
  open: (projectPath) => ipcRenderer.invoke('projects:open', projectPath),
  reveal: (projectPath) => ipcRenderer.invoke('projects:reveal', projectPath),
});

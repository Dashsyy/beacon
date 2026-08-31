const Module = require('module');

const MOCK_ID = '__beacon_test_mock_electron__';

// store.js does `require('electron')` to find its data directory via
// app.getPath(). Under plain Node (no Electron runtime), requiring
// 'electron' just returns the path to the binary, not the real API, so
// tests need to substitute a fake module before store.js is loaded.
function installElectronMock(userDataPath) {
  const originalResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, ...args) {
    if (request === 'electron') return MOCK_ID;
    return originalResolve.call(this, request, ...args);
  };
  require.cache[MOCK_ID] = {
    id: MOCK_ID,
    filename: MOCK_ID,
    loaded: true,
    exports: { app: { getPath: () => userDataPath } },
  };

  return function uninstall() {
    Module._resolveFilename = originalResolve;
    delete require.cache[MOCK_ID];
  };
}

module.exports = { installElectronMock };

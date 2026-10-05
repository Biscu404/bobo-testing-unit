/* Sandboxed preload (must be CommonJS). The renderer gets this tiny, explicit
   surface and nothing else; apps still only ever see ctx. */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('holytron', Object.freeze({
  version: ipcRenderer.sendSync('holytron:version'),
  quit: () => ipcRenderer.send('holytron:quit'),
}));

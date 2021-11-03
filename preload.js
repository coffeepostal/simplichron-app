// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer)

// Create API connections between Electron and renderer.js
contextBridge.exposeInMainWorld('api', {
	onJSONReturn: (fn) => {
		ipcRenderer.on('db:return', (event, ...args) => fn(...args))
	},
})

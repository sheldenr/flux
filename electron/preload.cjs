const { contextBridge } = require('electron')

// Keep the renderer isolated from Node/Electron APIs.
contextBridge.exposeInMainWorld('kindredDesktop', { isDesktop: true })

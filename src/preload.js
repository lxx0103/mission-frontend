// src/preload.js

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, ...arg) => {
       return ipcRenderer.send(channel, ...arg)
    },
    sendSync: (channel, ...arg) => {
        return ipcRenderer.sendSync(channel, ...arg)
    },    
    on: (channel, listener) => {
        ipcRenderer.on(channel, (event, ...args) => listener(...args))
    }
  })
// preload.js
const { contextBridge, ipcRenderer } = require('electron')
// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
contextBridge.exposeInMainWorld(
  "api", {
  send: (channel, data) => {
      // whitelist channels
      let validChannels = ["runCrawl"];
      if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
      }
  },
  receive: (channel, func) => {
      let validChannels = ["notification-error", "notification-running"];
      if (validChannels.includes(channel)) {
          // Deliberately strip event as it includes `sender` 
          ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
  },
}
);
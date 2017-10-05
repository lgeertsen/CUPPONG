const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const {ipcMain} = require('electron')

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let secondWindow

function createWindow () {
  const width = electron.screen.getPrimaryDisplay().workAreaSize.width
  const height = electron.screen.getPrimaryDisplay().workAreaSize.height

  let displays = electron.screen.getAllDisplays()
  let externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  })

  // if (externalDisplay) {
  if(true) {
    secondWindow = new BrowserWindow({
      width: width,
      height: height,
      // x: externalDisplay.bounds.x,
      // y: externalDisplay.bounds.y,
      closable: false,
      // focusable: false,
      // fullscreen: true,
      // frame: false,
      // skipTaskbar: true,
      icon: path.join(__dirname, 'icons/png/cupPong_128x128.png')
    })
    secondWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'second.html'),
      protocol: 'file:',
      slashes: true
    }))
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 800,
    minHeigth: 600,
    icon: path.join(__dirname, 'icons/png/cupPong_128x128.png')
  })
  mainWindow.maximize();
  mainWindow.setMenu(null);
  //secondWindow.setMenu(null);

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
  // secondWindow.webContents.openDevTools()

  ipcMain.on('createTables', (event, data) => {
    secondWindow.webContents.send('createTables', data)
  })

  ipcMain.on('startGames', (event, data) => {
    secondWindow.webContents.send('startGames', data)
  })

  ipcMain.on('waitingList', (event, data) => {
    secondWindow.webContents.send('waitingList', data)
  })

  ipcMain.on('finishGame', (event, data) => {
    secondWindow.webContents.send('finishGame', data)
  })

  ipcMain.on('finishDelete', (event, data) => {
    secondWindow.webContents.send('finishDelete', data)
  })

  ipcMain.on('champions', (event, data) => {
    secondWindow.webContents.send('champions', data)
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
    if (secondWindow != null) {
      secondWindow.close()
      secondWindow.destroy()
    }
  })

  secondWindow.on('closed', function() {
      secondWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

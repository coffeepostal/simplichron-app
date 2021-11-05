// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Tray } = require('electron')
const fs = require('fs')
const path = require('path')
const storage = require('electron-json-storage')

// Define mainWindow
let mainWindow

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1280, // 1730 for DEV tools
		height: 720,
		webPreferences: {
			preload: path.join(app.getAppPath(), 'preload.js'),
		},
		icon: path.join(__dirname, 'images/logo.png'),
	})

	// and load the index.html of the app.
	mainWindow.loadFile('index.html')

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	// Add tray icon
	const appIcon = new Tray('./images/logo.png')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow()

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process code. You can also put them in separate files and require them here.

//--------------------------//
// JSON Storage	           	//
//--------------------------//
let jsonStorage

//--------------------------//
// ipc Requests	           	//
//--------------------------//

// Define file name
const userDataPath = app.getPath('userData')
const jsonFile = `${userDataPath}/data/data.json`

// Add Tasks
ipcMain.on('db:send', (event, dataset) => {

	storage.set(jsonFile, dataset, function (error) {
		if (error) throw error;
	});
})

// Get Database
ipcMain.on('db:get', (event, dataset) => {

	// Read the JSON file
	storage.get(jsonFile, function (error, data) {
		if (error) throw error

		// Send returned JSON data to mainWindow
		mainWindow.webContents.send('db:return', data)
	})
})
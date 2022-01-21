'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import {db} from './backend/db.js'
// import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const path = require('path');
const fs = require('fs');
const isDevelopment = process.env.NODE_ENV !== 'production'
const XLSX = require('xlsx'); 

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 1440,
        height: 900,
        webPreferences: {
        
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
        enableRemoteModule: true,
        preload: path.join(__dirname, 'preload.js')
        }
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        win.loadURL('app://./index.html')
    }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    // if (isDevelopment && !process.env.IS_TEST) {
    //   // Install Vue Devtools
    //   try {
    //     await installExtension(VUEJS_DEVTOOLS)
    //   } catch (e) {
    //     console.error('Vue Devtools failed to install:', e.toString())
    //   }
    // }
    createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

ipcMain.on('getUserList', (e, filter) => {
    const stmt = db.prepare('SELECT * FROM `users` WHERE name like ?');
    const rows = stmt.all('%' + filter + '%');
    e.returnValue = rows
})
ipcMain.on('saveUser', (e, params) => {
    console.log(params)
    if (!Number.isInteger(params.userID)) {
        e.returnValue = '用户ID错误'
        return
    }
    if ( params.userName == '') {
        e.returnValue = '用户姓名不能为空'
        return
    }
    if ( params.userStatus != '启用' && params.userStatus != '禁用') {
        e.returnValue = '用户状态错误'
        return
    }
    let exist = 0

    if (params.userID !=0 ) {
        exist  = db.prepare('SELECT count(1) FROM `users` WHERE name = ? AND id != ?').pluck().get(params.userName, params.userID)
    } else {
        exist = db.prepare('SELECT count(1) FROM `users` WHERE name = ? ').pluck().get(params.userName)
    }
    if ( exist != 0 ) {
        e.returnValue = '用户名已存在'
        return
    }
    if (params.userID != 0) {
        db.prepare('UPDATE `users` set name = ?, type = ?, status = ? WHERE id = ?').run(params.userName, params.userType, params.userStatus, params.userID)
    } else {
        db.prepare('INSERT INTO `users` (name, type, status) values (?,?,?)').run(params.userName, params.userType, params.userStatus)
    }
    e.returnValue = '成功'
})


ipcMain.on('getMissionsList', (e, filter) => {
    const stmt = db.prepare('SELECT * FROM `users` WHERE name like ?');
    const rows = stmt.all('%' + filter + '%');
    e.returnValue = rows
})

ipcMain.on('uploadExcel', (e, params) => {
    fs.copyFileSync(params.path, './'+params.name)
    let workbook = XLSX.readFile('./'+params.name)
    let sheetNames = workbook.SheetNames;
    let worksheet = workbook.Sheets[sheetNames[0]]
    let codeCell = getCodeCell(worksheet)
    let nameCell = getNameCell(worksheet)
    console.log(codeCell)
    console.log(nameCell)
    e.returnValue = 'codeColumn'
})

function getCodeCell(sheet) {
    let range = XLSX.utils.decode_range(sheet['!ref']);
    let codeColumn = 0;
    let codeRow = 0;
    for(var rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
        for(var colNum=range.s.c; colNum<=range.e.c; colNum++){
            var nextCell = sheet[
                XLSX.utils.encode_cell({r: rowNum, c: colNum})
            ];
            if( typeof nextCell === 'undefined' ){
                break
            } else {
                console.log(nextCell)
                if ((nextCell.w).includes('社会信用代码') || (nextCell.w).includes('纳税人识别号')){
                    codeColumn = colNum
                    codeRow = rowNum
                }
            }
        }
    }
    return {r:codeRow, c:codeColumn}
}


function getNameCell(sheet) {
    let range = XLSX.utils.decode_range(sheet['!ref']);
    let nameColumn = 0;
    let nameRow = 0;
    for(var rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
        for(var colNum=range.s.c; colNum<=range.e.c; colNum++){
            var nextCell = sheet[
                XLSX.utils.encode_cell({r: rowNum, c: colNum})
            ];
            if( typeof nextCell === 'undefined' ){
                break
            } else {
                console.log(nextCell)
                if ((nextCell.w).includes('纳税人名称')){
                    nameColumn = colNum
                    nameRow = rowNum
                }
            }
        }
    }
    return {r:nameRow, c:nameColumn}
}
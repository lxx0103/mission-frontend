'use strict'

import { count } from 'console';
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
    let sql = 'SELECT m.* , (m.excel_sheet+1) as real_sheet, e.name as excel_name  FROM `missions` m LEFT JOIN `excels` e ON m.excel_id = e.id WHERE 1=1 '
    if (filter.excel_id != 0 ) {
        sql += ' AND m.excel_id = @excel_id '
    }
    if (filter.name != '') {
        sql += ' AND ( m.name like @name OR m.code like @code )'
    }
    if (filter.assigned != '') {
        sql += ' AND m.assigned like @assigned '
    }
    if (filter.from != '') {
        sql += ' AND e.date >= @from '
    }
    if (filter.to != '') {
        sql += ' AND e.date <= @to '
    }
    const stmt = db.prepare(sql);
    let where = {excel_id: filter.excel_id, name: '%'+filter.name+'%', code: '%'+filter.name+'%', assigned: '%'+filter.assigned+'%', from: filter.from, to: filter.to}
    const rows = stmt.all(where);
    e.returnValue = rows
})
ipcMain.on('getExcelsList', (e, filter) => {
    const stmt = db.prepare('SELECT * FROM `excels` WHERE name like ?');
    const rows = stmt.all('%' + filter + '%');
    e.returnValue = rows
})

ipcMain.on('uploadExcel', (e, params) => {
    let exist  = db.prepare('SELECT count(1) FROM `excels` WHERE name = ?').pluck().get(params.name)
    if ( exist != 0 ) {
        e.returnValue = '同名EXCEL已存在，请重新命名后上传'
        return
    }
    fs.copyFileSync(params.path, './excels/'+params.name)
    let workbook = XLSX.readFile('./excels/'+params.name)
    let sheetNames = workbook.SheetNames;
    let rows = []
    for (var a = 0; a < sheetNames.length; a++){
        let worksheet = workbook.Sheets[sheetNames[a]]
        let codeCell = getCodeCell(worksheet)
        let nameCell = getNameCell(worksheet)
        if (codeCell == 0) {
            e.returnValue = '第' + (a+1) + '个SHEET没有找到“纳税人识别号/社会信用代码”'
            return
        }
        if (nameCell == 0) {
            e.returnValue = '第' + (a+1) + '个SHEET没有找到“纳税人名称”'
            return
        }
        if (nameCell.r != codeCell.r) {
            e.returnValue = '第' + (a+1) + '个SHEET表头错误'
            return
        }        
        let range = XLSX.utils.decode_range(worksheet['!ref']);
        for (var currentRow = nameCell.r + 1 ; currentRow <= range.e.r; currentRow ++ ) {
            let currentCodeCell = worksheet[
                XLSX.utils.encode_cell({r: currentRow, c: codeCell.c})
            ]
            let currentNameCell = worksheet[
                XLSX.utils.encode_cell({r: currentRow, c: nameCell.c})
            ]
            if(currentNameCell == undefined || currentCodeCell == undefined){
                continue
            }
            rows.push({excel_sheet: a, excel_row: currentRow+1, code: currentCodeCell.w, name: currentNameCell.w })
        }
    }
    let today = (new Date()).toISOString().split('T')[0];
    let excel_id = db.prepare("INSERT INTO excels (name , date , path) values (?, ?, ?)").run(params.name, today, './excels/'+params.name)
    const insertMission = db.prepare("INSERT INTO missions (excel_id, excel_sheet, excel_row, code, name) values ("+excel_id.lastInsertRowid+", @excel_sheet, @excel_row, @code, @name)");
    const insertMany = db.transaction((cats) => {
        for (const cat of cats) insertMission.run(cat);
    });
    insertMany(rows);
    assignMission(params.type)
    let newPath = './excels/已分配-' + params.name
    
    for (var b = 0; b < sheetNames.length; b++){
        let worksheet = workbook.Sheets[sheetNames[b]]
        let codeCell = getCodeCell(worksheet)
        let range = XLSX.utils.decode_range(worksheet['!ref']);
        
        const stmt = db.prepare('SELECT * FROM `missions` WHERE excel_id = ? AND excel_sheet = ?');
        const newRows = stmt.all(excel_id.lastInsertRowid, b);
        console.log(newRows)
        XLSX.utils.sheet_add_aoa(worksheet, [['负责人']], {origin:XLSX.utils.encode_cell({r: codeCell.r, c: range.e.c + 1})})
        for (var i = 0; i < newRows.length; i++){
            XLSX.utils.sheet_add_aoa(worksheet, [[newRows[i].assigned]], {origin:XLSX.utils.encode_cell({r: newRows[i].excel_row-1, c: range.e.c + 1})})
        }    
    }
    XLSX.writeFile(workbook, newPath)
    e.returnValue = ['成功', '已分配-'+params.name]
})


function getCodeCell(sheet) {
    let range = XLSX.utils.decode_range(sheet['!ref']);
    let codeColumn = 0;
    let codeRow = 0;
    for(var rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
        for(var colNum = range.s.c; colNum <= range.e.c; colNum++){
            var nextCell = sheet[
                XLSX.utils.encode_cell({r: rowNum, c: colNum})
            ];
            console.log(nextCell)
            if( typeof nextCell === 'undefined' ){
                continue
            } else {
                if ((nextCell.w).includes('社会信用代码') || (nextCell.w).includes('纳税人识别号')){
                    codeColumn = colNum
                    codeRow = rowNum
                    return {r:codeRow, c:codeColumn}
                }
            }
        }
    }
    return 0
}

function getNameCell(sheet) {
    let range = XLSX.utils.decode_range(sheet['!ref']);
    let nameColumn = 0;
    let nameRow = 0;
    for(var rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
        for(var colNum = range.s.c; colNum <= range.e.c; colNum++){
            var nextCell = sheet[
                XLSX.utils.encode_cell({r: rowNum, c: colNum})
            ];
            if( typeof nextCell === 'undefined' ){
                break
            } else {
                if ((nextCell.w).includes('纳税人名称')){
                    nameColumn = colNum
                    nameRow = rowNum
                    return {r:nameRow, c:nameColumn}
                }
            }
        }
    }
    return 0
}

function assignMission(type) {
    let hasMore = true
    while (hasMore) {
        let nextMission = getNextMission()
        if (nextMission == undefined ){
            hasMore = false
        } else {
            let nextUser = getNextUser(type)
            let sameCode = getSameCode(nextMission.excel_id, nextMission.code)
            if (sameCode == undefined){
                db.prepare('UPDATE missions SET assigned = ? WHERE id = ?').run(nextUser, nextMission.id)
            } else {
                db.prepare('UPDATE missions SET assigned = ?, sameas = ? WHERE id = ?').run(sameCode, 'YES', nextMission.id)
            }
        }
    }

}

function getNextUser(userType){
    let lastUserID =  db.prepare('SELECT u.ID FROM `missions` m LEFT JOIN `users` u on m.assigned = u.name WHERE m.assigned != ? AND m.sameas = ? AND u.type = ? ORDER BY m.id DESC LIMIT 1').pluck().get('', 'NO', userType)
    let nextUserName = ''
    if (lastUserID==undefined) {//没有分配过任务
        nextUserName = db.prepare('SELECT name FROM `users` WHERE type = ? and status = ? ORDER BY id ASC LIMIT 1').pluck().get(userType, '启用')
    } else {
        nextUserName = db.prepare('SELECT name FROM `users` WHERE type = ? and status = ? AND id > ? ORDER BY id ASC LIMIT 1').pluck().get(userType, '启用', lastUserID)
        if(nextUserName == undefined ) {
            nextUserName = db.prepare('SELECT name FROM `users` WHERE type = ? and status = ? ORDER BY id ASC LIMIT 1').pluck().get(userType, '启用')
        }
    }
    return nextUserName
}

function getNextMission() {
    let nextMission =  db.prepare('SELECT * FROM `missions` WHERE `assigned` = ? ORDER BY id ASC LIMIT 1').get('')
    return nextMission
}

ipcMain.on('getTargetList', (e, filter) => {
    const stmt = db.prepare('SELECT * FROM `targets` WHERE code like ?');
    const rows = stmt.all('%' + filter + '%');
    e.returnValue = rows
})
ipcMain.on('getSPUsers', (e, filter) => {
    const stmt = db.prepare('SELECT * FROM `users` WHERE type = ? AND name like ?');
    const rows = stmt.all('重点税源、特殊税源管事组', '%' + filter + '%');
    e.returnValue = rows
})

ipcMain.on('saveTarget', (e, params) => {
    console.log(params)
    if (!Number.isInteger(params.targetID)) {
        e.returnValue = 'ID错误'
        return
    }
    if ( params.code == '') {
        e.returnValue = '纳税人编号不能为空'
        return
    }
    if ( params.name == '') {
        e.returnValue = '纳税人名称不能为空'
        return
    }
    let exist = 0

    if (params.targetID !=0 ) {
        exist  = db.prepare('SELECT count(1) FROM `targets` WHERE code = ? AND id != ?').pluck().get(params.code, params.targetID)
    } else {
        exist = db.prepare('SELECT count(1) FROM `targets` WHERE code = ? ').pluck().get(params.code)
    }
    if ( exist != 0 ) {
        e.returnValue = '纳税人编号已存在'
        return
    }
    if (params.targetID != 0) {
        db.prepare('UPDATE `targets` set code = ?, name = ? WHERE id = ?').run(params.code, params.name, params.targetID)
    } else {
        db.prepare('INSERT INTO `targets` (code, name) values (?, ?)').run(params.code, params.name)
    }
    e.returnValue = '成功'
})

function checkSP(code) {    
    let name  = db.prepare('SELECT `id` FROM `targets` WHERE code = ?').pluck().get(code)
    return name
}


function getSameCode(excel_id, code) {
    let name  = db.prepare('SELECT assigned FROM `missions` WHERE excel_id = ? AND code = ? AND assigned != ? ').pluck().get(excel_id, code, '')
    return name
}


ipcMain.on('uploadSPExcel', (e, params) => {
    let workbook = XLSX.readFile(params.path)
    let sheetNames = workbook.SheetNames;
    let worksheet = workbook.Sheets[sheetNames[0]]
    var codeCell = worksheet[
        XLSX.utils.encode_cell({r: 0, c: 0})
    ];
    if (!(codeCell.w).includes('社会信用代码') && !(codeCell.w).includes('纳税人识别号')){        
        e.returnValue ='表头错误,第一行第一列应为社会信用代码/纳税人识别号'
        return
    }
    var nameCell = worksheet[
        XLSX.utils.encode_cell({r: 0, c: 1})
    ];
    if (!(nameCell.w).includes('纳税人名称')){        
        e.returnValue ='表头错误,第一行第二列应为纳税人名称'
        return
    }
    // let today = (new Date()).toISOString().split('T')[0];
    // let excel_id = db.prepare("INSERT INTO excels (name , date , path) values (?, ?, ?)").run(params.name, today, './excels/'+params.name)
    let rows = []
    let range = XLSX.utils.decode_range(worksheet['!ref']);
    for (var currentRow = 1 ; currentRow <= range.e.r; currentRow ++ ) {
        let currentCodeCell = worksheet[
            XLSX.utils.encode_cell({r: currentRow, c: 0})
        ]
        let currentNameCell = worksheet[
            XLSX.utils.encode_cell({r: currentRow, c: 1})
        ]
        let codeExist = 0
        codeExist = db.prepare('SELECT count(1) FROM `targets` WHERE code = ? ').pluck().get(currentCodeCell.w)
        if (codeExist != 0 ){
            e.returnValue = '第'+(currentRow+1)+'行的纳税人识别号已经存在,请勿重复添加'
            return
        }
        rows.push({code:currentCodeCell.w, name:currentNameCell.w})
    }
    const insert = db.prepare('INSERT INTO targets (name , code ) VALUES (@name, @code)');
    const insertMany = db.transaction((cats) => {
        for (const cat of cats) insert.run(cat);
    });
    insertMany(rows);
    e.returnValue = ['成功', '已分配-'+params.name]
})


ipcMain.on('expMissionsList', (e, filter) => {
    let sql = 'SELECT e.date as 导入日期, e.name as Excel名称, (m.excel_sheet+1) as Sheet编号, m.code as 纳税人识别号, m.name as 纳税人名称, m.assigned as 负责人  FROM `missions` m LEFT JOIN `excels` e ON m.excel_id = e.id WHERE 1=1 '
    if (filter.excel_id != 0 ) {
        sql += ' AND m.excel_id = @excel_id '
    }
    if (filter.name != '') {
        sql += ' AND ( m.name like @name OR m.code like @code )'
    }
    if (filter.assigned != '') {
        sql += ' AND m.assigned like @assigned '
    }
    if (filter.from != '') {
        sql += ' AND e.date >= @from '
    }
    if (filter.to != '') {
        sql += ' AND e.date <= @to '
    }
    const stmt = db.prepare(sql);
    let where = {excel_id: filter.excel_id, name: '%'+filter.name+'%', code: '%'+filter.name+'%', assigned: '%'+filter.assigned+'%', from: filter.from, to: filter.to}
    const rows = stmt.all(where);
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '分配历史')
    var currentdate = new Date(); 
    var datetime = currentdate.getFullYear() + "-"
                + (currentdate.getMonth()+1)  + "-" 
                + currentdate.getDate()
                + currentdate.getHours()
                + currentdate.getMinutes() 
                + currentdate.getSeconds();
    var path = 'excels/分配历史导出-'+datetime+'.xlsx'
    XLSX.writeFile(wb, path)
    e.returnValue = path
    return
})
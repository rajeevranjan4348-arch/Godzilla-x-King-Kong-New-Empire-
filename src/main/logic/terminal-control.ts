// @ts-nocheck
import { IpcMain, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';

export default function registerSystemControl(ipcMain: IpcMain) {
  ipcMain.handle('run-shell-command', async (_event, { command, cwd }) => {
    return new Promise((resolve) => {
      const safeCwd = cwd ? path.normalize(cwd).replace(/[\/\\]$/, '') : undefined
      const win = BrowserWindow.getAllWindows()[0]
      const child = spawn('powershell.exe', ['-Command', command], { cwd: safeCwd, stdio: ['ignore', 'pipe', 'pipe'] })
      
      child.stdout.on('data', (data) => {
        win?.webContents.send('terminal-data', data.toString())
      })
      
      child.stderr.on('data', (data) => {
        win?.webContents.send('terminal-data', `\x1b[31m${data.toString()}\x1b[0m`) // red stderr
      })
      
      child.on('close', (code) => {
        win?.webContents.send('terminal-data', `\r\n[Process exited with code ${code}]\r\n`)
        resolve({ success: code === 0, output: `Completed with code ${code}` })
      })
    })
  })
}

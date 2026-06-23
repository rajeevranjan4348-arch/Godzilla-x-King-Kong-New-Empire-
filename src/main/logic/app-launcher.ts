// @ts-nocheck
import { IpcMain, BrowserWindow } from 'electron';
import { exec, spawn } from 'child_process';

const APP_ALIASES: Record<string, string> = {
  vscode: 'code', terminal: 'wt', cmd: 'start cmd', chrome: 'start chrome', edge: 'start msedge',
  whatsapp: 'start whatsapp:', discord: 'Update.exe --processStart Discord.exe',
  spotify: 'start spotify:', steam: 'start steam:', notepad: 'notepad', calculator: 'calc',
  settings: 'start ms-settings:', explorer: 'explorer', 'task manager': 'taskmgr',
  camera: 'start microsoft.windows.camera:', // ...and more
}
const PROTECTED_PROCESSES = [
  'explorer.exe','dwm.exe','svchost.exe','lsass.exe',
  'csrss.exe','wininit.exe','winlogon.exe','services.exe', 'taskmgr.exe','system','registry'
]

function executeCommand(command: string, appName: string, resolve: any) {
  exec(command, (error) => {
    resolve(error ? { success: false, error: error.message } : { success: true, message: `Opened ${appName}` });
  });
}

export default function registerAppLauncher(ipcMain: IpcMain) {
  ipcMain.removeHandler('open-app')
  ipcMain.handle('open-app', async (_event, appName: string) => {
    return new Promise((resolve) => {
      const lowerName = appName.toLowerCase().trim()
      const command = APP_ALIASES[lowerName]
      if (command) {
        executeCommand(command, appName, resolve)
      } else {
        launchViaPowerShell(appName, resolve) // fallback
      }
    })
  })
  
  ipcMain.removeHandler('close-app')
  ipcMain.handle('close-app', async (_event, appName: string) => {
    return new Promise((resolve) => {
      // Assuming PROCESS_NAMES is defined somewhere, we'll mock it
      const PROCESS_NAMES: Record<string, string> = {};
      let processName = PROCESS_NAMES[appName.toLowerCase().trim()] ?? (appName.endsWith('.exe') ? appName : `${appName}.exe`)
      if (PROTECTED_PROCESSES.includes(processName.toLowerCase())) {
        resolve({ success: false, error: `Security: cannot close system-critical '${appName}'.` })
        return
      }
      exec(`taskkill /IM "${processName}" /F /T`, (error) => {
        resolve(error ? { success: false, error: `Could not close ${appName}.` } : { success: true, message: `Terminated ${appName}` })
      })
    })
  })
}

function launchViaPowerShell(appName: string, resolve: any) {
  const psCommand = `powershell -Command "Get-StartApps | ` + `Where-Object { $_.Name -like '*${appName}*' } | ` + `Select-Object -First 1 -ExpandProperty AppID"`
  exec(psCommand, (error, stdout) => {
    const appId = stdout.trim()
    if (appId) {
      exec(`start explorer "shell:AppsFolder\\${appId}"`, (launchErr) => {
        resolve(launchErr ? { success: false, error: launchErr.message } : { success: true, message: `Opened ${appName} via System Search` })
      })
    } else {
      resolve({ success: false, error: `Could not find '${appName}' on this system.` })
    }
  })
}

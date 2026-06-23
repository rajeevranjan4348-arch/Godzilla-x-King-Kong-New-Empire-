// @ts-nocheck
import { app, BrowserWindow, ipcMain, screen, desktopCapturer } from 'electron';
import { exec } from 'child_process';
import path from 'path';

const APP_MAP: Record<string, string> = {
  spotify: 'spotify',
  vscode: 'code',
  chrome: 'google-chrome',
  whatsapp: 'whatsapp',
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true },
  });
  win.loadURL(process.env.VITE_DEV_SERVER_URL || `file://${path.join(__dirname, '../dist/index.html')}`);
}

ipcMain.handle('iris:openApp', (_e, name: string) => {
  const cmd = APP_MAP[name.toLowerCase()];
  if (!cmd) return { ok: false, error: 'Unknown app' };
  const opener = process.platform === 'darwin' ? `open -a "${cmd}"` :
                 process.platform === 'win32' ? `start ${cmd}` : cmd;
  exec(opener);
  return { ok: true };
});

ipcMain.handle('iris:screenshot', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  if (sources.length > 0) {
    return sources[0].thumbnail.toDataURL();
  }
  return null;
});

app.whenReady().then(createWindow);

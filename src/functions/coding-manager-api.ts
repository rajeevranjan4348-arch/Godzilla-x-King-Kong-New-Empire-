// @ts-nocheck
const activateCodingMode = async () => {
  await (window as any).electron.ipcRenderer.invoke('set-volume', 80)
  await (window as any).electron.ipcRenderer.invoke('open-app', 'vscode')
  await (window as any).electron.ipcRenderer.invoke('google-search', 'https://www.youtube.com/results?search_query=lofi+chill+radio+live')
  await new Promise(r => setTimeout(r, 6000))
  try {
    const screen = await (window as any).electron.ipcRenderer.invoke('get-screen-size')
    await (window as any).electron.ipcRenderer.invoke('ghost-click-coordinate', { x: Math.round(screen.width * 0.35), y: Math.round(screen.height * 0.3) })
  } catch {
    await (window as any).electron.ipcRenderer.invoke('ghost-sequence', [{ type: 'click' }])
  }
  return 'Coding Mode Active: Volume 80%, VS Code Open, Lofi Playing.'
}

const runTerminal = async (command: string, path?: string) => {
  const res = await (window as any).electron.ipcRenderer.invoke('run-shell-command', { command, cwd: path })
  return res.success ? `Output:\n${res.output}` : `Failed:\n${res.output}`
}

const openInVsCode = async (path: string) => {
  const res = await (window as any).electron.ipcRenderer.invoke('open-in-vscode', path)
  return res.success ? 'Opened in VS Code.' : 'Failed.'
}

export { activateCodingMode, runTerminal, openInVsCode }

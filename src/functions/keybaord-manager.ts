// @ts-nocheck
const setVolume = async (level: number) => (window as any).electron.ipcRenderer.invoke('set-volume', level)
const takeScreenshot = async () => (window as any).electron.ipcRenderer.invoke('take-screenshot')
const getScreenSize = async () => (window as any).electron.ipcRenderer.invoke('get-screen-size')

const clickOnCoordinate = async (x: number, y: number) => {
  await (window as any).electron.ipcRenderer.invoke('ghost-click-coordinate', { x, y })
  return `Clicked on (${x}, ${y})`
}

const scrollScreen = async (direction: 'up' | 'down', amount: number) => {
  await (window as any).electron.ipcRenderer.invoke('ghost-scroll', { direction, amount })
  return `Scrolled ${direction}.`
}

const pressShortcut = async (key: string, modifiers: string[]) => {
  await (window as any).electron.ipcRenderer.invoke('ghost-sequence', [{ type: 'press', key, modifiers }])
  return `Pressed ${modifiers.join('+')}+${key}`
}

export { setVolume, takeScreenshot, getScreenSize, clickOnCoordinate, scrollScreen, pressShortcut }

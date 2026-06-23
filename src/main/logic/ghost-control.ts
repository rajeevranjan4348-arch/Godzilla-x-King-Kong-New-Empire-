// @ts-nocheck
import { ipcMain, clipboard, screen, shell } from 'electron';
import { Key, Point, mouse, keyboard, Button, straightTo } from '@nut-tree-fork/nut-js';
import * as path from 'path';
import { app } from 'electron';

// Need a mock screenshot function since it's not imported in the snippet
const screenshot = async (options: any) => {};
const loudness = { setVolume: async (level: number) => {} };

const KEY_MAP: Record<string, Key> = {
  enter: Key.Enter, space: Key.Space, tab: Key.Tab, escape: Key.Escape,
  backspace: Key.Backspace, shift: Key.LeftShift, control: Key.LeftControl,
  ctrl: Key.LeftControl, alt: Key.LeftAlt, win: Key.LeftSuper,
  up: Key.Up, down: Key.Down, left: Key.Left, right: Key.Right,
  a: Key.A, b: Key.B, /* ... all letters ... */ z: Key.Z,
  f1: Key.F1, f5: Key.F5, f11: Key.F11, f12: Key.F12
}

function generateHumanPath(start: Point, end: Point): Point[] {
  const steps = 25
  const pathArray: Point[] = []
  const dirX = end.x > start.x ? 1 : -1
  const dirY = end.y > start.y ? 1 : -1
  const deviation = Math.random() * 80 + 20
  const ctrl = new Point(
    start.x + (Math.abs(end.x - start.x) / 2) * dirX + (Math.random() < 0.5 ? -deviation : deviation),
    start.y + (Math.abs(end.y - start.y) / 2) * dirY + (Math.random() < 0.5 ? -deviation : deviation)
  )
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pathArray.push(new Point(
      (1-t)*(1-t)*start.x + 2*(1-t)*t*ctrl.x + t*t*end.x,
      (1-t)*(1-t)*start.y + 2*(1-t)*t*ctrl.y + t*t*end.y
    ))
  }
  return pathArray
}

ipcMain.handle('ghost-sequence', async (_event, actions: any[]) => {
  for (const action of actions) {
    if (action.type === 'paste') {
      clipboard.writeText(action.text)
      await new Promise(r => setTimeout(r, 200))
      await keyboard.pressKey(Key.LeftControl, Key.V)
      await keyboard.releaseKey(Key.V, Key.LeftControl)
    } else if (action.type === 'wait') {
      await new Promise(r => setTimeout(r, action.ms || 500))
    } else if (action.type === 'type') {
      await keyboard.type(action.text)
    } else if (action.type === 'press') {
      const k = KEY_MAP[action.key.toLowerCase()]
      if (k !== undefined) {
        if (action.modifiers) {
          const mods = action.modifiers.map((m: any) => KEY_MAP[m.toLowerCase()]).filter(Boolean)
          for (const mod of mods) await keyboard.pressKey(mod)
          await keyboard.pressKey(k)
          await keyboard.releaseKey(k)
          for (const mod of mods.reverse()) await keyboard.releaseKey(mod)
        } else {
          await keyboard.pressKey(k)
          await keyboard.releaseKey(k)
        }
      }
    } else if (action.type === 'click') {
      await mouse.leftClick()
    }
  }
  return true
})

ipcMain.handle('ghost-click-coordinate', async (_event, { x, y, doubleClick }) => {
  const sf = screen.getPrimaryDisplay().scaleFactor
  const lx = Math.round(x / sf)
  const ly = Math.round(y / sf)
  const from = await mouse.getPosition()
  const to = new Point(lx, ly)
  await mouse.move(generateHumanPath(from, to))
  if (doubleClick) await mouse.doubleClick(Button.LEFT)
  else await mouse.leftClick()
  return true
})

ipcMain.handle('ghost-scroll', async (_event, { direction, amount }) => {
  const scrollAmount = amount || 500
  if (direction === 'up') await mouse.scrollUp(scrollAmount)
  else await mouse.scrollDown(scrollAmount)
  return true
})

ipcMain.handle('set-volume', async (_event, level: number) => {
  await loudness.setVolume(level)
  return `Volume ${level}%`
})

ipcMain.handle('take-screenshot', async () => {
  const filename = `IRIS_Capture_${Date.now()}.png`
  const savePath = path.join(app.getPath('pictures'), filename)
  await screenshot({ filename: savePath })
  shell.showItemInFolder(savePath)
  return `Screenshot saved.`
})

// @ts-nocheck
export const openApp = async (appName: string) => {
  if (!(window as any).electronAPI) return `Error: Electron not detected in environment.`
  const result: any = await (window as any).electronAPI.openApp(appName)
  return result?.ok ? `Success: ${appName} is opening.` : `Error: ${result?.error || 'Unknown'}`
}

export const takeScreenshot = async (): Promise<string | null> => {
   if (!(window as any).electronAPI) return null
   return await (window as any).electronAPI.screenshot()
}

export const performWebSearch = async (query: string) => {
  await (window as any).electron?.ipcRenderer?.invoke('google-search', query)
  return `Opening Google Search for: ${query}`
}

export const closeApp = async (appName: string) => {
  const result: any = await (window as any).electron?.ipcRenderer?.invoke('close-app', appName)
  return result?.success ? `Terminated ${appName}.` : `Failed to close ${appName}. It might not be running.`
}


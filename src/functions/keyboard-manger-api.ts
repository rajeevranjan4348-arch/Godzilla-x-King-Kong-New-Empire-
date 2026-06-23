// @ts-nocheck
export const ghostType = async (text: string) => {
  await (window as any).electron.ipcRenderer.invoke('ghost-sequence', [{ type: 'type', text }])
  return 'Typing complete.'
}

export const executeGhostSequence = async (jsonString: string) => {
  const actions = JSON.parse(jsonString)
  await (window as any).electron.ipcRenderer.invoke('ghost-sequence', actions)
  return 'Sequence executed successfully.'
}

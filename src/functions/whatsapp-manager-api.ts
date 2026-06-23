// @ts-nocheck
export const sendWhatsAppMessage = async (name: string, message: string, filePath?: string) => {
  if (filePath) {
    await (window as any).electron.ipcRenderer.invoke('copy-file-to-clipboard', filePath)
  }
  await (window as any).electron.ipcRenderer.invoke('open-app', 'whatsapp')
  const navActions = [
    { type: 'wait', ms: 1500 },
    { type: 'click' },
    { type: 'press', key: 'n', modifiers: ['control'] }, // new chat
    { type: 'wait', ms: 500 },
    { type: 'press', key: 'a', modifiers: ['control'] },
    { type: 'press', key: 'backspace' },
    { type: 'type', text: name },
    { type: 'wait', ms: 500 },
    { type: 'press', key: 'down' },
    { type: 'press', key: 'enter' },
    { type: 'wait', ms: 500 },
    { type: 'click' }
  ]
  await (window as any).electron.ipcRenderer.invoke('ghost-sequence', navActions)
  
  if (filePath) {
    await (window as any).electron.ipcRenderer.invoke('ghost-sequence', [
      { type: 'press', key: 'v', modifiers: ['control'] },
      { type: 'wait', ms: 2500 },
      { type: 'type', text: message },
      { type: 'press', key: 'enter' }
    ])
  } else {
    await (window as any).electron.ipcRenderer.invoke('ghost-sequence', [
      { type: 'paste', text: message },
      { type: 'wait', ms: 500 },
      { type: 'press', key: 'enter' }
    ])
  }
  return `Message sent to ${name}.`
}

export const scheduleWhatsAppMessage = async (name: string, message: string, delayMinutes: number, filePath?: string) => {
  if (!delayMinutes || delayMinutes <= 0) return sendWhatsAppMessage(name, message, filePath)
  setTimeout(() => {
    sendWhatsAppMessage(name, message, filePath)
  }, delayMinutes * 60 * 1000)
  return `Scheduled: message to ${name} in ${delayMinutes} min.`
}

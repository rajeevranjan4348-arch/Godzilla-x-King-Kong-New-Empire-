// @ts-nocheck
export class GeminiLiveService {
  public socket: WebSocket | null = null
  public audioContext: AudioContext | null = null
  public mediaStream: MediaStream | null = null
  public workletNode: AudioWorkletNode | null = null
  public analyser: AnalyserNode | null = null
  public apiKey: string
  public isConnected: boolean = false
  public isSpeaking: boolean = false
  public onSpeakingChange?: (isSpeaking: boolean) => void
  private activeSources: Set<AudioBufferSourceNode> = new Set()
  private isMicMuted: boolean = false
  private nextStartTime: number = 0
  public model: string = 'models/gemini-2.5-flash-native-audio-latest';
  private aiResponseBuffer: string = ''
  private userInputBuffer: string = ''
  private appWatcherInterval: NodeJS.Timeout | null = null
  private lastAppList: string[] = []
  
  constructor() { this.apiKey = '' }
  setMute(muted: boolean) { this.isMicMuted = muted }
  
  async connect(): Promise<void> {
    // 1. Fetch API key from OS secure vault or localStorage
    if ((window as any).electron?.ipcRenderer) {
      const secureKeys = await (window as any).electron.ipcRenderer.invoke('secure-get-keys')
      this.apiKey = secureKeys?.geminiKey || localStorage?.getItem('iris_custom_api_key') || ''
    }
    this.apiKey = this.apiKey.trim()
    if (!this.apiKey) throw new Error('NO_API_KEY')
    
    // 2. Load cloud user, chat history, system stats, location
    // const history = await getHistory()
    // const sysStats = await getSystemStatus()
    // const allapps = await getAllApps()
    // this.lastAppList = await getRunningApps()
    // const locationData = await getLiveLocation()
    
    // 3. Build system instruction + real-time context string
    const finalSystemInstruction = "IRIS_SYSTEM_INSTRUCTION + contextPrompt"
    
    // 4. Create AudioContext + AudioWorklet (PCM processor)
    this.audioContext = new AudioContext()
    this.analyser = this.audioContext.createAnalyser()
    
    const audioWorkletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input.length > 0) {
            this.port.postMessage(input[0]);
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
    `;
    const workletUrl = URL.createObjectURL(new Blob([audioWorkletCode], { type: 'application/javascript' }))
    await this.audioContext.audioWorklet.addModule(workletUrl)
    
    // 5. Open WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/api/gemini-live?key=${this.apiKey}`
    this.socket = new WebSocket(url)
    this.socket.onopen = async () => {
      this.isConnected = true
      // Send setup message with model, system instruction, tools list
      this.socket?.send(JSON.stringify({
        setup: {
          model: this.model,
          systemInstruction: { parts: [{ text: finalSystemInstruction }] },
          tools: [], // Add tools here if needed
          generationConfig: {
            responseModalities: ["AUDIO"]
          }
        }
      }))
      this.startMicrophone()
      this.startAppWatcher()
    }
    
    this.socket.onmessage = async (event: any) => {
      let data;
      try {
        data = JSON.parse(await event.data.text?.() ?? event.data.toString());
      } catch (e) {
        return; // Ignore non-JSON messages
      }
      
      if (data.toolCall) {
        const functionResponses: any[] = []
        for (const call of data.toolCall.functionCalls) {
          let result
          // --- App control ---
          if (call.name === 'open_app') result = await (window as any).openApp?.(call.args.app_name)
          else if (call.name === 'close_app') result = await (window as any).closeApp?.(call.args.app_name)
          // --- Ghost keyboard/mouse ---
          else if (call.name === 'ghost_type') result = await (window as any).ghostType?.(call.args.text)
          else if (call.name === 'execute_sequence') result = await (window as any).executeGhostSequence?.(call.args.json_actions)
          else if (call.name === 'press_shortcut') result = await (window as any).pressShortcut?.(call.args.key, call.args.modifiers)
          else if (call.name === 'click_on_screen') {
            const { width, height } = await (window as any).getScreenSize?.() || { width: 1920, height: 1080 }
            const realX = Math.round((call.args.x / 1000) * width)
            const realY = Math.round((call.args.y / 1000) * height)
            result = await (window as any).clickOnCoordinate?.(realX, realY)
          }
          else if (call.name === 'scroll_screen') result = await (window as any).scrollScreen?.(call.args.direction, call.args.amount)
          // --- Terminal ---
          else if (call.name === 'run_terminal') result = await (window as any).runTerminal?.(call.args.command, call.args.path)
          // --- WhatsApp / Spotify ---
          else if (call.name === 'send_whatsapp') result = await (window as any).sendWhatsAppMessage?.(call.args.name, call.args.message, call.args.file_path)
          else if (call.name === 'play_spotify_music') result = await (window as any).playSpotifyMusic?.(call.args.song_name)
          // --- Volume / Screenshot ---
          else if (call.name === 'set_volume') result = await (window as any).setVolume?.(call.args.level)
          else if (call.name === 'take_screenshot') result = await (window as any).takeScreenshot?.()
          
          functionResponses.push({ id: call.id, name: call.name, response: { result: { output: result } } })
        }
        this.socket?.send(JSON.stringify({ toolResponse: { functionResponses } }))
      }
      
      // --- Audio output ---
      const sc = data.serverContent
      if (sc?.modelTurn?.parts) {
        sc.modelTurn.parts.forEach((p: any) => {
          if (p.inlineData) this.scheduleAudioChunk(p.inlineData.data)
        })
      }
    }
  }
  
  async startMicrophone(): Promise<void> {
    if (!this.audioContext) return
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } })
    const source = this.audioContext.createMediaStreamSource(this.mediaStream)
    const inputSampleRate = this.mediaStream.getAudioTracks()[0].getSettings().sampleRate || 48000
    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor')
    this.workletNode.port.onmessage = (event) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN || this.isMicMuted) return
      // We need downsampleTo16000, floatTo16BitPCM, base64ToFloat32
      // Mocking them here for the sake of the snippet
      const downsampled = (window as any).downsampleTo16000?.(event.data, inputSampleRate) || event.data
      const pcmData = (window as any).floatTo16BitPCM?.(downsampled) || new Int16Array(downsampled)
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)))
      this.socket.send(JSON.stringify({
        realtimeInput: {
          chunks: [{
            inlineData: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }
          }]
        }
      }))
    }
    source.connect(this.workletNode)
    this.workletNode.connect(this.audioContext.destination)
  }
  
  scheduleAudioChunk(base64Audio: string): void {
    if (!this.audioContext || !this.analyser) return
    const float32Data = (window as any).base64ToFloat32?.(base64Audio) || new Float32Array(0)
    const buffer = this.audioContext.createBuffer(1, float32Data.length, 24000)
    buffer.getChannelData(0).set(float32Data)
    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)
    const now = this.audioContext.currentTime
    if (this.nextStartTime < now) this.nextStartTime = now + 0.05
    
    this.activeSources.add(source)
    if (!this.isSpeaking) {
      this.isSpeaking = true
      if (this.onSpeakingChange) this.onSpeakingChange(true)
    }
    
    source.onended = () => {
      this.activeSources.delete(source)
      if (this.activeSources.size === 0) {
        if (this.isSpeaking) {
          this.isSpeaking = false
          if (this.onSpeakingChange) this.onSpeakingChange(false)
        }
      }
    }
    
    source.start(this.nextStartTime)
    this.nextStartTime += buffer.duration // chain chunks with no gap
  }
  
  startAppWatcher() {
    this.appWatcherInterval = setInterval(async () => {
      if (!this.isConnected || !this.socket) return
      const currentApps = await (window as any).getRunningApps?.() || []
      const newOpened = currentApps.filter((a: any) => !this.lastAppList.includes(a))
      const newClosed = this.lastAppList.filter((a: any) => !currentApps.includes(a))
      if (newOpened.length > 0 || newClosed.length > 0) {
        this.lastAppList = currentApps
        let msg = ''
        if (newOpened.length) msg += `[System]: User OPENED ${newOpened.join(', ')}. `
        if (newClosed.length) msg += `[System]: User CLOSED ${newClosed.join(', ')}. `
        msg += '(Context update only. DO NOT REPLY.)'
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ clientContent: { turns: [{ role: 'user', parts: [{ text: msg }] }], turnComplete: false } }))
        }
      }
    }, 3000)
  }
  
  disconnect(): void {
    if (this.appWatcherInterval) {
      clearInterval(this.appWatcherInterval)
      this.appWatcherInterval = null
    }
    this.isConnected = false
    this.socket?.close()
    this.socket = null
    
    this.activeSources.forEach(src => {
      try { src.stop() } catch {}
    })
    this.activeSources.clear()
    if (this.isSpeaking) {
      this.isSpeaking = false
      if (this.onSpeakingChange) this.onSpeakingChange(false)
    }

    this.mediaStream?.getTracks().forEach(t => t.stop())
    this.mediaStream = null
    this.workletNode?.disconnect()
    this.workletNode = null
    this.audioContext?.close()
    this.audioContext = null
    this.analyser?.disconnect()
    this.analyser = null
  }
}

export const irisService = new GeminiLiveService()

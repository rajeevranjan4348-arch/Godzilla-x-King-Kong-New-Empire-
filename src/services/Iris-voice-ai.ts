import { GoogleGenAI, Modality, Type } from '@google/genai';
import { IRIS_SYSTEM_PROMPT } from '../prompts/irisSystemPrompt';
import { GeminiVisionService } from './GeminiVisionService';
import { base64ToFloat32, floatTo16BitPCM, downsampleTo16000 } from '../utils/audioUtils';

export class GeminiLiveService {
  public audioContext: AudioContext | null = null;
  public mediaStream: MediaStream | null = null;
  public analyser: AnalyserNode | null = null;
  public isConnected: boolean = false;
  private isMicMuted: boolean = false;
  public isNoiseReductionEnabled: boolean = localStorage.getItem('iris_noise_reduction') !== 'false';
  private latestFrame: string | null = null;
  private latestMimeType: string = 'image/jpeg';
  
  public onTranscript?: (role: string, text: string) => void;
  public onCommand?: (command: string, args: any) => Promise<any> | any;
  public onSpeakingChange?: (isSpeaking: boolean) => void;
  public isSpeaking: boolean = false;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private nextStartTime: number = 0;

  private ai: GoogleGenAI | null = null;
  private session: WebSocket | null = null;

  get hasMicrophone(): boolean {
    return this.mediaStream !== null;
  }

  setMute(muted: boolean) {
    this.isMicMuted = muted;
  }

  async setNoiseReduction(enabled: boolean) {
    this.isNoiseReductionEnabled = enabled;
    if (this.mediaStream) {
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        try {
          await audioTrack.applyConstraints({
            noiseSuppression: enabled,
            echoCancellation: true,
            autoGainControl: true
          });
        } catch (e) {
          console.error("Failed to apply noise reduction constraints", e);
        }
      }
    }
  }

  async connect(): Promise<void> {
    try {
      await this.startMicrophone();
    } catch (err) {
      console.warn("Microphone access denied or not available. Continuing without microphone.", err);
    }
    
    let systemApiKey = '';
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const config = await res.json();
        systemApiKey = config.geminiApiKey || '';
      }
    } catch(e) {
       console.error("Failed to fetch API config", e);
    }
    
    // @ts-ignore
    const viteKey = (import.meta && import.meta.env) ? import.meta.env.VITE_GEMINI_API_KEY : '';
    const apiKey = localStorage.getItem('iris_custom_api_key') || viteKey || systemApiKey;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/gemini-live?key=${apiKey}`;

    // Dynamic prompt and settings
    const personality = localStorage.getItem('iris_personality') || "Be helpful, technical, with a 'bro-vibe'. Speak Hindi and English.";
    const userName = localStorage.getItem('iris_user_name') || 'User';
    const currentTime = new Date().toISOString();
    
    const fullSystemPrompt = `${IRIS_SYSTEM_PROMPT}\n\nYou are talking to ${userName}.\nPersonality: ${personality}\nThe current time is ${currentTime}.`;

    return new Promise((resolve, reject) => {
      this.session = new WebSocket(wsUrl);
      
      this.session.onopen = () => {
        const setupMessage = {
          setup: {
            model: "models/gemini-2.5-flash-native-audio-latest",
            systemInstruction: {
              parts: [{ text: fullSystemPrompt }]
            },
            tools: [{
              googleSearch: {}
            }, {
              functionDeclarations: [
                { name: "analyzeCameraFeed", description: "Call this tool WHENEVER the user asks you to look at the camera..." },
                { name: "clearHistory", description: "Clears the user's chat history, transcript, or memory." },
                { name: "openDashboard", description: "Opens the main dashboard, home screen, or main menu view." },
                { name: "openSettings", description: "Opens the settings, configuration, or command center view." },
                { name: "openApp", description: "Opens a specific application or tab in the system, such as Gmail, YouTube, Calendar, Notes, ChatGPT, Google Maps, Chrome, Google Drive, WhatsApp, etc.", parameters: { type: Type.OBJECT, properties: { appName: { type: Type.STRING, description: "The name of the application to open, e.g. 'Gmail', 'YouTube', 'Notes', 'Calendar', 'ChatGPT'." } }, required: ["appName"] } },
                { name: "adjustVolume", description: "Adjusts the system volume.", parameters: { type: Type.OBJECT, properties: { level: { type: Type.NUMBER } }, required: ["level"] } },
                { name: "changeBrightness", description: "Changes the display brightness.", parameters: { type: Type.OBJECT, properties: { level: { type: Type.NUMBER } }, required: ["level"] } },
                { name: "openUrl", description: "Opens a specific URL or website in the browser.", parameters: { type: Type.OBJECT, properties: { url: { type: Type.STRING } }, required: ["url"] } },
                { name: "getWeather", description: "Gets the current weather for a specific location.", parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING } }, required: ["location"] } },
                { name: "androidPerformAction", description: "Perform an Android system action via ADB.", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING } }, required: ["action"] } },
                { name: "startCamera", description: "Starts the camera feed for vision analysis." },
                { name: "startScreenShare", description: "Starts screen sharing for vision analysis." },
                // PDF automation tools
                { name: "open_app", description: "Opens a native desktop application by name.", parameters: { type: Type.OBJECT, properties: { app_name: { type: Type.STRING, description: "The name of the application to open." } }, required: ["app_name"] } },
                { name: "close_app", description: "Closes a running application by name.", parameters: { type: Type.OBJECT, properties: { app_name: { type: Type.STRING, description: "The name of the application to close." } }, required: ["app_name"] } },
                { name: "ghost_type", description: "Simulates keyboard typing of text.", parameters: { type: Type.OBJECT, properties: { text: { type: Type.STRING, description: "The text to type out." } }, required: ["text"] } },
                { name: "execute_sequence", description: "Executes a sequence of chained macro actions.", parameters: { type: Type.OBJECT, properties: { json_actions: { type: Type.STRING, description: "JSON string containing an array of actions." } }, required: ["json_actions"] } },
                { name: "press_shortcut", description: "Simulates a keyboard shortcut.", parameters: { type: Type.OBJECT, properties: { key: { type: Type.STRING, description: "The keyboard key to press." }, modifiers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Modifier keys like Ctrl, Alt, Shift." } }, required: ["key"] } },
                { name: "click_on_screen", description: "Clicks at specific coordinate ratios (0 to 1000).", parameters: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER, description: "X coordinate ratio from 0 to 1000." }, y: { type: Type.NUMBER, description: "Y coordinate ratio from 0 to 1000." } }, required: ["x", "y"] } },
                { name: "scroll_screen", description: "Simulates scrolling the active window.", parameters: { type: Type.OBJECT, properties: { direction: { type: Type.STRING, description: "The direction to scroll, 'up' or 'down'." }, amount: { type: Type.NUMBER, description: "The scroll speed or lines." } }, required: ["direction"] } },
                { name: "run_terminal", description: "Runs a PowerShell/shell command in a specific path.", parameters: { type: Type.OBJECT, properties: { command: { type: Type.STRING, description: "The command to run." }, path: { type: Type.STRING, description: "The working directory." } }, required: ["command"] } },
                { name: "send_whatsapp", description: "Launches and sends a WhatsApp message with optional attachments.", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "Recipient name." }, message: { type: Type.STRING, description: "Message body text." }, file_path: { type: Type.STRING, description: "Optional file path." } }, required: ["name", "message"] } },
                { name: "play_spotify_music", description: "Launches Spotify and plays a song.", parameters: { type: Type.OBJECT, properties: { song_name: { type: Type.STRING, description: "Name of the song." } }, required: ["song_name"] } },
                { name: "set_volume", description: "Adjusts system sound volume.", parameters: { type: Type.OBJECT, properties: { level: { type: Type.NUMBER, description: "Sound volume level 0-100." } }, required: ["level"] } },
                { name: "take_screenshot", description: "Takes a desktop screenshot." }
              ]
            }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: localStorage.getItem('iris_ai_voice') || 'Puck' } }
              }
            }
          }
        };

        this.session?.send(JSON.stringify(setupMessage));
        this.isConnected = true;
        this.setupAudioProcessing();
        resolve();
      };

      this.session.onmessage = (event: MessageEvent) => {
        try {
          if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
               this.handleMessage(JSON.parse(reader.result as string));
            };
            reader.readAsText(event.data);
          } else {
            const msg = JSON.parse(event.data);
            this.handleMessage(msg);
          }
        } catch (e) {
          console.error("Error parsing message", e);
        }
      };

      this.session.onerror = (e: any) => {
         console.error('Live API error', e);
         reject(e);
      };

      this.session.onclose = () => {
         this.isConnected = false;
         console.log('Session closed');
      };
    });
  }

  private async startMicrophone() {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: this.isNoiseReductionEnabled,
        echoCancellation: true,
        autoGainControl: true,
        channelCount: 1
      }
    });

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.5;
  }

  private async setupAudioProcessing() {
    if (!this.audioContext || !this.mediaStream || !this.session) return;

    try {
      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input.length > 0) {
              // Post the raw float32 channel data
              this.port.postMessage(input[0]);
            }
            return true;
          }
        }
        registerProcessor('pcm-processor', PCMProcessor);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(workletUrl);
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');
      
      const inputSampleRate = this.audioContext.sampleRate;
      workletNode.port.onmessage = (e) => {
        if (this.isMicMuted || !this.isConnected || !this.session) return;
        
        // e.data is the raw Float32Array from the microphone
        const floatData = e.data;
        // Downsample to 16000
        const downsampled = downsampleTo16000(floatData, inputSampleRate);
        // Convert to 16-bit PCM
        const pcmBuffer = floatTo16BitPCM(downsampled);
        // Encode to base64
        const base64 = this.arrayBufferToBase64(pcmBuffer);
        
        try {
          this.session.send(JSON.stringify({
            realtimeInput: {
              chunks: [{
                inlineData: {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64
                }
              }]
            }
          }));
        } catch (err) { }
      };
      
      source.connect(workletNode);
      workletNode.connect(this.audioContext.destination);
      source.connect(this.analyser!);
    } catch (err) {
      console.error("Failed to setup AudioWorklet", err);
    }
  }

  private async handleMessage(msg: any) {
    if (msg.serverContent?.modelTurn?.parts) {
      for (const part of msg.serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          const isMutedTTS = localStorage.getItem('iris_mute_ai_voice') === 'true';
          if (!isMutedTTS) {
             await this.playAudio(part.inlineData.data);
          }
        }
        if (part.text) {
          if (this.onTranscript) this.onTranscript('assistant', part.text);
          // Fallback parsing just in case
          this.tryParseToolCall(part.text);
        }
        if (part.functionCall) {
           this.handleFunctionCall(part.functionCall);
        }
      }
    }
    if (msg.serverContent?.inputTranscription?.text) {
      if (this.onTranscript) this.onTranscript('user', msg.serverContent.inputTranscription.text);
    }
  }
  
  private async handleFunctionCall(call: any) {
      if (call.name === 'analyzeCameraFeed') {
        if (!this.latestFrame) {
          this.sendToolResponse(call.id, { result: "Camera is not active." });
        } else {
          try {
            // @ts-ignore
            const apiKey = localStorage.getItem('iris_custom_api_key') || ((import.meta && import.meta.env) ? import.meta.env.VITE_GEMINI_API_KEY : '');
            
            const base64Data = this.latestFrame.includes(',') ? this.latestFrame.split(',')[1] : this.latestFrame;
            
            // Only do vision via API if there's no ai directly connected, wait we have this.ai!
            const textResponse = await new GeminiVisionService(apiKey).analyzeImage(base64Data);
            this.sendToolResponse(call.id, { analysis: textResponse });
          } catch(e) {
            this.sendToolResponse(call.id, { error: "Failed to analyze camera." });
          }
        }
      } else if (this.onCommand) {
        try {
          const result = await Promise.resolve(this.onCommand(call.name, call.args || {}));
          this.sendToolResponse(call.id, result || { result: "Success" });
        } catch (e: any) {
           this.sendToolResponse(call.id, { error: e.message || "Execution failed" });
        }
      }
  }

  private sendToolResponse(callId: string, output: any) {
      if (!this.session || !this.isConnected) return;
      this.session.send(JSON.stringify({
        toolResponse: {
          functionResponses: [{
             id: callId,
             name: "", // name isn't formally required if id is supplied, but good practice.
             response: { output }
          }]
        }
      }));
  }

  private tryParseToolCall(text: string) {
    const match = text.match(/\{"tool":\s*"(\w+)",\s*"args":\s*(\{.*?\})\}/);
    if (match) {
      try {
        if (this.onCommand) this.onCommand(match[1], JSON.parse(match[2]));
      } catch {}
    }
  }

  private async playAudio(base64: string) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    try {
      const float32Data = base64ToFloat32(base64);
      if (float32Data.length === 0) return;

      const buffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);

      const src = this.audioContext.createBufferSource();
      src.buffer = buffer;
      
      if (this.analyser) {
        src.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      } else {
        src.connect(this.audioContext.destination);
      }
      
      const now = this.audioContext.currentTime;
      if (this.nextStartTime < now) {
        this.nextStartTime = now + 0.05;
      }
      
      this.activeSources.add(src);
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        if (this.onSpeakingChange) this.onSpeakingChange(true);
      }
      
      src.onended = () => {
        this.activeSources.delete(src);
        if (this.activeSources.size === 0) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            if (this.onSpeakingChange) this.onSpeakingChange(false);
          }
        }
      };
      
      src.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }

  private float32ToPCM16(input: Float32Array): ArrayBuffer {
    const buf = new ArrayBuffer(input.length * 2);
    const view = new DataView(buf);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buf;
  }

  private arrayBufferToBase64(buf: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  public stopPlayback() {
    this.activeSources.forEach(src => {
      try { src.stop(); } catch {}
    });
    this.activeSources.clear();
    if (this.isSpeaking) {
      this.isSpeaking = false;
      if (this.onSpeakingChange) this.onSpeakingChange(false);
    }
  }

  public sendText(text: string) {
    if (!this.isConnected || !this.session) return;
    this.session.send(JSON.stringify({
      clientContent: {
        turns: [{
          role: "user",
          parts: [{ text: text }]
        }],
        turnComplete: true
      }
    }));
  }

  public sendImage(base64Image: string) {
    this.latestFrame = base64Image;
    if (!this.isConnected || !this.session) return;
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    this.session.send(JSON.stringify({
      realtimeInput: {
        chunks: [{
          inlineData: {
            mimeType: "image/jpeg",
            data: data
          }
        }]
      }
    }));
  }

  public sendVideoFrame(base64Image: string, mimeType?: string) {
    this.latestFrame = base64Image;
    if (mimeType) this.latestMimeType = mimeType;
    if (!this.isConnected || !this.session) return;
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    this.session.send(JSON.stringify({
      realtimeInput: {
        chunks: [{
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: data
          }
        }]
      }
    }));
  }

  disconnect() {
    if (this.session) {
      try { this.session.close(); } catch (e) {}
      this.session = null;
    }
    this.isConnected = false;
    
    this.activeSources.forEach(src => {
      try { src.stop(); } catch {}
    });
    this.activeSources.clear();
    if (this.isSpeaking) {
      this.isSpeaking = false;
      if (this.onSpeakingChange) this.onSpeakingChange(false);
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close().catch(() => {});
      } catch (e) {}
      this.audioContext = null;
    }
    this.analyser = null;
  }
}

export const irisService = new GeminiLiveService();


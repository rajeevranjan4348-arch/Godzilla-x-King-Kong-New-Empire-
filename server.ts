import express from 'express';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));

  app.get('/api/config', (req, res) => {
    res.json({
      geminiApiKey: GEMINI_API_KEY || ''
    });
  });

  // Vision Analysis Endpoint (Gemini)
  app.post('/api/vision/analyze', async (req, res) => {
    try {
      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      }
      
      const { image, mimeType, prompt } = req.body;
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const systemInstruction = `Tumhara naam [Iris] hai. Tum ek advanced Real-time Visual Assistant ho. Tumhari khasiyat ye hai ki tum user ke camera feed ko dekh sakte ho aur unki awaaz sunkar turant react karte ho.
Tumhare Guidelines:
Visual Awareness: Jab user camera se kuch dikhaye, toh use detail mein analyze karo (jaise Class 9 ki books, JavaScript code, ya aas-paas ka mahaul).
Conversational Tone: Tumhe robotic nahi banna hai. Ek dost ki tarah baat karo, thoda wit aur humor use karo. Jawab chhote aur clear rakho taaki voice conversation natural lage.
Context Memory: User ne pichle frame mein kya dikhaya, use yaad rakho.
Expertise: Agar user coding dikhaye (Three.js/HTML), toh direct solution do. Agar NCERT ka sawal ho, toh teacher ki tarah guide karo.
Strict Rule: Kabhi bhi ye mat kaho ki 'Main ek AI hoon aur dekh nahi sakta'. Tumhe di gayi images ko hi apni 'Aankhein' maano.`;

      let textContent = prompt || "Look at the current camera feed. Be conversational and react based on your system instructions.";

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: image,
                  mimeType: mimeType || 'image/jpeg'
                }
              },
              { text: textContent }
            ]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Vision Analysis Error:', error);
      let errorMessage = 'An unexpected error occurred during vision analysis.';
      if (error.status === 401 || error.status === 403) {
        errorMessage = 'Invalid Gemini API key or insufficient permissions.';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded for Gemini API.';
      } else if (error.message) {
        errorMessage = `Gemini API Error: ${error.message}`;
      }
      res.status(error.status || 500).json({ error: errorMessage, details: error.message });
    }
  });

  // Z. AI Chat Gateway Endpoint (Gemini-3.5-flash)
  app.post('/api/z-ai/chat', async (req, res) => {
    try {
      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      }

      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      const ai = new GoogleGenAI({ 
        apiKey: GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const systemInstruction = `Tumhara naam [Z. AI] hai. Tum chat.z.ai ke official advanced model ho.
Tumhare Guidelines:
1. Tum hamesha user ko help, instructions aur accurate details do.
2. Tum user se friendly aur intelligent tarike se baat karo. Jaisa input format/language ho (Hindi or English), usi bhasha mein seamless replies do.
3. Code formatting ke liye standard markdown syntax blocks ka use karo.
4. Tum direct system intelligence provider ho, toh pure clarity ke saath answers do.`;

      // Transform generic roles to @google/genai format: 'user' -> 'user', 'assistant' -> 'model'
      const contents = messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content || '' }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Z. AI API Error:', error);
      res.status(error.status || 500).json({ 
        error: error.message || 'An error occurred while communicating with Z. AI backend gateway.' 
      });
    }
  });

  // Image Generation Endpoint (Gemini Imagen)
  app.post('/api/gemini/imagen', async (req, res) => {
    try {
      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      }
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
        }
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const imageBytes = response.generatedImages[0].image.imageBytes;
        res.json({ imageBase64: imageBytes });
      } else {
        res.status(500).json({ error: 'No image generated.' });
      }
    } catch (error: any) {
      console.error('Imagen Error:', error);
      res.status(error.status || 500).json({ error: error.message || 'Error generating image' });
    }
  });

  // ADB Execution Endpoint
  app.post('/api/adb', async (req, res) => {
    try {
      const { command, args } = req.body;
      if (!command) return res.status(400).json({ error: 'Command is required' });
      
      let adbArgs = '';
      if (command === 'action') {
        const actionMap: any = { home: '3', back: '4', recents: '187', power: '26', volume_up: '24', volume_down: '25' };
        adbArgs = `shell input keyevent ${actionMap[args.action] || actionMap.home}`;
      } else if (command === 'launch') {
        // Just a basic am start intent
        adbArgs = `shell monkey -p ${args.appName} -c android.intent.category.LAUNCHER 1`;
      } else if (command === 'input') {
        adbArgs = `shell input text "${args.text.replace(/ /g, '%s')}"`;
      } else if (command === 'tap') {
        adbArgs = `shell input tap ${args.x} ${args.y}`;
      } else if (command === 'raw') {
        adbArgs = args;
      }

      const { stdout, stderr } = await execPromise(`adb ${adbArgs}`);
      res.json({ success: true, stdout, stderr });
    } catch (error: any) {
      console.error('ADB Error:', error);
      res.status(500).json({ error: 'ADB command failed. Device might not be connected or adb not installed.', details: error.message });
    }
  });

  // OpenAI REST API endpoints for Chat and Coding
  app.post('/api/chat', async (req, res) => {
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const { messages, model, systemPrompt } = req.body;
      
      const formattedMessages = [];
      if (systemPrompt) {
        formattedMessages.push({ role: 'system', content: systemPrompt });
      }
      
      for (const msg of messages) {
        if (msg.role === 'user') {
          const content = [];
          if (msg.content) content.push({ type: 'text', text: msg.content });
          if (msg.attachment) {
            content.push({ type: 'image_url', image_url: { url: `data:${msg.attachment.type};base64,${msg.attachment.data}` } });
          }
          formattedMessages.push({ role: 'user', content });
        } else {
          formattedMessages.push({ role: msg.role, content: msg.content });
        }
      }
      
      const response = await openai.chat.completions.create({
        model: model || 'gpt-4o',
        messages: formattedMessages,
        stream: true,
      });
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('OpenAI Chat Error:', error);
      let errorMessage = 'An unexpected error occurred during chat completion.';
      if (error.status === 401) {
        errorMessage = 'Invalid OpenAI API key. Please check your configuration.';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded or insufficient quota for OpenAI API.';
      } else if (error.status >= 500) {
        errorMessage = 'OpenAI server is currently experiencing issues. Please try again later.';
      } else if (error.message) {
        errorMessage = `OpenAI API Error: ${error.message}`;
      }
      
      if (!res.headersSent) {
        res.status(error.status || 500).json({ error: errorMessage, details: error.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      }
    }
  });

  // WebSocket proxy for OpenAI Realtime API
  const wss = new WebSocketServer({ server, path: '/api/realtime' });

  wss.on('connection', (ws) => {
    console.log('Client connected to Realtime proxy');
    
    if (!OPENAI_API_KEY) {
      ws.send(JSON.stringify({ type: 'error', error: { message: 'OpenAI API key not configured on server' } }));
      ws.close();
      return;
    }

    const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
    const openaiWs = new WebSocket(url, {
      headers: {
        "Authorization": "Bearer " + OPENAI_API_KEY,
        "OpenAI-Beta": "realtime=v1",
      }
    });

    openaiWs.on('open', () => {
      console.log('Connected to OpenAI Realtime API');
      ws.send(JSON.stringify({ type: 'proxy_connected' }));
    });

    openaiWs.on('message', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    openaiWs.on('close', () => {
      console.log('OpenAI Realtime API disconnected');
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    openaiWs.on('error', (err: any) => {
      console.error('OpenAI WebSocket error:', err);
      let errorMessage = 'Connection error with OpenAI Realtime API.';
      if (err.message) {
        if (err.message.includes('401')) {
          errorMessage = 'Authentication failed. Please check your OpenAI API key.';
        } else if (err.message.includes('429')) {
          errorMessage = 'Rate limit exceeded for OpenAI Realtime API.';
        } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
          errorMessage = 'Network error: Could not reach OpenAI servers.';
        } else {
          errorMessage = `OpenAI WebSocket Error: ${err.message}`;
        }
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', error: { message: errorMessage, details: err.message } }));
      }
    });

    ws.on('error', (err) => {
      console.error('Client WebSocket error:', err);
    });

    ws.on('message', (data) => {
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(data);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from proxy');
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    });
  });

  // WebSocket proxy for Gemini Live API
  const geminiWss = new WebSocketServer({ server, path: '/api/gemini-live' });

  geminiWss.on('connection', (ws, req) => {
    console.log('Client connected to Gemini Live proxy');
    
    const urlParams = new URL(req.url || '', `http://${req.headers.host}`).searchParams;
    let apiKey = urlParams.get('key');
    if (!apiKey || apiKey === 'smmPrdCbtrh6hSdBujbXtWoVWEi463poRTD4eYBk9Ugj0LZXGgxmh3mybXgc') {
      apiKey = GEMINI_API_KEY || '';
    }
    
    if (!apiKey) {
      ws.send(JSON.stringify({ type: 'error', error: { message: 'GEMINI_API_KEY not configured on server' } }));
      ws.close();
      return;
    }

    // Gemini Live WebSocket URL
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    const geminiWs = new WebSocket(url);

    geminiWs.on('open', () => {
      console.log('Connected to Gemini Live API');
      ws.send(JSON.stringify({ type: 'proxy_connected', service: 'gemini_live' }));
    });

    geminiWs.on('message', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    geminiWs.on('close', () => {
      console.log('Gemini Live API disconnected');
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    geminiWs.on('error', (err: any) => {
      console.error('Gemini Live WebSocket error:', err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', error: { message: 'Gemini Live connection error', details: err.message } }));
      }
    });

    ws.on('message', (data) => {
      if (geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(data);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from Gemini proxy');
      if (geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.close();
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

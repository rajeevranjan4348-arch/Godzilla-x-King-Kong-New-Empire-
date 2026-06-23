import WebSocket from 'ws';
const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${process.env.GEMINI_API_KEY}`;
const ws = new WebSocket(url);
ws.on('open', () => {
  ws.send(JSON.stringify({
    setup: {
      model: "models/gemini-2.0-flash-exp",
      generationConfig: { responseModalities: ["AUDIO"] }
    }
  }));
  ws.send(JSON.stringify({
    clientContent: {
      turns: [{ role: "user", parts: [{ text: "Hello!" }] }],
      turnComplete: true
    }
  }));
});
ws.on('message', (data) => console.log("Received:", data.toString().substring(0, 500)));
ws.on('error', (e) => console.error("Error:", e));
ws.on('close', (e, reason) => console.log("Closed:", e, reason?.toString()));
setTimeout(() => ws.close(), 5000);

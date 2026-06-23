import { GoogleGenAI } from '@google/genai';

export class GeminiVisionService {
  private ai: GoogleGenAI;
  
  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async analyzeImage(base64Image: string, prompt = 'Bhai, isme kya hai? Hinglish me bata.') {
    // Strip header if present (e.g., data:image/jpeg;base64,...)
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const mimeType = base64Image.includes('data:') && base64Image.includes(',') 
                     ? base64Image.split(';')[0].split(':')[1] 
                     : 'image/jpeg';

    const res = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt },
        ],
      }],
    });
    return res.text;
  }
}

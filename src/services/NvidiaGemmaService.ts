export async function generateGemmaResponse(
  messages: { role: string; content: string }[],
  onChunk?: (chunk: string) => void
): Promise<string> {
  const invokeUrl = "/api/nvidia/v1/chat/completions";
  const apiKey = "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";
  
  const payload = {
    model: "google/gemma-4-31b-it",
    messages: messages,
    max_tokens: 16384,
    temperature: 1.00,
    top_p: 0.95,
    stream: !!onChunk,
    chat_template_kwargs: { enable_thinking: true },
  };

  const response = await fetch(invokeUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": onChunk ? "text/event-stream" : "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  if (onChunk) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    let buffer = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || "";
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {
              // Ignore parse errors on incomplete chunks
            }
          }
        }
      }
    }
    return fullText;
  } else {
    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }
}

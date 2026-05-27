// Importa SDK OpenAI compatível com OpenRouter
import OpenAI from "openai";

// Cria cliente OpenRouter
export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Prompt fixo de comportamento da IA
const SYSTEM_PROMPT = `
Você é um especialista em cortes virais para TikTok, Reels e YouTube Shorts.

Sua função é analisar transcrições de vídeos e identificar os trechos com maior potencial viral.

Critérios:
- emoção
- frases impactantes
- polêmica
- humor
- surpresa
- curiosidade
- autoridade
- narrativa forte

Sempre retorne JSON válido.
Nunca explique nada fora do JSON.
`;

// Função que analisa transcrição e retorna sugestões de clips
export async function analyzeTranscript(
  transcription: string,
  videoDuration: number,
) {
  // Mensagem específica com a transcrição do vídeo
  const USER_PROMPT = `
Analise esta transcrição e escolha os 3 melhores cortes virais.

Regras:
- Cada corte deve ter exatamente 30 segundos.
- O campo "end" deve ser sempre "start + 30".
- A duração total do vídeo é ${videoDuration} segundos.
- Nunca retorne "start" menor que 0.
- Nunca retorne "end" maior que ${videoDuration}.
- Retorne título, início, fim e motivo.
- Use timestamps da transcrição.

Formato:

{
  "clips": [
    {
      "title": "Título",
      "start": 10,
      "end": 40,
      "reason": "Motivo"
    }
  ]
}

Transcrição:
${transcription}
`;

  // Chama Claude Sonnet via OpenRouter
  const response = await openrouter.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.6",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: USER_PROMPT,
      },
    ],
    temperature: 0.7,
  });

  // Retorna o texto gerado pela IA
  return response.choices[0].message.content;
}

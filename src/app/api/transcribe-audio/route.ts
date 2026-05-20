// Importa leitura de arquivo
import { readFile } from "fs/promises";

// Importa path para montar caminhos
import path from "path";

// Força a rota a rodar no Node.js
export const runtime = "nodejs";

// URL interna da API Whisper na rede Docker
const WHISPER_API_URL = "http://whisper-api:8000/transcribe";

// Rota POST chamada pelo n8n para transcrever áudio
export async function POST(request: Request) {
  try {
    // Recebe dados enviados pelo n8n
    const body = await request.json();

    // Caminho absoluto do áudio gerado pelo FFmpeg
    const { absoluteAudioPath } = body;

    // Valida se o caminho foi enviado
    if (!absoluteAudioPath) {
      return Response.json(
        { error: "absoluteAudioPath é obrigatório" },
        { status: 400 }
      );
    }

    // Lê o arquivo MP3 dentro do container upai-app
    const audioBuffer = await readFile(absoluteAudioPath);

    // Cria um arquivo Blob para enviar ao Whisper
    const audioBlob = new Blob([audioBuffer], {
      type: "audio/mpeg",
    });

    // Cria formulário multipart/form-data
    const formData = new FormData();

    // Adiciona o áudio no campo esperado pela API Whisper: "file"
    formData.append("file", audioBlob, path.basename(absoluteAudioPath));

    // Envia o arquivo para a API Whisper
    const whisperResponse = await fetch(WHISPER_API_URL, {
      method: "POST",
      body: formData,
    });

    // Se o Whisper retornar erro, repassa o erro
    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();

      return Response.json(
        {
          error: "Erro ao transcrever áudio",
          details: errorText,
        },
        { status: 500 }
      );
    }

    // Lê resposta do Whisper
    const transcription = await whisperResponse.json();

    // Retorna transcrição para o n8n
    return Response.json({
      success: true,
      transcription,
    });
  } catch (error) {
    console.error("Erro na transcrição:", error);

    return Response.json(
      { error: "Erro interno ao transcrever áudio" },
      { status: 500 }
    );
  }
}
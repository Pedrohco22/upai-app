// Importa função de análise da IA
import { analyzeTranscript } from "@/lib/ai";

// Importa conexão PostgreSQL
import { db } from "@/lib/db";

// Importa exec para rodar FFmpeg
import { exec } from "child_process";

// Importa promisify
import { promisify } from "util";

// Importa path
import path from "path";

// Importa funções para criar pasta e ler arquivo
import { mkdir, readFile } from "fs/promises";

// Converte exec para async/await
const execAsync = promisify(exec);

// Força runtime Node.js
export const runtime = "nodejs";

// Rota POST para processar vídeo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Pega ID do vídeo
    const { id } = await params;

    // Atualiza status para processing
    await db.query(
      `
      UPDATE videos
      SET status = $1
      WHERE id = $2
      `,
      ["processing", id],
    );

    // Busca vídeo no banco
    const result = await db.query(
      `
      SELECT *
      FROM videos
      WHERE id = $1
      `,
      [id],
    );

    // Pega vídeo encontrado
    const video = result.rows[0];

    // Se não encontrar vídeo, retorna erro
    if (!video) {
      return Response.json({ error: "Vídeo não encontrado" }, { status: 404 });
    }

    // Atualiza status para extracting_audio
    await db.query(
      `
      UPDATE videos
      SET status = $1
      WHERE id = $2
      `,
      ["extracting_audio", id],
    );

    // Define pasta onde os áudios serão salvos
    const audioDir = path.join(process.cwd(), "public", "uploads", "audio");

    // Garante que a pasta existe
    await mkdir(audioDir, { recursive: true });

    // Monta caminho absoluto do vídeo original
    const inputVideo = path.join(
      process.cwd(),
      "public",
      video.original_file_path,
    );

    // Define nome do áudio
    const audioFileName = `${video.id}.mp3`;

    // Monta caminho absoluto do áudio final
    const outputAudio = path.join(audioDir, audioFileName);

    // Comando FFmpeg para extrair áudio do vídeo
    const command = `ffmpeg -y -i "${inputVideo}" -vn -acodec libmp3lame "${outputAudio}"`;

    // Executa o FFmpeg
    await execAsync(command);

    // Atualiza status para transcribing
    await db.query(
      `
      UPDATE videos
      SET status = $1
      WHERE id = $2
      `,
      ["transcribing", id],
    );

    // Lê o áudio gerado
    const audioBuffer = await readFile(outputAudio);

    // Cria um Blob com o áudio MP3
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], {
      type: "audio/mpeg",
    });

    // Cria FormData para enviar ao Whisper
    const formData = new FormData();

    // Adiciona arquivo de áudio
    formData.append("audio_file", audioBlob, audioFileName);

    // Cria controller para timeout manual
    const controller = new AbortController();

    // Timeout de 10 minutos
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 600000);

    // Envia áudio para Whisper API
    const whisperResponse = await fetch(
      "http://whisper-api:9000/asr?task=transcribe&language=pt&output=json",
      {
        method: "POST",
        body: formData,
        signal: controller.signal,

        // IMPORTANTE:
        // evita timeout padrão do undici/node
        duplex: "half",
      } as RequestInit,
    );

    // Limpa timeout
    clearTimeout(timeoutId);

    // Se Whisper falhar, lança erro
    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      throw new Error(`Erro no Whisper: ${errorText}`);
    }

    // Recebe transcrição do Whisper
    const transcription = await whisperResponse.json();

    // Salva transcrição no banco
    await db.query(
      `
      UPDATE videos
      SET status = $1,
          transcription = $2
      WHERE id = $3
      `,
      ["transcribed", transcription.text, id],
    );

    // Atualiza status para analyzing
    await db.query(
      `
      UPDATE videos
      SET status = $1
      WHERE id = $2
      `,
      ["analyzing", id],
    );

    // Envia transcrição para IA escolher os melhores cortes
    const aiOutput = await analyzeTranscript(transcription.text);

    // Mostra resposta da IA no log do container
    console.log("Resposta da IA:", aiOutput);

    // Atualiza status para done temporariamente
    await db.query(
      `
      UPDATE videos
      SET status = $1
      WHERE id = $2
      `,
      ["done", id],
    );

    // Retorna resultado
    return Response.json({
      success: true,
      videoId: id,
      audioPath: `/uploads/audio/${audioFileName}`,
      absoluteAudioPath: outputAudio,
      transcription,
      aiOutput,
    });
  } catch (error) {
    // Mostra erro no log do container
    console.error("Erro ao processar vídeo:", error);

    // Retorna erro para o frontend
    return Response.json({ error: "Erro ao processar vídeo" }, { status: 500 });
  }
}

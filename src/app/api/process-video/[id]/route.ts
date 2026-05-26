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

    // Se não encontrar
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

    // Pasta onde os áudios serão salvos
    const audioDir = path.join(process.cwd(), "public", "uploads", "audio");

    // Garante que a pasta existe
    await mkdir(audioDir, { recursive: true });

    // Caminho absoluto do vídeo
    const inputVideo = path.join(
      process.cwd(),
      "public",
      video.original_file_path,
    );

    // Nome do áudio
    const audioFileName = `${video.id}.mp3`;

    // Caminho final do áudio
    const outputAudio = path.join(audioDir, audioFileName);

    // Comando FFmpeg para extrair áudio
    const command = `ffmpeg -y -i "${inputVideo}" -vn -acodec libmp3lame "${outputAudio}"`;

    // Executa FFmpeg
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

    // Lê o arquivo de áudio gerado
    const audioBuffer = await readFile(outputAudio);

    // Cria um Blob com o áudio em MP3
    const audioBlob = new Blob([audioBuffer], {
      type: "audio/mpeg",
    });

    // Cria formulário para enviar ao Whisper
    const formData = new FormData();

    // Adiciona o arquivo no campo esperado pela API Whisper
    formData.append("file", audioBlob, audioFileName);

    // Envia áudio para o Whisper
    const whisperResponse = await fetch("http://whisper-api:8000/transcribe", {
      method: "POST",
      body: formData,
    });

    // Se o Whisper falhar, lança erro
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

    // Retorna resposta
    return Response.json({
      success: true,
      videoId: id,
      audioPath: `/uploads/audio/${audioFileName}`,
      absoluteAudioPath: outputAudio,
      transcription,
    });
  } catch (error) {
    console.error("Erro ao processar vídeo:", error);

    return Response.json({ error: "Erro ao processar vídeo" }, { status: 500 });
  }
}

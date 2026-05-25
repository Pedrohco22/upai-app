// Importa conexão PostgreSQL
import { db } from "@/lib/db";

// Importa exec para rodar FFmpeg
import { exec } from "child_process";

// Importa promisify
import { promisify } from "util";

// Importa path
import path from "path";

// Importa mkdir
import { mkdir } from "fs/promises";

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

    // Log do vídeo encontrado
    console.log("Vídeo encontrado:", video);

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

    // Log do áudio extraído
    console.log("Áudio extraído:", outputAudio);

    // Atualiza status para done
    await db.query(
      `
      UPDATE videos
      SET status = $1
      WHERE id = $2
      `,
      ["done", id],
    );

    // Retorna resposta
    return Response.json({
      success: true,
      videoId: id,
      audioPath: `/uploads/audio/${audioFileName}`,
      absoluteAudioPath: outputAudio,
    });
  } catch (error) {
    console.error("Erro ao processar vídeo:", error);

    return Response.json({ error: "Erro ao processar vídeo" }, { status: 500 });
  }
}

// Importa função para criar pastas no servidor/container
import { mkdir } from "fs/promises";

// Importa path para montar caminhos de arquivo com segurança
import path from "path";

// Importa randomUUID para gerar nomes únicos para os cortes
import { randomUUID } from "crypto";

// Importa exec para executar comandos no sistema
import { exec } from "child_process";

// Importa promisify para usar exec com async/await
import { promisify } from "util";

// Importa conexão PostgreSQL
import { db } from "@/lib/db";

// Transforma exec em uma função baseada em Promise
const execAsync = promisify(exec);

// Garante que esta rota rode no runtime Node.js
export const runtime = "nodejs";

// Rota POST responsável por criar um corte de vídeo
export async function POST(request: Request) {
  try {
    // Lê o JSON enviado pelo n8n ou frontend
    const body = await request.json();

    // Extrai os dados recebidos
    const { inputPath, start, end, title, videoId, reason } = body;

    // Calcula a duração do corte
    const duration = Number(end) - Number(start);

    // Valida se os tempos são válidos
    if (Number.isNaN(duration) || duration <= 0) {
      return Response.json(
        { error: "Tempo de corte inválido" },
        { status: 400 },
      );
    }

    // Define a pasta onde os cortes e thumbnails serão salvos
    const clipsDir = path.join(process.cwd(), "public", "uploads", "clips");

    // Garante que a pasta de cortes existe
    await mkdir(clipsDir, { recursive: true });

    // Cria um nome único para o arquivo de vídeo cortado
    const clipName = `${randomUUID()}.mp4`;

    // Caminho absoluto de saída do vídeo cortado
    const outputPath = path.join(clipsDir, clipName);

    // Converte o caminho público do vídeo original em caminho absoluto dentro do container
    const absoluteInput = path.join(process.cwd(), "public", inputPath);

    // Comando FFmpeg para cortar o vídeo
    const clipCommand = `ffmpeg -y -ss ${start} -i "${absoluteInput}" -t ${duration} -c:v libx264 -c:a aac "${outputPath}"`;

    // Executa o FFmpeg para gerar o clip
    await execAsync(clipCommand);

    // Cria um nome único para a thumbnail do corte
    const thumbnailName = `${randomUUID()}.jpg`;

    // Caminho absoluto de saída da thumbnail
    const thumbnailOutputPath = path.join(clipsDir, thumbnailName);

    // Comando FFmpeg para gerar thumbnail aos 5 segundos do clip
    const thumbnailCommand = `ffmpeg -y -i "${outputPath}" -ss 00:00:05 -vframes 1 "${thumbnailOutputPath}"`;

    // Executa o FFmpeg para gerar a thumbnail
    await execAsync(thumbnailCommand);

    // Salva informações do corte no PostgreSQL
    const result = await db.query(
      `
      INSERT INTO clips (
        video_id,
        title,
        file_path,
        start_time,
        end_time,
        duration,
        reason,
        thumbnail_path
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        // ID do vídeo original
        videoId,

        // Título do corte
        title,

        // Caminho público do vídeo cortado
        `/uploads/clips/${clipName}`,

        // Início do corte
        start,

        // Fim do corte
        end,

        // Duração do corte
        duration,

        // Motivo do corte
        reason,

        // Caminho público da thumbnail
        `/uploads/clips/${thumbnailName}`,
      ],
    );

    // Retorna o clip criado
    return Response.json({
      success: true,
      clip: result.rows[0],
    });
  } catch (error) {
    // Mostra o erro no log do container
    console.error("Erro ao gerar clip:", error);

    // Retorna erro para o n8n/frontend
    return Response.json({ error: "Erro ao gerar clip" }, { status: 500 });
  }
}

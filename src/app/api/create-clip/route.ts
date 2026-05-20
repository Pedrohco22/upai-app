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
    // Lê o JSON enviado pelo n8n
    const body = await request.json();

    // Extrai os dados recebidos
    const { inputPath, start, end, title, videoId, reason } = body;

    // Calcula a duração do corte
    const duration = end - start;

    // Define a pasta onde os cortes serão salvos
    const clipsDir = path.join(process.cwd(), "public", "clips");

    // Garante que a pasta de cortes existe
    await mkdir(clipsDir, { recursive: true });

    // Cria um nome único para o arquivo de corte
    const clipName = `${randomUUID()}.mp4`;

    // Caminho absoluto de saída do corte
    const outputPath = path.join(clipsDir, clipName);

    // Converte o caminho público do vídeo em caminho absoluto dentro do container
    const absoluteInput = path.join(process.cwd(), "public", inputPath);

    // Comando FFmpeg para cortar o vídeo
    const command = `ffmpeg -y -ss ${start} -i "${absoluteInput}" -t ${duration} -c copy "${outputPath}"`;

    // Executa o FFmpeg
    await execAsync(command);

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
    reason
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *
  `,
  [
    videoId,
    title,
    `/clips/${clipName}`,
    start,
    end,
    duration,
    reason
  ]
);

    // Retorna o caminho público do corte gerado
    return Response.json({
  success: true,
  clip: result.rows[0],
});
  } catch (error) {
    // Mostra o erro no log do container
    console.error("Erro ao gerar clip:", error);

    // Retorna erro para o n8n/frontend
    return Response.json(
      { error: "Erro ao gerar clip" },
      { status: 500 }
    );
  }
}
// =====================================================
// IMPORTA EXEC PARA RODAR COMANDOS NO SISTEMA
// =====================================================

import { exec } from "child_process";

// =====================================================
// IMPORTA PROMISIFY
// =====================================================

import { promisify } from "util";

// =====================================================
// IMPORTA FUNÇÕES DE PASTA
// =====================================================

import { mkdir } from "fs/promises";

// =====================================================
// IMPORTA PATH
// =====================================================

import path from "path";

// =====================================================
// TRANSFORMA EXEC EM PROMISE
// =====================================================

const execAsync = promisify(exec);

// =====================================================
// FORÇA NODE.JS RUNTIME
// =====================================================

export const runtime = "nodejs";

// =====================================================
// ROTA POST
// =====================================================

export async function POST(request: Request) {
  try {
    // =====================================================
    // RECEBE DADOS DO N8N
    // =====================================================

    const body = await request.json();

    const { videoId, absolutePath } = body;

    // =====================================================
    // VALIDA DADOS
    // =====================================================

    if (!videoId || !absolutePath) {
      return Response.json(
        {
          error: "videoId e absolutePath são obrigatórios",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // GARANTE PASTA DE ÁUDIOS
    // =====================================================

    const audioDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "audios"
    );

    await mkdir(audioDir, {
      recursive: true,
    });

    // =====================================================
    // CAMINHO FINAL DO MP3
    // =====================================================

    const outputPath = path.join(
      audioDir,
      `${videoId}.mp3`
    );

    // =====================================================
    // COMANDO FFMPEG
    // =====================================================

    const command = `
      ffmpeg -y -i "${absolutePath}"
      -vn
      -acodec libmp3lame
      "${outputPath}"
    `;

    // =====================================================
    // EXECUTA FFMPEG
    // =====================================================

    await execAsync(command);

    // =====================================================
    // RETORNO
    // =====================================================

    return Response.json({
      success: true,
      audioPath: `/uploads/audios/${videoId}.mp3`,
      absoluteAudioPath: outputPath,
    });

  } catch (error) {

    // =====================================================
    // LOG ERRO
    // =====================================================

    console.error("Erro ao gerar áudio:", error);

    // =====================================================
    // RETORNO ERRO
    // =====================================================

    return Response.json(
      {
        error: "Erro ao gerar áudio",
      },
      {
        status: 500,
      }
    );
  }
}
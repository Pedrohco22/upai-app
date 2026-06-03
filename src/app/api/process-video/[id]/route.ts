// Importa função de análise da IA
import { analyzeTranscript } from "@/lib/ai";

// Importa conexão PostgreSQL
import { db } from "@/lib/db";

// Importa exec para rodar comandos FFmpeg
import { exec } from "child_process";

// Importa promisify para usar exec com async/await
import { promisify } from "util";

// Importa path para montar caminhos de arquivo
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
    // Pega ID do vídeo pela URL
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

    // Garante que a pasta de áudio existe
    await mkdir(audioDir, { recursive: true });

    // Monta caminho absoluto do vídeo original dentro do container
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
    const audioCommand = `ffmpeg -y -i "${inputVideo}" -vn -acodec libmp3lame "${outputAudio}"`;

    // Executa o FFmpeg para extrair o áudio
    await execAsync(audioCommand);

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

    // Adiciona arquivo de áudio no campo esperado pela API Whisper
    formData.append("audio_file", audioBlob, audioFileName);

    // Cria controller para timeout manual
    const controller = new AbortController();

    // Define timeout de 10 minutos
    const timeoutId = setTimeout(
      () => {
        controller.abort();
      },
      10 * 60 * 1000,
    );

    // Envia áudio para a API Whisper
    const whisperResponse = await fetch(
      "http://whisper-api:9000/asr?task=transcribe&language=pt&output=json",
      {
        method: "POST",
        body: formData,
        signal: controller.signal,

        // Evita problemas de streaming no Node/Undici
        duplex: "half",
      } as RequestInit,
    );

    // Limpa timeout após resposta da API Whisper
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

    // Calcula duração total do vídeo com base no último segmento da transcrição
    const videoDuration =
      transcription.segments?.[transcription.segments.length - 1]?.end || 0;

    // Envia transcrição para IA escolher os melhores cortes
    const aiOutput = await analyzeTranscript(transcription.text, videoDuration);

    // Mostra resposta da IA no log do container
    console.log("Resposta da IA:", aiOutput);

    // Garante que a IA retornou alguma resposta
    if (!aiOutput) {
      throw new Error("A IA não retornou nenhuma resposta");
    }

    // Remove markdown ```json da resposta da IA
    const cleanedOutput = aiOutput
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Converte resposta da IA em JSON
    const parsedAiOutput = JSON.parse(cleanedOutput);

    // Lista de clips retornados pela IA
    const clips = parsedAiOutput.clips || [];

    // Define pasta onde os clips e thumbnails serão salvos
    const clipsDir = path.join(process.cwd(), "public", "uploads", "clips");

    // Garante que a pasta de clips existe
    await mkdir(clipsDir, { recursive: true });

    // Array para guardar clips gerados
    const generatedClips = [];

    // Percorre todos os clips retornados pela IA
    for (let index = 0; index < clips.length; index++) {
      // Pega o clip atual
      const clip = clips[index];

      // Converte o início retornado pela IA para número
      const start = Number(clip.start);

      // Define duração fixa de 30 segundos
      const duration = 30;

      // Calcula o fim automaticamente
      const end = start + duration;

      // Ignora clips inválidos ou fora da duração do vídeo
      if (Number.isNaN(start) || start < 0 || end > videoDuration) {
        console.log("Clip inválido ignorado:", clip);
        continue;
      }

      // Nome final do arquivo do clip
      const clipFileName = `${video.id}-clip-${index + 1}.mp4`;

      // Caminho absoluto onde o clip será salvo
      const clipOutputPath = path.join(clipsDir, clipFileName);

      // Comando FFmpeg para cortar exatamente 30 segundos do vídeo
      const clipCommand = `ffmpeg -y -ss ${start} -i "${inputVideo}" -t ${duration} -c:v libx264 -c:a aac "${clipOutputPath}"`;

      // Executa FFmpeg para gerar o clip
      await execAsync(clipCommand);

      // Nome final do arquivo da thumbnail
      const thumbnailFileName = `${video.id}-clip-${index + 1}.jpg`;

      // Caminho absoluto onde a thumbnail será salva
      const thumbnailOutputPath = path.join(clipsDir, thumbnailFileName);

      // Comando FFmpeg para gerar thumbnail aos 5 segundos do clip
      const thumbnailCommand = `ffmpeg -y -i "${clipOutputPath}" -ss 00:00:05 -vframes 1 "${thumbnailOutputPath}"`;

      // Executa FFmpeg para gerar a thumbnail
      await execAsync(thumbnailCommand);

      // Salva informações do clip no banco de dados
      await db.query(
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
        `,
        [
          // $1 - ID do vídeo original
          video.id,

          // $2 - Título gerado pela IA
          clip.title || `Clip ${index + 1}`,

          // $3 - Caminho público do vídeo cortado
          `/uploads/clips/${clipFileName}`,

          // $4 - Tempo inicial do clip
          start,

          // $5 - Tempo final do clip
          end,

          // $6 - Duração do clip
          duration,

          // $7 - Motivo escolhido pela IA
          clip.reason || "Sem motivo informado",

          // $8 - Caminho público da thumbnail
          `/uploads/clips/${thumbnailFileName}`,
        ],
      );

      // Adiciona clip na lista que será retornada para o frontend
      generatedClips.push({
        title: clip.title || `Clip ${index + 1}`,
        reason: clip.reason || "Sem motivo informado",
        start,
        end,
        duration,
        path: `/uploads/clips/${clipFileName}`,
        thumbnailPath: `/uploads/clips/${thumbnailFileName}`,
      });

      // Mostra sucesso no log
      console.log("Clip gerado com sucesso:", clipFileName);
    }

    // Atualiza status para done
    await db.query(
      `
      UPDATE videos
      SET status = $1
      WHERE id = $2
      `,
      ["done", id],
    );

    // Retorna resultado para o frontend
    return Response.json({
      success: true,
      videoId: id,
      transcription,
      clips: generatedClips,
    });
  } catch (error) {
    // Mostra erro no log do container
    console.error("Erro ao processar vídeo:", error);

    // Retorna erro para o frontend
    return Response.json({ error: "Erro ao processar vídeo" }, { status: 500 });
  }
}

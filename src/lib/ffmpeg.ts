// URL da sua API FFmpeg
const FFMPEG_API_URL = "http://2.24.99.234:8001";

// Função responsável por extrair áudio do vídeo
export async function extractAudio(videoPath: string) {

  // Faz requisição para API FFmpeg
  const response = await fetch(
    `${FFMPEG_API_URL}/extract-audio`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      // Caminho do vídeo enviado
      body: JSON.stringify({
        video_path: videoPath,
      }),
    }
  );

  // Valida resposta
  if (!response.ok) {
    throw new Error("Erro ao extrair áudio");
  }

  // Retorna JSON da API
  return response.json();
}
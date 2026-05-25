// Importa conexão PostgreSQL
import { db } from "@/lib/db";

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
      video,
    });
  } catch (error) {
    console.error("Erro ao processar vídeo:", error);

    return Response.json({ error: "Erro ao processar vídeo" }, { status: 500 });
  }
}

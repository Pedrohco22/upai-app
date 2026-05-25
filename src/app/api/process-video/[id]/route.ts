// Importa conexão com PostgreSQL
import { db } from "@/lib/db";

// Força Node.js runtime
export const runtime = "nodejs";

// Rota POST para processar vídeo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Pega ID do vídeo pela URL
    const { id } = await params;

    // Atualiza status no banco
    await db.query(
      `
      UPDATE videos
      SET status = $1
      WHERE id = $2
      `,
      ["processing", id],
    );

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
      message: "Processamento concluído",
    });
  } catch (error) {
    console.error("Erro ao iniciar processamento:", error);

    return Response.json(
      { error: "Erro ao iniciar processamento" },
      { status: 500 },
    );
  }
}

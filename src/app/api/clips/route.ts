// Importa conexão PostgreSQL
import { db } from "@/lib/db";

// Força runtime Node.js
export const runtime = "nodejs";

// Rota GET para listar clips
export async function GET() {
  try {
    // Busca clips no banco ordenados pelos mais recentes
    const result = await db.query(`
      SELECT
        id,
        video_id,
        title,
        file_path,
        thumbnail_path,
        start_time,
        end_time,
        duration,
        reason,
        created_at
      FROM clips
      ORDER BY created_at DESC
    `);

    // Retorna lista de clips
    return Response.json({
      success: true,
      clips: result.rows,
    });
  } catch (error) {
    // Mostra erro no log do container
    console.error("Erro ao buscar clips:", error);

    // Retorna erro
    return Response.json({ error: "Erro ao buscar clips" }, { status: 500 });
  }
}

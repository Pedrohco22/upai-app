// Importa conexão com PostgreSQL
import { db } from "@/lib/db";

// Força runtime Node.js
export const runtime = "nodejs";

// Rota GET para listar vídeos enviados
export async function GET() {
  try {
    // Busca vídeos mais recentes
    const result = await db.query(`
      SELECT *
      FROM videos
      ORDER BY created_at DESC
    `);

    // Retorna vídeos
    return Response.json({
      videos: result.rows,
    });
  } catch (error) {
    // Loga erro no container
    console.error("Erro ao listar vídeos:", error);

    // Retorna erro para o frontend
    return Response.json(
      { error: "Erro ao listar vídeos" },
      { status: 500 }
    );
  }
}
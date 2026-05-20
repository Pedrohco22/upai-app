// Importa conexão com PostgreSQL
import { db } from "@/lib/db";

// Força runtime Node.js
export const runtime = "nodejs";

// Rota GET para listar os cortes gerados
export async function GET() {
  try {
    // Busca os clips mais recentes
    const result = await db.query(`
      SELECT *
      FROM clips
      ORDER BY created_at DESC
    `);

    // Retorna os clips
    return Response.json({
      clips: result.rows,
    });
  } catch (error) {
    // Loga erro no container
    console.error("Erro ao listar clips:", error);

    // Retorna erro
    return Response.json(
      { error: "Erro ao listar clips" },
      { status: 500 }
    );
  }
}
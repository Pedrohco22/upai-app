// Importa funções para trabalhar com arquivos no servidor
import { mkdir, writeFile } from "fs/promises";

// Importa path para montar caminhos de arquivo com segurança
import path from "path";

// Importa randomUUID para gerar nomes únicos
import { randomUUID } from "crypto";

// Importa conexão com PostgreSQL
import { db } from "@/lib/db";

// Força essa rota a rodar no Node.js
export const runtime = "nodejs";

// Rota POST para receber upload de vídeo
export async function POST(request: Request) {
  try {
    // Lê os dados enviados pelo formulário
    const formData = await request.formData();

    // Pega o arquivo enviado no campo "file"
    const file = formData.get("file") as File | null;

    // Valida se o arquivo existe
    if (!file) {
      return Response.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Converte o arquivo para buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cria um nome único para evitar conflito
    const fileName = `${randomUUID()}-${file.name}`;

    // Define a pasta onde os vídeos serão salvos localmente
    const uploadDir = path.join(process.cwd(), "public", "uploads", "videos");

    // Garante que a pasta existe
    await mkdir(uploadDir, { recursive: true });

    // Caminho completo do arquivo no servidor
    const filePath = path.join(uploadDir, fileName);

    // Salva o arquivo no disco
    await writeFile(filePath, buffer);

    // Caminho público para acessar o arquivo pelo navegador
    const publicPath = `/uploads/videos/${fileName}`;

    // Salva o registro do vídeo no PostgreSQL
    const result = await db.query(
      `
      INSERT INTO videos (
        original_file_name,
        original_file_path,
        status
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [file.name, publicPath, "uploaded"]
    );

    // Retorna o vídeo salvo
    return Response.json({
      message: "Vídeo enviado com sucesso",
      video: result.rows[0],
    });
  } catch (error) {
    // Mostra erro no terminal
    console.error("Erro no upload:", error);

    // Retorna erro para o frontend
    return Response.json(
      { error: "Erro ao enviar vídeo" },
      { status: 500 }
    );
  }
}
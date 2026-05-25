// Importa NextResponse
import { NextResponse } from "next/server";

// Importa path
import path from "path";

// Importa fs
import fs from "fs";

// Rota GET
export async function GET(
  request: Request,
  context: {
    params: {
      fileName: string;
    };
  }
) {
  try {
    // Pega nome do arquivo da URL
    const fileName = context.params.fileName;

    // Caminho absoluto do clip
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "clips",
      fileName
    );

    // Verifica se arquivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    // Lê arquivo
    const fileBuffer = fs.readFileSync(filePath);

    // Retorna vídeo
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao carregar arquivo" },
      { status: 500 }
    );
  }
}
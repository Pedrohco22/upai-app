import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "clips",
      fileName
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao carregar clip:", error);

    return NextResponse.json(
      { error: "Erro ao carregar arquivo" },
      { status: 500 }
    );
  }
}
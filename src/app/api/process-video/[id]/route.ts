// Rota POST para processar vídeo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Pega ID da URL
  const { id } = await params;

  console.log("Processando vídeo:", id);

  // Retorna resposta
  return Response.json({
    success: true,
    message: "Processamento iniciado",
    videoId: id,
  });
}
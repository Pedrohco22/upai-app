"use client";

// Importa hooks do React
import { useEffect, useState } from "react";

// Tipo de um clip retornado pela API
type Clip = {
  id: string;
  title: string;
  file_path: string;
  start_time: number;
  end_time: number;
  reason: string;
};

// Componente principal da página
export default function HomePage() {
  // Estado que armazena os clips
  const [clips, setClips] = useState<Clip[]>([]);

  // Busca os clips ao carregar a página
  useEffect(() => {
    loadClips();
  }, []);

  // Função que chama a API
  async function loadClips() {
    try {
      // Faz requisição para listar clips
      const response = await fetch("/api/clips");

      // Converte resposta em JSON
      const data = await response.json();

      // Atualiza estado
      setClips(data.clips || []);
    } catch (error) {
      // Mostra erro no console
      console.error("Erro ao carregar clips:", error);
    }
  }

  // Renderização da tela
  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial",
      }}
    >
      {/* Título */}
      <h1>up.ai — Clips Gerados</h1>

      {/* Lista de clips */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 30,
        }}
      >
        {clips.map((clip) => (
          <div
            key={clip.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 12,
              padding: 20,
            }}
          >
            {/* Título */}
            <h2>{clip.title}</h2>

            {/* Tempo */}
            <p>
              <strong>Início:</strong> {clip.start_time}s
              {" | "}
              <strong>Fim:</strong> {clip.end_time}s
            </p>

            {/* Motivo */}
            <p>
              <strong>Motivo:</strong> {clip.reason}
            </p>

            {/* Player de vídeo */}
            <video
              controls
              width={400}
              src={clip.file_path}
              style={{
                borderRadius: 8,
                marginTop: 10,
              }}
            />

            {/* Botão download */}
            <div style={{ marginTop: 10 }}>
              <a
                href={clip.file_path}
                download
              >
                <button>
                  Download Clip
                </button>
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
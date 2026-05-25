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

  // Estado que armazena o arquivo selecionado
  const [file, setFile] = useState<File | null>(null);

  // Estado que controla o carregamento do upload
  const [uploading, setUploading] = useState(false);

  // Busca os clips ao carregar a página
  useEffect(() => {
    loadClips();
  }, []);

  // Função que chama a API para listar clips
  async function loadClips() {
    try {
      const response = await fetch("/api/clips");
      const data = await response.json();
      setClips(data.clips || []);
    } catch (error) {
      console.error("Erro ao carregar clips:", error);
    }
  }

  // Função que envia o vídeo para a API de upload
  async function uploadVideo() {
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setFile(null);
      await loadClips();
    } catch (error) {
      console.error("Erro ao enviar vídeo:", error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>up.ai — Upload e Clips Gerados</h1>

      <div style={{ marginTop: 30, marginBottom: 40 }}>
        <h2>Upload de Vídeo 🚀</h2>

        <input
          type="file"
          accept="video/*"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
          }}
        />

        <br />
        <br />

        <button onClick={uploadVideo} disabled={!file || uploading}>
          {uploading ? "Enviando..." : "Enviar vídeo"}
        </button>
      </div>

      <h2>Clips Gerados</h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 30,
        }}
      >
        {clips.length === 0 && <p>Nenhum clip gerado ainda.</p>}

        {clips.map((clip) => (
          <div
            key={clip.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3>{clip.title}</h3>

            <p>
              <strong>Início:</strong> {clip.start_time}s {" | "}
              <strong>Fim:</strong> {clip.end_time}s
            </p>

            <p>
              <strong>Motivo:</strong> {clip.reason}
            </p>

            <video
              controls
              width={400}
              src={clip.file_path}
              style={{
                borderRadius: 8,
                marginTop: 10,
              }}
            />

            <div style={{ marginTop: 10 }}>
              <a href={clip.file_path} download>
                <button>Download Clip</button>
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
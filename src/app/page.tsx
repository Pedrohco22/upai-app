"use client";

// Importa useState do React
import { useState } from "react";

// Página principal
export default function Home() {

  // Guarda o arquivo selecionado
  const [file, setFile] = useState<File | null>(null);

  // Guarda mensagem de status
  const [message, setMessage] = useState("");

  // Função responsável por enviar o vídeo
  async function handleUpload() {

    // Verifica se existe arquivo
    if (!file) {
      setMessage("Selecione um vídeo");
      return;
    }

    // Cria formulário para envio
    const formData = new FormData();

    // Adiciona arquivo no campo "file"
    formData.append("file", file);

    // Mostra mensagem de envio
    setMessage("Enviando vídeo...");

    // Faz requisição para API
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    // Converte resposta para JSON
    const data = await response.json();

    // Exibe resultado
    if (response.ok) {
      setMessage("Vídeo enviado com sucesso 🚀");
      console.log(data);
    } else {
      setMessage("Erro ao enviar vídeo");
      console.error(data);
    }
  }

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial",
      }}
    >

      {/* Título */}
      <h1>up.ai Upload de Vídeo 🚀</h1>

      {/* Campo de seleção de vídeo */}
      <input
        type="file"
        accept="video/*"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0];

          if (selectedFile) {
            setFile(selectedFile);
          }
        }}
      />

      <br />
      <br />

      {/* Botão de upload */}
      <button onClick={handleUpload}>
        Enviar vídeo
      </button>

      <br />
      <br />

      {/* Mensagem */}
      <p>{message}</p>

    </main>
  );
}
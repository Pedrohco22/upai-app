"use client";

// Importa tipos do React
import type { CSSProperties, ReactNode } from "react";

// Importa hooks do React
import { useEffect, useState } from "react";

// Importa ícones
import {
  Upload,
  Video,
  Scissors,
  Calendar,
  BarChart3,
  Settings,
  Play,
  Download,
  MoreVertical,
  Plus,
  Clock,
  Tv,
} from "lucide-react";

// Tipo de vídeo enviado
type UploadedVideo = {
  id: string;
  original_file_name: string;
  original_file_path: string;
  status: string;
  created_at?: string;
};

// Tipo de clip gerado
type Clip = {
  id: string;
  title: string;
  file_path: string;
  start_time: number;
  end_time: number;
  duration?: number;
  reason: string;
};

// Página principal
export default function HomePage() {
  // Lista de vídeos enviados
  const [videos, setVideos] = useState<UploadedVideo[]>([]);

  // Lista de clips gerados
  const [clips, setClips] = useState<Clip[]>([]);

  // Clip selecionado para abrir no modal
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  // Arquivo selecionado para upload
  const [file, setFile] = useState<File | null>(null);

  // Estado de upload
  const [uploading, setUploading] = useState(false);

  // Estado de processamento
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(
    null,
  );

  // Carrega dados ao abrir a página
  useEffect(() => {
    loadVideos();
    loadClips();
  }, []);

  // Busca vídeos enviados
  async function loadVideos() {
    const response = await fetch("/api/videos");
    const data = await response.json();
    setVideos(data.videos || []);
  }

  // Busca clips gerados
  async function loadClips() {
    const response = await fetch("/api/clips");
    const data = await response.json();
    setClips(data.clips || []);
  }

  // Retorna URL correta para reproduzir/baixar clip
  function getClipUrl(filePath: string) {
    const fileName = filePath.split("/").pop();

    return `/api/files/clip/${fileName}`;
  }

  // Envia vídeo para o backend
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

      await loadVideos();
    } finally {
      setUploading(false);
    }
  }

  // Processa vídeo com IA
  async function processVideo(videoId: string) {
    try {
      setProcessingVideoId(videoId);

      await fetch(`/api/process-video/${videoId}`, {
        method: "POST",
      });

      await loadVideos();
      await loadClips();
    } finally {
      setProcessingVideoId(null);
    }
  }

  return (
    <main style={styles.page}>
      {/* Navbar superior */}
      <header style={styles.navbar}>
        <div>
          <div style={styles.logo}>
            <span style={styles.logoPurple}>up.</span>ai
          </div>

          <div style={styles.subtitle}>AI VIDEO STUDIO</div>
        </div>

        <nav style={styles.navLinks}>
          <span style={styles.activeNav}>Vídeos</span>
          <span>Agenda</span>
          <span>Campanhas</span>
          <span>Analytics</span>
          <span>Configurações</span>
        </nav>

        <button style={styles.uploadButton}>
          <Plus size={18} />
          Novo upload
        </button>
      </header>

      {/* Conteúdo principal */}
      <section style={styles.content}>
        {/* Cabeçalho da página */}
        <div style={styles.hero}>
          <div>
            <h1 style={styles.title}>Vídeos</h1>

            <p style={styles.description}>
              Envie vídeos longos e deixe a IA criar clips virais para o
              YouTube.
            </p>
          </div>

          <button style={styles.secondaryButton}>
            <Tv size={18} />
            Importar do YouTube
          </button>
        </div>

        {/* Cards de estatísticas */}
        <section style={styles.statsGrid}>
          <StatCard
            icon={<Scissors size={28} />}
            label="Clips gerados"
            value={clips.length}
            detail="+ IA automática"
          />

          <StatCard
            icon={<Video size={28} />}
            label="Vídeos enviados"
            value={videos.length}
            detail="Uploads totais"
          />

          <StatCard
            icon={<Tv size={28} />}
            label="Publicados"
            value={0}
            detail="Em breve"
          />

          <StatCard
            icon={<Clock size={28} />}
            label="Tempo economizado"
            value="52h"
            detail="Estimativa"
          />
        </section>

        {/* Grid principal */}
        <section style={styles.mainGrid}>
          {/* Painel de vídeos */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Meus vídeos</h2>

              <span style={styles.link}>Mais recentes</span>
            </div>

            {/* Lista de vídeos */}
            <div style={styles.videoList}>
              {videos.length === 0 && (
                <p style={styles.emptyText}>Nenhum vídeo enviado ainda.</p>
              )}

              {videos.map((video) => (
                <div key={video.id} style={styles.videoItem}>
                  <div style={styles.videoThumb}>
                    <Video size={28} />
                  </div>

                  <div style={styles.videoInfo}>
                    <strong>{video.original_file_name}</strong>

                    <span style={styles.mutedText}>Status: {video.status}</span>

                    <span style={styles.purpleText}>
                      {clips.length} clips gerados
                    </span>
                  </div>

                  <button
                    style={styles.smallButton}
                    onClick={() => processVideo(video.id)}
                    disabled={processingVideoId === video.id}
                  >
                    {processingVideoId === video.id
                      ? "Processando..."
                      : "Processar"}
                  </button>

                  <MoreVertical size={18} color="#94A3B8" />
                </div>
              ))}
            </div>

            {/* Área de upload */}
            <div style={styles.dropzone}>
              <Upload size={30} color="#8B5CF6" />

              <div>
                <strong>Arraste e solte seu vídeo aqui</strong>

                <p style={styles.mutedText}>MP4, MOV ou AVI</p>
              </div>

              <input
                type="file"
                accept="video/*"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                }}
              />

              <button
                style={styles.primaryButton}
                onClick={uploadVideo}
                disabled={!file || uploading}
              >
                {uploading ? "Enviando..." : "Enviar vídeo"}
              </button>
            </div>
          </div>

          {/* Painel de clips */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>
                Clips gerados <span style={styles.badge}>{clips.length}</span>
              </h2>

              <span style={styles.link}>Ver todos</span>
            </div>

            {/* Grid de clips */}
            <div style={styles.clipsGrid}>
              {clips.length === 0 && (
                <p style={styles.emptyText}>Nenhum clip gerado ainda.</p>
              )}

              {clips.map((clip) => (
                <div
                  key={clip.id}
                  style={styles.clipCard}
                  onClick={() => setSelectedClip(clip)}
                >
                  <div style={styles.clipVideoBox}>
                    <video
                      controls
                      src={getClipUrl(clip.file_path)}
                      style={styles.clipVideo}
                      onClick={(event) => event.stopPropagation()}
                    />

                    <span style={styles.durationBadge}>00:30</span>

                    <span style={styles.viralBadge}>Novo</span>
                  </div>

                  <h3 style={styles.clipTitle}>{clip.title}</h3>

                  <p style={styles.clipReason}>{clip.reason}</p>

                  <div style={styles.clipActions}>
                    <button style={styles.iconButton}>
                      <Play size={16} />
                    </button>

                    <a
                      href={getClipUrl(clip.file_path)}
                      download
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button style={styles.iconButton}>
                        <Download size={16} />
                      </button>
                    </a>

                    <button style={styles.iconButton}>
                      <Calendar size={16} />
                    </button>

                    <button style={styles.iconButton}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Banner inferior */}
        <section style={styles.aiBanner}>
          <BarChart3 size={30} color="#8B5CF6" />

          <div>
            <strong>IA trabalhando para você</strong>

            <p style={styles.mutedText}>
              Transformamos conteúdo longo em clips curtos e impactantes prontos
              para o YouTube.
            </p>
          </div>

          <button style={styles.secondaryButton}>
            <Settings size={16} />
            Saiba mais
          </button>
        </section>
      </section>

      {/* Modal do clip selecionado */}
      {selectedClip && (
        <div style={styles.modalOverlay} onClick={() => setSelectedClip(null)}>
          <div
            style={styles.modalContent}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Cabeçalho do modal */}
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{selectedClip.title}</h2>

                <p style={styles.modalSubtitle}>
                  Clip gerado automaticamente pela IA
                </p>
              </div>

              <button
                style={styles.closeButton}
                onClick={() => setSelectedClip(null)}
              >
                ✕
              </button>
            </div>

            {/* Player grande */}
            <div style={styles.modalVideoWrapper}>
              <video
                controls
                autoPlay
                src={getClipUrl(selectedClip.file_path)}
                style={styles.modalVideo}
              />
            </div>

            {/* Informações do clip */}
            <div style={styles.modalInfo}>
              <div style={styles.modalInfoCard}>
                <strong>Duração</strong>
                <span>30 segundos</span>
              </div>

              <div style={styles.modalInfoCard}>
                <strong>Início</strong>
                <span>{selectedClip.start_time}s</span>
              </div>

              <div style={styles.modalInfoCard}>
                <strong>Fim</strong>
                <span>{selectedClip.end_time}s</span>
              </div>
            </div>

            {/* Explicação da IA */}
            <div style={styles.reasonBox}>
              <strong>Por que a IA escolheu esse trecho?</strong>

              <p style={styles.reasonText}>{selectedClip.reason}</p>
            </div>

            {/* Ações do modal */}
            <div style={styles.modalActions}>
              <a href={getClipUrl(selectedClip.file_path)} download>
                <button style={styles.primaryButton}>
                  <Download size={18} />
                  Download
                </button>
              </a>

              <button style={styles.secondaryButton}>
                <Calendar size={18} />
                Agendar
              </button>

              <button style={styles.secondaryButton}>
                <Tv size={18} />
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Componente reutilizável de card de estatística
function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>

      <div>
        <strong style={styles.statValue}>{value}</strong>

        <p style={styles.statLabel}>{label}</p>

        <span style={styles.statDetail}>{detail}</span>
      </div>
    </div>
  );
}

// Estilos da página
const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #1E1B4B 0%, #020617 35%, #020617 100%)",
    color: "#F8FAFC",
    fontFamily: "Arial, sans-serif",
  },

  navbar: {
    height: 88,
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
    background: "rgba(2, 6, 23, 0.85)",
    position: "sticky",
    top: 0,
    zIndex: 10,
    backdropFilter: "blur(16px)",
  },

  logo: {
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: "-1px",
  },

  logoPurple: {
    color: "#8B5CF6",
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 4,
  },

  navLinks: {
    display: "flex",
    gap: 36,
    color: "#CBD5E1",
    fontWeight: 600,
  },

  activeNav: {
    color: "#FFFFFF",
    borderBottom: "3px solid #8B5CF6",
    paddingBottom: 28,
  },

  content: {
    padding: 32,
  },

  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  title: {
    fontSize: 34,
    margin: 0,
  },

  description: {
    color: "#94A3B8",
    marginTop: 8,
  },

  uploadButton: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    padding: "14px 24px",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(15, 23, 42, 0.9)",
    color: "#E2E8F0",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: 12,
    padding: "12px 18px",
    cursor: "pointer",
  },

  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 18,
    marginBottom: 20,
  },

  statCard: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: 18,
    padding: 24,
  },

  statIcon: {
    width: 58,
    height: 58,
    borderRadius: 999,
    background: "rgba(124, 58, 237, 0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#A78BFA",
  },

  statValue: {
    fontSize: 30,
  },

  statLabel: {
    color: "#CBD5E1",
    margin: "4px 0",
  },

  statDetail: {
    color: "#A78BFA",
    fontSize: 14,
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1.1fr",
    gap: 20,
  },

  panel: {
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: 20,
    padding: 22,
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  panelTitle: {
    margin: 0,
    fontSize: 22,
  },

  link: {
    color: "#A78BFA",
    fontSize: 14,
    cursor: "pointer",
  },

  videoList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  videoItem: {
    display: "grid",
    gridTemplateColumns: "110px 1fr auto auto",
    gap: 16,
    alignItems: "center",
    paddingBottom: 14,
    borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
  },

  videoThumb: {
    height: 70,
    borderRadius: 12,
    background: "linear-gradient(135deg, #312E81, #111827)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#A78BFA",
  },

  videoInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  smallButton: {
    background: "rgba(124, 58, 237, 0.15)",
    color: "#C4B5FD",
    border: "1px solid rgba(124, 58, 237, 0.35)",
    borderRadius: 10,
    padding: "9px 14px",
    cursor: "pointer",
  },

  mutedText: {
    color: "#94A3B8",
    fontSize: 14,
    margin: 0,
  },

  purpleText: {
    color: "#A78BFA",
    fontSize: 14,
  },

  emptyText: {
    color: "#94A3B8",
  },

  dropzone: {
    marginTop: 18,
    border: "1px dashed rgba(148, 163, 184, 0.25)",
    borderRadius: 16,
    padding: 20,
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },

  clipsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },

  clipCard: {
    background: "rgba(2, 6, 23, 0.55)",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    borderRadius: 16,
    padding: 10,
    cursor: "pointer",
  },

  clipVideoBox: {
    position: "relative",
  },

  clipVideo: {
    width: "100%",
    height: 130,
    objectFit: "cover",
    borderRadius: 12,
    background: "#020617",
  },

  durationBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    background: "rgba(0,0,0,0.75)",
    padding: "4px 8px",
    borderRadius: 8,
    fontSize: 12,
  },

  viralBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "#7C3AED",
    padding: "4px 8px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
  },

  clipTitle: {
    fontSize: 14,
    margin: "10px 0 6px",
    lineHeight: 1.35,
  },

  clipReason: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 1.4,
    minHeight: 34,
  },

  clipActions: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },

  iconButton: {
    background: "rgba(15, 23, 42, 0.9)",
    color: "#CBD5E1",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: 8,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  badge: {
    background: "rgba(124, 58, 237, 0.18)",
    color: "#A78BFA",
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 13,
  },

  aiBanner: {
    marginTop: 20,
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: 18,
    padding: 22,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: 24,
  },

  modalContent: {
    width: "100%",
    maxWidth: 980,
    background: "#0F172A",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 24,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  modalTitle: {
    margin: 0,
    fontSize: 28,
  },

  modalSubtitle: {
    color: "#94A3B8",
    marginTop: 6,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(15,23,42,0.9)",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: 18,
  },

  modalVideoWrapper: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    background: "#020617",
  },

  modalVideo: {
    width: "100%",
    maxHeight: 560,
    background: "#000000",
  },

  modalInfo: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },

  modalInfoCard: {
    background: "rgba(2,6,23,0.75)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 16,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  reasonBox: {
    background: "rgba(124,58,237,0.08)",
    border: "1px solid rgba(124,58,237,0.2)",
    borderRadius: 18,
    padding: 18,
  },

  reasonText: {
    color: "#CBD5E1",
    lineHeight: 1.7,
    marginTop: 10,
  },

  modalActions: {
    display: "flex",
    gap: 14,
    justifyContent: "flex-end",
  },
};

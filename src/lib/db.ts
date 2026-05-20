// Importa o Pool do pacote pg
// Pool gerencia conexões com o PostgreSQL de forma eficiente
import { Pool } from "pg";

// Cria uma conexão reutilizável com o banco usando a DATABASE_URL do .env.local
export const db = new Pool({
  // URL completa de conexão com o PostgreSQL
  connectionString: process.env.DATABASE_URL,
});
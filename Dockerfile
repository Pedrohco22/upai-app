# =====================================================
# IMAGEM BASE NODE.JS
# =====================================================

# Usa Node.js oficial com Alpine Linux
FROM node:20-alpine

# =====================================================
# INSTALA FERRAMENTAS DO SISTEMA
# =====================================================

# Instala FFmpeg dentro do container
# O FFmpeg será usado para extrair áudio e gerar cortes dos vídeos
RUN apk add --no-cache ffmpeg

# =====================================================
# DIRETÓRIO DA APLICAÇÃO
# =====================================================

# Define a pasta principal da aplicação dentro do container
WORKDIR /app

# =====================================================
# INSTALA DEPENDÊNCIAS
# =====================================================

# Copia os arquivos de dependências
COPY package*.json ./

# Instala dependências do projeto
RUN npm install

# =====================================================
# COPIA PROJETO
# =====================================================

# Copia todos os arquivos do projeto para dentro do container
COPY . .

# =====================================================
# BUILD DO NEXT.JS
# =====================================================

# Gera build de produção da aplicação
RUN npm run build

# =====================================================
# PORTA DA APLICAÇÃO
# =====================================================

# Porta interna do Next.js
EXPOSE 3000

# =====================================================
# INICIA APLICAÇÃO
# =====================================================

# Inicia a aplicação em produção
CMD ["npm", "start"]
// Importa NextAuth
import NextAuth from "next-auth";

// Importa provider Google
import GoogleProvider from "next-auth/providers/google";

// Configuração do NextAuth
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

      authorization: {
        params: {
          // Permissões básicas + permissão para upload no YouTube
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.upload",

          // Garante que o Google envie refresh_token
          access_type: "offline",

          // Força tela de consentimento para receber refresh_token no primeiro login
          prompt: "consent",
        },
      },
    }),
  ],
});

// Exporta handlers GET e POST
export { handler as GET, handler as POST };

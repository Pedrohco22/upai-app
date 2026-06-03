"use client";

// Importa SessionProvider do NextAuth
import { SessionProvider } from "next-auth/react";

// Provider global da aplicação
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

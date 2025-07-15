"use client"

import { AuthProvider } from "@/contexts/AuthContext"
import { AppProvider } from "@/contexts/AppContext"
import AppRouter from "@/components/AppRouter"

export default function Home() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </AuthProvider>
  )
}

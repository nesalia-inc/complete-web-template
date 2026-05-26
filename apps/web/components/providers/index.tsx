"use client"

import { ThemeProvider } from "./theme-provider"
import { TRPCReactProvider } from "@/trpc/provider"

interface AppProviderProps {
  children: React.ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCReactProvider>
        {children}
      </TRPCReactProvider>
    </ThemeProvider>
  )
}
"use client"

import Link from "next/link"
import { Eclipse } from "lucide-react"
import { AuthButtons } from "@/components/auth/auth-buttons"

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Eclipse className="size-6" />
        </Link>
        <AuthButtons />
      </div>
    </header>
  )
}
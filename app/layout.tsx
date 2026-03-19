import React from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { StoreProvider } from '@/lib/store'

export const metadata: Metadata = {
  title: 'Nexus — Assistente de Tarefas',
  description: 'IA + Agenda + WhatsApp integrados',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Nexus' },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0 }}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}

# Nexus — Assistente de Tarefas

> IA + Agenda + WhatsApp integrados. Next.js 14 · App Router · TypeScript · Tailwind

## 🚀 Rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## 🏗️ Build de produção

```bash
npm run build
npm start
```

## ⚙️ Variáveis de ambiente

Crie `.env.local` na raiz:

```env
# IA — escolha um:
OPENROUTER_API_KEY=sk-or-...     # recomendado (dá acesso a Gemini, GPT-4, Claude)
GEMINI_API_KEY=AIza...           # alternativa gratuita

# Google OAuth (obrigatório)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=15345114043-fepr7qt2595873k05f64194tgmehtqo1.apps.googleusercontent.com

# Owner (acesso admin)
NEXT_PUBLIC_OWNER_EMAIL=gardaszconsultoria@gmail.com
```

## 🌐 Deploy na Vercel

1. Push para GitHub
2. Importe no [vercel.com](https://vercel.com)
3. Adicione as variáveis de ambiente no painel da Vercel
4. Deploy automático ✅

## 🏛️ Arquitetura

```
/app
  layout.tsx              ← RootLayout + StoreProvider
  page.tsx                ← Dashboard (Home)
  /login/page.tsx         ← Login Google OAuth
  /agent/page.tsx         ← Chat IA + Modo Jarvis (voz)
  /calendar/page.tsx      ← Google Calendar
  /whatsapp/page.tsx      ← WhatsApp via Z-API
  /plans/page.tsx         ← Planos Free / Pro / Business
  /settings/page.tsx      ← Configurações
  /automations/page.tsx   ← Regras de automação
  /admin/page.tsx         ← Painel admin (owner only)
  /api/chat/route.ts      ← POST /api/chat → OpenRouter / Gemini
  /api/calendar/route.ts  ← GET/POST /api/calendar → Google Calendar
  /api/whatsapp/route.ts  ← POST /api/whatsapp → Z-API

/components
  AppShell.tsx            ← Layout autenticado (Sidebar + Topbar + BottomNav)
  Sidebar.tsx             ← Navegação desktop
  Topbar.tsx              ← Cabeçalho com título e seletor de idioma
  BottomNav.tsx           ← Navegação mobile
  JarvisOverlay.tsx       ← Overlay de voz (Modo Jarvis)
  EventModal.tsx          ← Modal criar evento
  EventList.tsx           ← Lista de eventos do calendário
  PlanGateModal.tsx       ← Modal de upgrade de plano
  NexusIcon.tsx           ← Ícone SVG do Nexus
  Toast.tsx               ← Notificações toast

/lib
  store.ts                ← Context API global (sem dependências externas)
  types.ts                ← TypeScript interfaces
  translations.ts         ← i18n (PT / EN / ES)
  calendar.ts             ← Helpers do Google Calendar API
  zapi.ts                 ← Helper Z-API WhatsApp
```

## 🤖 API de Chat

`POST /api/chat`

```json
{
  "messages": [{ "role": "user", "content": "O que tenho hoje?" }],
  "userName": "João",
  "lang": "pt",
  "calendarContext": "Reunião DevOps (09:00), Daily (10:00)",
  "geminiKey": "AIza..."
}
```

Prioridade do provedor:
1. `OPENROUTER_API_KEY` (server-side, seguro)
2. `geminiKey` do usuário (client-side)
3. `GEMINI_API_KEY` (server-side)
4. Fallback inteligente sem chave

## 🎙️ Voz (Modo Jarvis)

- Botão de microfone no chat
- Atalho: **Barra de espaço** (fora de campos de texto)
- Web Speech API (Chrome/Edge)
- TTS: `speechSynthesis` nativo

## 📱 PWA

- `manifest.json` configurado
- `theme-color` definido
- `apple-mobile-web-app-capable` ativo
- Adicione `next-pwa` para service worker completo

## 🌍 Internacionalização

Suporte a: 🇧🇷 Português · 🇺🇸 English · 🇪🇸 Español  
Configurável em Settings ou pelo seletor no Topbar.

## 💳 Planos

| Feature          | Free | Pro | Business |
|------------------|------|-----|----------|
| Google Calendar  | ✅   | ✅  | ✅       |
| Chat IA          | ✅   | ✅  | ✅       |
| WhatsApp         | ❌   | ✅  | ✅       |
| Automações       | ❌   | ✅  | ✅       |
| Multi-usuário    | ❌   | ❌  | ✅       |

Para pagamentos reais: integre Stripe ou configure `mpPublicKey` (Mercado Pago) em Settings.

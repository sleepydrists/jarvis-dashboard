# JARVIS — Neural Command Center

A futuristic AI assistant dashboard with a 3D neural brain visualization, voice commands, agent management, task automation, and OpenAI integration.

## Features

- **3D Neural Brain** — Interactive particle-network visualization powered by React Three Fiber
- **Voice Commands** — Web Speech API with JARVIS-style text-to-speech responses
- **Agent Management** — Deploy, monitor, and control AI agents
- **Task Automation** — Create and run automated tasks with voice or UI triggers
- **OpenAI Chat** — Conversational interface via a secure backend proxy
- **Cyberpunk HUD** — Dark blue theme with scanlines, glowing panels, and live metrics

## Voice Commands

| Command | Action |
|---------|--------|
| "Status report" | System status + metrics update |
| "Open agents" | Switch to agent panel |
| "Open tasks" | Switch to automation panel |
| "Open chat" | Switch to comm link |
| "Run scan" | Trigger health scan task |
| "Sync neural" | Trigger neural sync task |
| "Stand down" | Deactivate voice interface |

## Prerequisites

- Node.js 18+
- An OpenAI API key

## Setup

```bash
cd C:\Users\sleep\Projects\jarvis-dashboard
npm install
copy .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...
npm run dev
```

Open http://localhost:5173 in Chrome or Edge.

## Deployment

Production setup (Vercel frontend + Render/Railway API, website lead intake, CORS, persistent storage):

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step instructions.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend (5173) + API server (3001) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

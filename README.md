# SignalDesk AI

SignalDesk is a full-stack personal intelligence workspace. It combines a polished web dashboard, a Java Spring Boot business API, and a Node.js/LangChain AI service to ingest sources, generate grounded briefings, and answer questions with citations.

## Architecture

```text
Next.js frontend :3000
        |
Java Spring Boot API :8080 ---- PostgreSQL :5432
        |
Node.js AI service :4000 ---- OpenAI (optional)
        |
Redis :6379 (optional queue/cache)
```

The demo works without an API key using deterministic mock AI responses. Add `OPENAI_API_KEY` to enable LangChain/OpenAI generation.

## Features

- Product landing page and responsive dashboard
- Source library with RSS, YouTube, Google Drive and PDF source types
- Citation-grounded research chat
- Briefing creation and scheduled delivery configuration
- Java REST API with PostgreSQL persistence
- Node.js TypeScript AI service with LangChain-compatible RAG boundary
- Demo mode, health checks, Docker Compose, tests and CI-ready structure

## Run locally

### Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:3000`.

### Run services separately

```bash
# Java API (requires Java 21+ and Maven)
cd java-service
mvn spring-boot:run

# AI service
cd node-ai
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Demo API calls

```bash
curl http://localhost:8080/api/health
curl http://localhost:4000/health
curl http://localhost:8080/api/sources
curl -X POST http://localhost:4000/ai/chat \
  -H 'content-type: application/json' \
  -d '{"question":"What changed in AI this week?"}'
```

## Production extensions

The next production steps are OAuth for Google/Notion, a real pgvector ingestion job, Redis-backed scheduling, email delivery, LangSmith tracing, and OpenAI API key management through a secrets manager.

## CV description

> Built SignalDesk AI, a full-stack intelligence platform using Next.js, Java Spring Boot, Node.js and LangChain. Implemented source ingestion, citation-grounded RAG chat, scheduled AI briefings, PostgreSQL persistence, Docker orchestration and a responsive dashboard.

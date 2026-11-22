# SignalDesk AI

SignalDesk is a full-stack research workspace prototype with a Next.js frontend,
a Java Spring Boot API, a Node.js/LangChain AI service and PostgreSQL.
It demonstrates source registration, context-based AI requests, validation,
error handling and automated tests. It is not yet a complete ingestion or RAG system.

## What works today

| Area | Implemented | Important limitation |
| --- | --- | --- |
| Web interface | Landing page, dashboard, source creation, refresh and research form | Dashboard counters include illustrative values; they are not evaluation metrics |
| Source API | Create, list, look up and delete source records | URLs are stored as metadata; content is not fetched or indexed |
| Storage | Source records persist in PostgreSQL | Briefings currently live in Java process memory and reset on restart |
| Briefings | List and create briefing configurations; validate HH:mm delivery time | No background generation, scheduler or email delivery yet |
| AI chat | Demo responses or OpenAI/LangChain generation from supplied context | No retrieval, citation generation or faithfulness verification yet |
| Summarisation | Validated title input and a deterministic demo response | Does not summarise source content, even when an API key is configured |
| Quality checks | TypeScript builds, HTTP regression tests and Java tests in CI | Provider tests use mocks, not paid OpenAI calls |

## Architecture

- Browser → Next.js frontend on port 3000.
- Browser → Java REST API on port 8080 → PostgreSQL on port 5432.
- Browser → Node AI service on port 4000 → OpenAI when configured.
- The current frontend sends questions without source context. With OpenAI enabled,
  those requests correctly return an insufficient-evidence answer until retrieval is added.
- The pgvector-capable database image is present, but embeddings and vector search are not implemented.

## Run with Docker

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

For Bash, use `cp .env.example .env` instead of `Copy-Item`.
Do not overwrite an existing `.env` containing your settings.

Open:

- [Landing page](http://localhost:3000)
- [Dashboard](http://localhost:3000/dashboard)
- [Java health](http://localhost:8080/api/health)
- [AI health](http://localhost:4000/health)

Docker Desktop must be running. If a service fails:

```powershell
docker compose logs --tail=100 java-api node-ai frontend
```

Stop services with `docker compose down`. Avoid `docker compose down -v`
unless you deliberately want to delete the database volume.

## Configuration and secrets

- Leave `OPENAI_API_KEY` empty for demo mode.
- Set it in your local `.env` to enable the provider, then recreate the AI container:
  `docker compose up -d --force-recreate node-ai`.
- Never commit API keys or paste them into issues, screenshots or logs.
- `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD` configure the Compose database.
  The example credentials are local-development defaults, not production secrets.
- Compose supplies `SPRING_DATASOURCE_*` to Java. The example's `DATABASE_URL`
  is not consumed by the current Compose configuration.
- `OPENAI_MODEL` is read by the Node service (default: `gpt-4o-mini`).
  To override it in Docker, explicitly pass it through the `node-ai.environment`
  section; adding it to `.env` alone does not expose it to that container.

## Run services separately

Use separate terminals, starting each command from the repository root.
Java requires a running PostgreSQL database; its connection settings are in
`java-service/src/main/resources/application.yml`.

```powershell
cd java-service
mvn spring-boot:run
```

```powershell
cd node-ai
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

If PowerShell blocks `npm.ps1`, use `npm.cmd` instead of changing the system's execution policy.

## Research API contract

`POST /ai/chat` accepts:

```json
{
  "question": "What is the support response target?",
  "context": "The support policy requires an initial response within two working days."
}
```

The context is caller-supplied text, not automatically retrieved evidence.

- No API key: `mode: "demo"`, `grounded: false`.
- Key configured but context missing/blank: `status: "insufficient_evidence"`;
  the model is not invoked.
- Successful model response: `groundingStatus: "unverified"`, `grounded: false`,
  `contextProvided: true`. Supplying context does not prove faithfulness.
- `citations` is currently empty; do not interpret it as a citation verification result.
- Questions must contain 3–500 characters; context is limited to 12,000 characters.
- Invalid JSON returns 400, oversized JSON returns 413, unsupported encoding returns 415,
  and provider failures return 502 with a safe error code.
- Provider requests have a 15-second per-attempt timeout and at most one retry.
  Total time may exceed 15 seconds when a retry occurs.

PowerShell example:

```powershell
$body = @{
  question = "What is the support response target?"
  context = "The support policy requires an initial response within two working days."
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4000/ai/chat" -Method Post -ContentType "application/json" -Body $body
```

## Run checks

From `node-ai`:

```powershell
npm run build
npm test
```

From `frontend`: `npm run build`.
From `java-service`: `mvn -B test`.

The Node HTTP tests use ephemeral localhost ports and mock provider responses.
They need no real API key and make no paid provider calls.

## Production roadmap

1. Implement authorised ingestion, chunking, embeddings and retrieval.
2. Add citation attribution and claim-level faithfulness evaluation.
3. Persist briefings with stable identifiers and implement scheduling/delivery.
4. Add authentication, authorisation, restricted CORS and rate limiting.
5. Add database migrations, backups, monitoring and deployment secrets management.

The current services are intended for local development. Do not expose them publicly
without authentication and appropriate network controls.

## Portfolio description

Built a full-stack research workspace prototype using Next.js, Java Spring Boot,
PostgreSQL and Node.js/LangChain, with persistent source metadata, context-based
AI generation, evidence-missing abstention, input validation and HTTP regression tests.

Author: Gaurav Mahale

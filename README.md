# ProspectPulse

REST API that takes LinkedIn prospect URLs and generates personalized messaging sequences using AI. Built with NestJS, PostgreSQL, TypeORM, and OpenAI GPT-4o-mini.

## Setup

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- OpenAI API key

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY

# 3. Start PostgreSQL
docker compose up -d

# 4. Run database migrations
npm run migration:run

# 5. Start the server
npm run start:dev
```

The API is available at `http://localhost:3000/api` and Swagger docs at `http://localhost:3000/api/docs`.

### Available Scripts


| Script                                                       | Purpose                                |
| ------------------------------------------------------------ | -------------------------------------- |
| `npm run start:dev`                                          | Start with hot-reload                  |
| `npm run start:prod`                                         | Start from compiled output             |
| `npm run build`                                              | Compile TypeScript                     |
| `npm run migration:generate -- src/database/migrations/Name` | Generate migration from entity changes |
| `npm run migration:run`                                      | Run pending migrations                 |
| `npm run migration:revert`                                   | Revert last migration                  |


## API Endpoints


| Method | Path                     | Description                   |
| ------ | ------------------------ | ----------------------------- |
| `POST` | `/api/generate-sequence` | Generate a messaging sequence |
| `GET`  | `/api/sequences/:id`     | Retrieve a stored sequence    |
| `POST` | `/api/tov-configs`       | Create a TOV configuration    |
| `GET`  | `/api/tov-configs`       | List TOV configurations       |
| `GET`  | `/api/tov-configs/:id`   | Get a TOV configuration       |
| `GET`  | `/api/health`            | Health check                  |


### Example: Generate a Sequence

```bash
curl -X POST http://localhost:3000/api/generate-sequence \
  -H 'Content-Type: application/json' \
  -d '{
    "prospect_url": "https://linkedin.com/in/john-doe",
    "tov_config": {
      "formality": 0.8,
      "warmth": 0.6,
      "directness": 0.7
    },
    "company_context": "We help SaaS companies automate sales",
    "sequence_length": 3
  }'
```

Response includes the generated messages, prospect analysis, structured rationale for each message, confidence scores, and AI generation metadata (tokens, cost, latency).

## Database Schema Decisions

### Why JSONB

Three columns use JSONB: `prospects.profile_data`, `message_sequences.prospect_analysis`, and several fields on `sequence_messages` (signals_used, assumptions, risk_checks).

The tradeoff is intentional. LinkedIn profiles have a stable core (name, title, company) stored as typed columns for querying, but a long tail of variable data (experience history, skills, education) that differs per profile. JSONB handles this without schema changes every time a new field appears. The same logic applies to AI outputs -- the structured rationale fields have a defined shape, but the AI's analysis is inherently flexible.

Structured columns exist wherever we need to filter, index, or enforce constraints. JSONB is reserved for data that's read-heavy and schema-flexible.

### ai_generations Audit Table

Every OpenAI API call -- successful or failed -- writes a row to `ai_generations`. This is separate from the business-logic tables (`message_sequences`, `sequence_messages`) for several reasons:

- **Cost tracking**: `prompt_tokens`, `completion_tokens`, and `estimated_cost` let you aggregate spend per sequence, per day, or per prompt version.
- **Prompt versioning**: `prompt_version` (currently `v1`) tracks which prompt template produced each output, enabling A/B comparison when prompts are iterated.
- **Reproducibility**: `request_hash` is a SHA-256 of normalized inputs. Identical requests produce the same hash, enabling deduplication checks and regression tracking.
- **Debugging**: `request_payload` and `response_payload` store the full OpenAI request and response as JSONB, so you can inspect exactly what the model saw and returned without reproducing it.
- **Decoupled analytics**: The audit table can be queried independently of business data (e.g. "what's our average latency this week?" or "which prompt version has better confidence scores?").

### Other Design Choices

- **tov_configs as its own table**: TOV configurations are reusable. The same tone can be applied to multiple sequences without duplication. Each generate-sequence call creates a new config, but the structure supports saving and reusing presets.
- **status enum on sequences**: `pending → generating → completed/failed`. This enables future async processing (queue-based generation) without schema changes.
- **Cascade deletes**: Deleting a prospect cascades to its sequences and messages. Deleting a sequence sets `ai_generations.sequence_id` to NULL (preserving audit history).

## Prompt Engineering Approach

### TOV Translation

Numeric tone-of-voice parameters (0-1) are converted to natural language instructions via the `TovTranslatorService`. Each parameter maps to three buckets:


| Range     | Bucket | Example (formality)                                   |
| --------- | ------ | ----------------------------------------------------- |
| 0.0 - 0.3 | Low    | "Use a casual, conversational tone."                  |
| 0.3 - 0.7 | Medium | "Use a balanced, professional-but-approachable tone." |
| 0.7 - 1.0 | High   | "Use a formal, polished tone."                        |


The five axes (formality, warmth, directness, humor, technicality) compose into a bullet list of rules injected into the generation prompt's system message. This gives the model concrete, non-conflicting instructions rather than vague adjectives.

### Two-Phase Prompting

Generation is split into two sequential OpenAI calls:

**Phase 1 -- Prospect Analysis**: Takes the raw profile data and produces structured JSON with `industry_insights`, `pain_points`, `talking_points`, and `communication_style_recommendation`. This forces the model to reason about the prospect before writing messages, improving personalization quality.

**Phase 2 -- Message Generation**: Receives the Phase 1 analysis, TOV rules, company context, and sequence length. Produces the final messages with per-message structured rationale.

Splitting into two phases has practical benefits:

- Each prompt is shorter and more focused, reducing hallucination.
- The analysis can be cached or reused if only the TOV or company context changes.
- Failures are isolated -- a failed Phase 2 still preserves the Phase 1 analysis.

### Enforced JSON Output

Both phases use `response_format: { type: "json_object" }` (OpenAI's native JSON mode) to guarantee valid JSON output. The prompts also include explicit schema examples and a "Return ONLY valid JSON" instruction as defense-in-depth. If JSON parsing still fails, the service attempts regex extraction of the JSON object from the response text before raising an error.

## Thinking Process Design

The task requires showing the AI's "thinking process" for transparency. Rather than exposing raw chain-of-thought (which is unreliable, can leak prompt details, and isn't production-safe), each message includes **structured rationale fields**:


| Field                       | Type       | Purpose                                                       |
| --------------------------- | ---------- | ------------------------------------------------------------- |
| `signals_used`              | `string[]` | Specific profile facts the message references                 |
| `personalization_rationale` | `string`   | 1-2 sentences explaining why the message was written this way |
| `assumptions`               | `string[]` | Inferences made about the prospect                            |
| `risk_checks`               | `string[]` | Safety validations (e.g. "No sensitive inference")            |
| `confidence_score`          | `number`   | 0-1 score for how well the message fits                       |


This approach:

- **Is reviewer-friendly**: Structured fields are scannable and actionable, unlike free-form reasoning.
- **Prevents prompt leakage**: The model is instructed not to include raw chain-of-thought; only the structured fields are returned.
- **Enables validation**: Each field can be programmatically checked (e.g. "does every message have at least one signal_used?").
- **Preserves debug access**: The full raw model response is stored in `ai_generations.response_payload` for investigation, but never exposed in the API.

## Error Handling and Retries

### Retry Strategy

Each OpenAI call retries once on failure (2 attempts total). Both transient errors (rate limits, network issues) and parse failures trigger a retry. After exhausting retries, the sequence is marked `status: 'failed'` with the error stored, and the generation audit row records the failure.

### Error Mapping

A global exception filter maps upstream errors to appropriate HTTP status codes:


| Error Source               | HTTP Status | Reason                                   |
| -------------------------- | ----------- | ---------------------------------------- |
| Validation failure         | 400         | Bad input from client                    |
| Entity not found           | 404         | Missing resource                         |
| OpenAI RateLimitError      | 429         | Upstream rate limit, client should retry |
| OpenAI AuthenticationError | 502         | Server misconfiguration                  |
| OpenAI APIConnectionError  | 502         | Network unreachable                      |
| OpenAI server error (5xx)  | 502         | Upstream failure                         |
| Unhandled error            | 500         | Catch-all                                |


All error responses use a consistent JSON shape: `{ statusCode, error, message, timestamp, path }`.

### Observability

A logging interceptor records `METHOD /path STATUS latencyMs` for every request. OpenAI-specific metrics (tokens, cost, latency) are persisted per-call in the `ai_generations` table.

## What I'd Improve With More Time

- **Async generation with queues**: Move AI calls to a background job queue (Bull/BullMQ) so the POST endpoint returns immediately with `status: 'pending'` and the client polls or uses webhooks. This prevents HTTP timeouts on slow generations.
- **Real LinkedIn integration**: Swap `MockLinkedInService` for a Proxycurl or similar provider. The `LinkedInProvider` interface is already in place -- just implement a new class.
- **Caching and deduplication**: Use `request_hash` to skip re-generation for identical inputs. Return the existing sequence instead of calling OpenAI again.
- **Authentication and rate limiting**: Add API key auth and per-client rate limiting. Currently the API is open.
- **Prompt A/B testing**: Use `prompt_version` to run multiple prompt variants and compare confidence scores and human feedback across versions.
- **Streaming responses**: Use OpenAI's streaming API to send messages as they're generated, reducing perceived latency.
- **Cost controls**: Add per-sequence and per-day spending limits. Alert on anomalous token usage.
- **Input sanitization**: Validate LinkedIn URLs more strictly (check domain, path structure). Sanitize company_context to prevent prompt injection.
- **Testing**: Unit tests for TovTranslator and PromptBuilder, integration tests for the sequence pipeline with mocked OpenAI responses, e2e tests for the API endpoints.


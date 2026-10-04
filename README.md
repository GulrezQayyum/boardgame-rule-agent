# Board Game Rule Conflict Resolver

![Board Game Rule Conflict Resolver cover](./public/submission/cover.svg)

> A source-grounded board game judge built for the [Sanity Challenge: Path One — Ship an Agent That Queries Real Content](https://dev.to/challenges/sanity-2026-09-16).

**Live demo:** [boardgame-rule-agent.vercel.app](https://boardgame-rule-agent.vercel.app)
**Sanity Studio:** [boardgame-rule-agent.vercel.app/studio](https://boardgame-rule-agent.vercel.app/studio)

Board Game Rule Conflict Resolver helps players and tournament judges resolve ambiguous card interactions. It retrieves structured card text, official interaction rulings, errata, and core rule priorities from Sanity before producing a concise JSON ruling with citations and a confidence level.

The included dataset is fictional demo content created for the Sanity Challenge. Replace it with licensed or officially maintained game data before using the application for a real game.

## Submission Graphics

### Architecture

![Resolver architecture](./public/submission/architecture.svg)

### Sanity Content Workflow

![Sanity-to-resolver content workflow](./public/submission/workflow.svg)

These original graphics show the product experience, the agent architecture, and how editors update structured Sanity content that grounds each ruling.

## Challenge Submission

This project is a submission for the [Sanity Challenge on DEV.to](https://dev.to/challenges/sanity-2026-09-16), Path One: **Ship an Agent That Queries Real Content**.

The challenge goal is demonstrated through an editor-controlled rules workflow:

1. Sanity stores cards, rules, and interaction conflicts as structured documents.
2. The agent retrieves that content through Sanity Context MCP or local GROQ-backed tools.
3. Sanity editors can update an official ruling without changing application code.
4. The resolver cites the retrieved documents and declines to guess when authoritative content is missing.

## Demo Flow

1. Open the [resolver](https://boardgame-rule-agent.vercel.app).
2. Ask about `Mirror Shield` and `Piercing Bolt`.
3. Try the three-card chain involving `Chain Lightning`, `Sanctuary Zone`, and `Blood Pact`.
4. Submit an unknown card such as `Mystic Dragon` to see the strict low-confidence fallback.
5. Open `/studio`, edit an interaction conflict, publish it, and submit the same question again.

## How Sanity Powers the Agent

Sanity is the structured source of truth for the resolver. The agent uses these tools:

- `lookupCards` retrieves card names, slugs, types, trigger phases, keywords, and effect text.
- `lookupConflicts` finds official interaction and errata documents linked to the complete set of retrieved card identifiers.
- `getRulePriority` retrieves ordered core rules for phase, priority, combat, and related categories.

The server-side workflow is:

1. Retrieve every named card.
2. Use the returned card identifiers to search linked conflicts and errata.
3. Retrieve relevant rule priorities.
4. Prefer an explicit official ruling over general reasoning.
5. Return a verdict, reasoning, cited documents, and `high`, `medium`, or `low` confidence.

The model is instructed to rely only on retrieved Sanity context. If the Content Lake has no definitive answer, the agent returns an insufficient-data response instead of inventing a ruling.

When configured, the route connects to a GROQ-mode [Sanity Context MCP](https://www.sanity.io/docs/ai/sanity-context-mcp) endpoint. For local development and fallback operation, the same workflow is implemented with direct GROQ queries through `next-sanity`.

## Architecture

```mermaid
flowchart TD
    UI[Next.js resolver UI] --> API[POST /api/resolve-conflict]
    API --> Agent[Groq-compatible model]
    Agent --> Tools[Agent tools]
    Tools --> Cards[lookupCards]
    Tools --> Conflicts[lookupConflicts]
    Tools --> Rules[getRulePriority]
    Cards --> Sanity[Sanity Content Lake]
    Conflicts --> Sanity
    Rules --> Sanity
    Sanity --> Agent
    Agent --> API
    API --> UI
```

## Content Model

| Document type | Purpose |
| --- | --- |
| `gameCard` | Card identity, slug, type, trigger phase, keywords, and effect text |
| `gameRule` | Ordered rule priorities, categories, codes, and rule text |
| `interactionConflict` | Linked cards, conflict description, official ruling, and governing rule |

The demo seed includes explicit rulings for two-card conflicts, a three-card chain interaction, and general rule-priority fallbacks.

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Sanity Studio and Sanity Content Lake
- GROQ queries through `next-sanity`
- Sanity Context MCP
- Groq SDK with model tool calling
- Tailwind CSS
- Vercel deployment

## Project Layout

```text
app/
  api/resolve-conflict/route.ts   Agent endpoint
  page.tsx                        Resolver UI
  studio/[[...tool]]/page.tsx     Embedded Sanity Studio
sanity/
  schemaTypes/                    Card, rule, and conflict schemas
  lib/agentTools.ts               GROQ-backed agent tools
  seed.json                       Example dataset
scripts/
  test-agent.ts                   End-to-end test runner
vercel.json                       Explicit Next.js deployment settings
```

## Sanity Project

The challenge demo uses:

```text
Project ID: kjwkn2a2
Dataset: production
```

The project contains fictional cards, rules, and interaction conflicts. The Sanity project and dataset should be configured with the appropriate access controls before production use.

## Local Development

### Prerequisites

- Node.js 20 or newer
- A Sanity project and dataset
- A Groq API key

Install dependencies from the directory containing `package.json`:

```bash
cd boardgame-rule-agent
npm install
```

Create `.env.local` in that directory:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID="your_sanity_project_id"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_API_VERSION="2026-09-28"
NEXT_PUBLIC_SANITY_URL="https://your-project.api.sanity.io/v1"
GROQ_API_KEY="gsk_your_groq_api_key"
GROQ_MODEL="openai/gpt-oss-20b"
```

For Sanity Context MCP, also configure:

```env
SANITY_MCP_ENDPOINT_URL="https://api.sanity.io/v1/context/organizations/your-organization-id/mcp/your-endpoint-name"
SANITY_MCP_TOKEN="your-context-viewer-token"
```

The MCP token is server-only and must never be exposed to client code.

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the resolver and [http://localhost:3000/studio](http://localhost:3000/studio) for Sanity Studio.

## Seed or Deploy Sanity Content

Deploy the schema:

```bash
npx sanity schema deploy
```

Import the demo dataset only into a dataset that can safely be replaced:

```bash
npx sanity dataset import sanity/seed.json production --replace
```

The `--replace` option can delete existing dataset content. Do not use it against a dataset containing content you need to keep.

## Validation and Tests

Run the checks from the app directory:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

For the end-to-end suite, keep `npm run dev` running in one terminal and run:

```bash
npm run test:e2e
```

The suite covers:

- Explicit errata lookup
- Rule-priority fallback
- Three-card chain resolution
- Unknown-card low-confidence fallback

## Production Deployment

The project is configured for Vercel with [vercel.json](./vercel.json).

From the app directory:

```bash
npx vercel login
npx vercel --prod
```

Set these variables in the Vercel project’s **Production** environment:

```text
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
NEXT_PUBLIC_SANITY_API_VERSION
NEXT_PUBLIC_SANITY_URL
GROQ_API_KEY
GROQ_MODEL
SANITY_MCP_ENDPOINT_URL
SANITY_MCP_TOKEN
```

The `GROQ_API_KEY` and `SANITY_MCP_TOKEN` values are secrets. Add them through Vercel’s environment-variable settings or the Vercel CLI; never commit them to the repository.

## API Contract

`POST /api/resolve-conflict` accepts:

```json
{
  "cards": ["Mirror Shield", "Piercing Bolt"],
  "currentPhase": "Action Phase",
  "question": "Can Mirror Shield reflect Piercing Bolt?"
}
```

A successful response has this shape:

```json
{
  "success": true,
  "agentRuling": {
    "verdict": "Clear 1-sentence ruling.",
    "reasoning": "Step-by-step reasoning grounded in retrieved content.",
    "citedDocuments": ["conflict-1"],
    "confidence": "high"
  }
}
```

The route returns HTTP 400 for invalid card input, HTTP 429 when the model provider rate-limits a request, and HTTP 500 for other agent or Sanity failures.

## Security and Data Notes

- `.env.local` is ignored and must not be committed.
- Never put provider keys or MCP tokens in client-side code.
- Use a new token if a secret has been exposed.
- Restrict Sanity and MCP permissions to the minimum required access.
- Review and license game data before using this demo with real commercial content.
- Sanity content is authoritative only for the documents that editors have maintained and published.

## License and Demo Data

The application code and submission graphics are provided for the challenge demonstration. The seeded card names, rules, and rulings are fictional. Confirm the repository license and replace the demo content with appropriately licensed data before redistributing or operating the resolver for a commercial game.

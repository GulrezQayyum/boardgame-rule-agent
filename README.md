# Board Game Rule Conflict Resolver AI Agent

An AI agent designed to resolve complex board game card interactions and rule paradoxes using structured context in Sanity Studio, GROQ queries, and LLM reasoning.

---

## Step 1: Sanity Schema Setup

To support deterministic conflict resolution, the database requires structured relationships between cards, rules, and edge-case interactions rather than unstructured raw text chunks.

### Core Schema Models (`sanity/schemaTypes/`)

1. **`gameCard.ts`**: Models game cards, abilities, trigger conditions, and keywords.
2. **`gameRule.ts`**: Models general rulebook sections, turn phases, and default priority hierarchies.
3. **`interactionConflict.ts`**: Connects conflicting cards/rules with official designer rulings, errata overrides, and resolution priorities.

---

## Step 2: Content Seeding & Studio Configuration

### Environment Setup
Configured `.env.local` in the project root:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID="your_project_id_here"
NEXT_PUBLIC_SANITY_DATASET="production"
```

### Local Sanity Studio Access
Embedded studio runs locally at:  http://localhost:3000/studio


### Published Seed Data

**Game Card 1:**
- **Name:** Mirror Shield
- **Card ID:** mirror-shield
- **Effect Text:** Reflects any incoming spell back at the caster.

**Game Card 2:**
- **Name:** Piercing Bolt
- **Card ID:** piercing-bolt
- **Effect Text:** Deals 5 damage. Unblockable by shields.

**Interaction Conflict:**
- **Title:** Mirror Shield vs. Piercing Bolt
- **Involved Cards:** Mirror Shield, Piercing Bolt
- **Official Ruling:** Piercing Bolt bypasses Mirror Shield completely because unblockable effects take priority over passive reflection.
- **Resolution Priority:** Negation / "Cannot" Takes Precedence

---

## Step 3: GROQ Conflict Resolver API

Created a deterministic GROQ fetcher and Next.js API endpoint to query card mechanics and linked interaction conflicts in real-time.

### GROQ Query Architecture (`sanity/lib/getConflicts.ts`)
* Filters target cards by slug or name matching.
* Dereferences linked `interactionConflict` documents where the cards are referenced.
* Expands related cards and core rules dynamically.

### API Endpoint (`app/api/resolve-conflict/route.ts`)
* **Endpoint:** `GET /api/resolve-conflict?card1={card1}&card2={card2}`
* **Response:** Returns structured JSON containing card text, official rulings, and priority hierarchy.
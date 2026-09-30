import { createClient } from 'next-sanity';

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

export const agentToolDeclarations = [
  {
    type: 'function',
    function: {
      name: 'lookupCards',
      description: 'Search Sanity for card mechanics and effect text using card names or keywords.',
      parameters: {
        type: 'object',
        properties: {
          cardNames: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of card names to look up.',
          },
        },
        required: ['cardNames'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookupConflicts',
      description: 'Search for explicit errata or official interaction rulings linked to specific cards.',
      parameters: {
        type: 'object',
        properties: {
          cardIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of card slugs or IDs.',
          },
        },
        required: ['cardIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getRulePriority',
      description: 'Fetch general game rule priority levels (e.g., active player priority, negation hierarchy).',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Category such as phase, priority, cost, or combat.',
          },
        },
      },
    },
  },
];

export async function executeAgentTool(name: string, args: any) {
  if (name === 'lookupCards') {
    const query = `*[_type == "gameCard" && (name match $names || cardId.current in $cardNames)]{
      _id, name, "cardId": cardId.current, cardType, triggerPhase, keywords, effectText
    }`;
    const namesPattern = args.cardNames.map((n: string) => `${n}*`).join(' ');
    return await sanityClient.fetch(query, { names: namesPattern, cardNames: args.cardNames });
  }

  if (name === 'lookupConflicts') {
    const query = `*[_type == "interactionConflict" && count((involvedCards[]->cardId.current)[@ in $cardIds]) > 0]{
      _id, title, conflictDescription, officialRuling, resolutionPriority,
      "involvedCards": involvedCards[]->{ name, "cardId": cardId.current }
    }`;
    return await sanityClient.fetch(query, { cardIds: args.cardIds });
  }

  if (name === 'getRulePriority') {
    const query = `*[_type == "gameRule" ${args.category ? '&& category == $category' : ''}] | order(priorityOrder asc){
      ruleTitle, ruleCode, category, priorityOrder, ruleText
    }`;
    return await sanityClient.fetch(query, { category: args.category || '' });
  }

  throw new Error(`Unknown tool: ${name}`);
}
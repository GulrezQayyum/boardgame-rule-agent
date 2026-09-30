import { createClient } from 'next-sanity';

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false, // Set to false to immediately reflect published studio changes
});

export async function fetchCardConflictContext(card1: string, card2: string) {
  const query = `
    *[
      _type == "gameCard" && 
      (name match $card1 || name match $card2 || cardId.current in [$card1, $card2])
    ]{
      _id,
      name,
      "cardId": cardId.current,
      cardType,
      effectText,
      "conflicts": *[
        _type == "interactionConflict" && 
        references(^._id)
      ]{
        _id,
        title,
        conflictDescription,
        officialRuling,
        resolutionPriority,
        "otherInvolvedCards": involvedCards[]->{
          _id,
          name,
          "cardId": cardId.current,
          effectText
        }
      }
    }
  `;

  const results = await sanityClient.fetch(query, {
    card1: `${card1}*`,
    card2: `${card2}*`,
  });

  return results;
}
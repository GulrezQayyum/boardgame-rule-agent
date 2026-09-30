import { defineArrayMember, defineField, defineType } from 'sanity';

export const interactionConflict = defineType({
  name: 'interactionConflict',
  title: 'Interaction Conflict / Errata',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Conflict Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'involvedCards',
      title: 'Involved Cards',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'gameCard' }] })],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'conflictDescription',
      title: 'The Paradox / Question',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'officialRuling',
      title: 'Official Resolution / Errata Ruling',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'governingRule',
      title: 'Governing Rule Priority',
      type: 'reference',
      to: [{ type: 'gameRule' }],
      description: 'Links this conflict directly to a structured rule priority in the rulebook.',
    }),
  ],
});
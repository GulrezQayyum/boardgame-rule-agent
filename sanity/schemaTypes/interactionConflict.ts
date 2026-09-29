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
      description: 'Short summary of the dispute (e.g., "Mirror Shield vs. Piercing Bolt")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'involvedCards',
      title: 'Involved Cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'gameCard' }],
        }),
      ],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'involvedRules',
      title: 'Related Core Rules',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'gameRule' }],
        }),
      ],
    }),
    defineField({
      name: 'conflictDescription',
      title: 'The Paradox / Question',
      type: 'text',
      rows: 3,
      description: 'Why do these cards/rules conflict?',
    }),
    defineField({
      name: 'officialRuling',
      title: 'Official Resolution / Errata Ruling',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.required(),
      description: 'The authoritative answer from designers or tournament FAQ.',
    }),
    defineField({
      name: 'resolutionPriority',
      title: 'Resolution Hierarchy',
      type: 'string',
      options: {
        list: [
          { title: 'Errata Overrides Card Text', value: 'errata_override' },
          { title: 'Specific Card Ability Overrides General Rule', value: 'card_overrides_rule' },
          { title: 'Simultaneous Effects Trigger Active Player First', value: 'active_player_first' },
          { title: 'Negation / "Cannot" Takes Precedence', value: 'negation_precedence' },
        ],
      },
    }),
  ],
});
import { defineArrayMember, defineField, defineType } from 'sanity';

export const gameCard = defineType({
  name: 'gameCard',
  title: 'Game Card',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Card Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cardId',
      title: 'Card Identifier / Code',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cardType',
      title: 'Card Type',
      type: 'string',
      options: {
        list: [
          { title: 'Spell / Event', value: 'spell' },
          { title: 'Creature / Unit', value: 'creature' },
          { title: 'Item / Artifact', value: 'item' },
          { title: 'Reaction / Instant', value: 'instant' },
        ],
      },
    }),
    defineField({
      name: 'triggerPhase',
      title: 'Trigger / Activation Phase',
      type: 'string',
      options: {
        list: [
          { title: 'Passive / Continuous', value: 'passive' },
          { title: 'On Play / Entry', value: 'on_play' },
          { title: 'Start of Turn / Upkeep', value: 'start_of_turn' },
          { title: 'End of Turn', value: 'end_of_turn' },
          { title: 'On Reaction / Triggered', value: 'reaction' },
        ],
      },
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords / Tags',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'effectText',
      title: 'Official Printed Text',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'cardType',
    },
  },
});
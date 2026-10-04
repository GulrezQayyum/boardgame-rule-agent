import { defineField, defineType } from 'sanity';

export const gameRule = defineType({
  name: 'gameRule',
  title: 'Game Rule',
  type: 'document',
  fields: [
    defineField({
      name: 'ruleTitle',
      title: 'Rule Title / Section',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ruleCode',
      title: 'Section Reference ID (e.g. 401.2a)',
      type: 'string',
    }),
    defineField({
      name: 'category',
      title: 'Rule Category',
      type: 'string',
      options: {
        list: [
          { title: 'Turn Structure & Phases', value: 'phase' },
          { title: 'Priority & Stacking', value: 'priority' },
          { title: 'Cost & Payment', value: 'cost' },
          { title: 'Combat & Damage', value: 'combat' },
          { title: 'Keyword Mechanics', value: 'keyword' },
        ],
      },
    }),
    defineField({
      name: 'ruleText',
      title: 'Rule Description',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'priorityOrder',
      title: 'Default Priority Level (Lower = Precedes General Rule)',
      type: 'number',
      initialValue: 100,
    }),
  ],
});
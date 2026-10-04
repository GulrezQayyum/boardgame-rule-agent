import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import { apiVersion, dataset, projectId } from './sanity/env'
import { schemaTypes } from './sanity/schemaTypes' // Changed from { schema } to { schemaTypes }
import { structure } from './sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  apiVersion,

  schema: {
    types: schemaTypes, // Changed from schema.types to schemaTypes
  },

  plugins: [
    structureTool({ structure }),
  ],
})
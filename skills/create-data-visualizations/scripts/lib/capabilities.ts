export const capabilities = {
  name: 'create-data-visualizations',
  version: '3.0.0',
  commands: [
    {
      name: 'capabilities',
      description: 'List commands, schemas, instructions, and external requirements.',
      input: { type: 'object', additionalProperties: false },
      output: {
        envelopeSchema: 'command-result',
        dataSchema: { $ref: 'schemas/capabilities.schema.json' },
      },
      requires: ['Bun runtime'],
    },
    {
      name: 'schema',
      description: 'Return a bundled JSON Schema by name.',
      input: {
        type: 'object',
        additionalProperties: false,
        required: ['name'],
        properties: { name: { enum: ['chart-spec', 'command-result', 'capabilities', 'diagnostic'] } },
      },
      output: {
        envelopeSchema: 'command-result',
        dataSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'schema'],
          properties: { name: { type: 'string' }, schema: { type: 'object' } },
        },
      },
      requires: ['Bun runtime'],
    },
    {
      name: 'validate-spec',
      description: 'Validate a chart specification and its semantic invariants.',
      input: {
        type: 'object',
        additionalProperties: false,
        required: ['file'],
        properties: { file: { type: 'string', description: "Path or '-' for stdin" } },
      },
      output: {
        envelopeSchema: 'command-result',
        dataSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['file', 'schema'],
          properties: { file: { type: 'string' }, schema: { const: 'chart-spec@2.0' } },
        },
      },
      requires: ['Bun runtime'],
    },
    {
      name: 'catalog',
      description: 'List, preview, and test stories in the Aperture Ladle catalog.',
      input: {
        type: 'object',
        additionalProperties: false,
        required: ['operation'],
        properties: {
          operation: { enum: ['status', 'list', 'preview', 'test'] },
          ids: { type: 'array', items: { type: 'string' }, description: 'Story IDs from catalog list' },
          url: { type: 'string', format: 'uri', description: 'Ladle catalog URL for status, list, and preview' },
          repo: { type: 'string', description: 'Aperture checkout for test' },
        },
      },
      output: {
        envelopeSchema: 'command-result',
        dataSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            storyCount: { type: 'integer' },
            stories: { type: 'array', items: { type: 'object' } },
            repo: { type: 'string' },
            passed: { type: 'array', items: { type: 'string' } },
            skipped: { type: 'array', items: { type: 'string' } },
            failed: { type: 'array', items: { type: 'object' } },
          },
        },
      },
      requires: ['Bun runtime', 'Running Ladle catalog for status, list, and preview', 'Aperture checkout and pnpm for test'],
    },
  ],
  schemas: ['chart-spec', 'command-result', 'capabilities', 'diagnostic'],
  instructions: [
    'Read the skill references before implementation.',
    'Validate a chart specification for non-trivial work.',
    'Use Aperture for React when available.',
    'Use catalog previews and story tests after React visual changes.',
    'Redirect standalone report work to create-data-reports.',
  ],
} as const

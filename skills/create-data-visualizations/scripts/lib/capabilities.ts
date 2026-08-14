export const capabilities = {
  name: 'create-data-visualizations',
  version: '1.0.0',
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
          properties: { file: { type: 'string' }, schema: { const: 'chart-spec@1.0' } },
        },
      },
      requires: ['Bun runtime'],
    },
    {
      name: 'audit-html',
      description: 'Audit standalone HTML structure, accessibility, and delivery integrity.',
      input: {
        type: 'object',
        additionalProperties: false,
        required: ['file', 'delivery'],
        properties: {
          file: { type: 'string' },
          delivery: { enum: ['single-file', 'bundle'] },
        },
      },
      output: {
        envelopeSchema: 'command-result',
        dataSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['file', 'delivery'],
          properties: {
            file: { type: 'string' },
            delivery: { enum: ['single-file', 'bundle'] },
          },
        },
      },
      requires: ['Bun runtime'],
    },
    {
      name: 'storybook',
      description: 'Use Aperture Storybook documentation, preview, and test tools.',
      input: {
        type: 'object',
        required: ['operation'],
        properties: {
          operation: { enum: ['status', 'instructions', 'list', 'docs', 'preview', 'test'] },
          ids: { type: 'array', items: { type: 'string' } },
          withStoryIds: { type: 'boolean' },
          url: { type: 'string', format: 'uri' },
        },
      },
      output: {
        envelopeSchema: 'command-result',
        dataSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['url', 'result'],
          properties: { url: { type: 'string' }, result: {} },
        },
      },
      requires: ['Bun runtime', 'Running Storybook MCP endpoint for the target project'],
    },
  ],
  schemas: ['chart-spec', 'command-result', 'capabilities', 'diagnostic'],
  instructions: [
    'Read the skill references before implementation.',
    'Validate a chart specification for non-trivial work.',
    'Use Aperture for React when available.',
    'Use Storybook tools after React visual changes.',
    'Audit standalone HTML before handoff.',
  ],
} as const

import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Apps orchestrate libraries; libraries never depend on apps,
            // and apps never depend on other apps (target-architecture.md §2).
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:app',
                'platform:agnostic',
                'platform:browser',
                'platform:server',
                'platform:any',
              ],
              notDependOnLibsWithTags: ['type:app'],
            },
            // Fundamental libs (domain, contracts, document-model, quality)
            // stay framework-free: they may only depend on other agnostic libs.
            {
              sourceTag: 'platform:agnostic',
              onlyDependOnLibsWithTags: ['platform:agnostic'],
            },
            // Frontend libs must never pull in server-only code
            // (provider SDKs, export renderers, server auth internals).
            {
              sourceTag: 'platform:browser',
              onlyDependOnLibsWithTags: [
                'platform:browser',
                'platform:any',
                'platform:agnostic',
              ],
            },
            // Server libs stay off the browser platform.
            {
              sourceTag: 'platform:server',
              onlyDependOnLibsWithTags: [
                'platform:server',
                'platform:any',
                'platform:agnostic',
              ],
            },
            // Platform-neutral feature libs avoid both browser- and server-only libs.
            {
              sourceTag: 'platform:any',
              onlyDependOnLibsWithTags: ['platform:any', 'platform:agnostic'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];

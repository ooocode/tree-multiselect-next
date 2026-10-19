import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'demo/dist/**',
      '.superpowers/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/linebreak-style': ['error', 'unix'],
      'prefer-const': 'off',
      'no-var': 'off',
      // jQuery handlers bind `this` to the DOM element, so `let self = this` is
      // the only way to reach the Tree instance from inside them. The migrated
      // code keeps the original names.
      '@typescript-eslint/no-this-alias': ['error', { allowedNames: ['self', '$originalSelect'] }]
    }
  }
);

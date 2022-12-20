module.exports = {
  root: true,
  extends: ['alloy', 'alloy/typescript', 'plugin:vue/vue3-recommended', './.eslintrc-auto-import.json'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly',
  },
  rules: {
    'vue/html-indent': ['warn', 2],
    'vue/multi-word-component-names': 'off',

    // make possible `/// <reference...`
    'spaced-comment': ['error', 'always', { markers: ['/'] }],

    'no-unused-vars': 'warn',
    'no-duplicate-imports': 'off',

    'sort-imports': [
      'warn',
      {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        allowSeparatedGroups: true,
      },
    ],
  },
  overrides: [
    {
      files: ['**/cypress/**/*.{j,t}s', '**/*.cy.{js,ts}'],
      plugins: ['cypress'],
      extends: ['plugin:cypress/recommended'],
      env: {
        'cypress/globals': true,
      },
    },
  ],
}

// ESLint configuration for TypeScript-based k6 performance tests
module.exports = {
  // Use TypeScript parser to understand TypeScript syntax
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Specify ECMAScript version
    ecmaVersion: 2020,
    // Allow use of imports
    sourceType: 'module',
  },
  // Extend recommended configurations
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  // Add TypeScript-specific plugin
  plugins: ['@typescript-eslint'],
  // Define the environment where code will run
  env: {
    node: true,
    es6: true,
  },
  // Custom rules for k6 performance testing
  rules: {
    // Allow console.log in performance tests (useful for debugging)
    'no-console': 'off',
    // Disable unused vars but warn on unused function parameters
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Allow explicit 'any' type when necessary (sometimes needed with k6 APIs)
    '@typescript-eslint/no-explicit-any': 'warn',
    // Require consistent return types
    '@typescript-eslint/explicit-function-return-type': 'off',
    // Allow empty functions (sometimes needed in k6 lifecycle hooks)
    '@typescript-eslint/no-empty-function': 'warn',
  },
  // Global variables provided by k6 runtime
  globals: {
    __ENV: 'readonly',
    __VU: 'readonly',
    __ITER: 'readonly',
  },
};


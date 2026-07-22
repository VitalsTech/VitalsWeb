import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // This project hand-rolls data fetching (no react-query/SWR), so the
      // classic "reset state, then fetch in an effect" pattern from React's
      // own docs (https://react.dev/learn/you-might-not-need-an-effect) is
      // used throughout src/lib/useAsyncData.ts and the API hooks. The
      // React-Compiler-oriented `set-state-in-effect` rule flags that
      // idiomatic pattern, so it's downgraded to a warning here.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
);

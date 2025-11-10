import { jsdoc } from 'eslint-plugin-jsdoc';
import config, { browser } from 'eslint-config-coinspace';


/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  ...browser,
  {
    languageOptions: {
      ecmaVersion: 2025,
    },
  },
  jsdoc({
    config: 'flat/recommended',
  }),
];

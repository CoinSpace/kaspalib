import { jsdoc } from 'eslint-plugin-jsdoc';
import config, { browser } from 'eslint-config-coinspace';


/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  ...browser,
  jsdoc({
    config: 'flat/recommended',
  }),
];

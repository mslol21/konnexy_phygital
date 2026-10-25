import next from 'eslint-config-next/core-web-vitals';
export default [
  ...next,
  { ignores: ['.next/**', 'node_modules/**'] },
  { rules: { '@next/next/no-img-element': 'off', 'react-hooks/set-state-in-effect': 'off', 'no-eval': 'error', 'no-implied-eval': 'error', 'no-new-func': 'error' } }
];

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true, // Include this if not already done
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react'],
  rules: {
    // You can add your custom rules here
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  globals: {
    require: 'readonly', // Define 'require' as a global
    global: 'readonly', // Define 'global' as a global
  },
};

// jest.setup.js

// Polyfill for TextEncoder and TextDecoder
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock for import.meta.env (just for safety)
globalThis.importMeta = {
  env: {
    VITE_FIREBASE_API_KEY: 'fake-api-key',
  },
};

/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // use global test APIs like `describe`, `it`, etc.
    environment: 'jsdom', // simulate DOM
    setupFiles: './test/setup.ts', // custom setup (like importing jest-dom)
    include: ['src/**/**/*.test.{ts,tsx}'], // test file patterns
  },
});

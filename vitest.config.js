import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, 
    environment: 'node', 
    // run tests in single thread to prevent parallel MongoDB interference during CI/local runs
    threads: false,
  },
});
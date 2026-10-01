// Minimal config so `npx vitest` runs anywhere without repo-specific setup.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The report is printed by the harness via console.log; keep it visible.
    reporters: ['verbose'],
  },
});

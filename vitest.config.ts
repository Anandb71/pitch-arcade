import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { execArgv: ['--experimental-sqlite'], include: ['packages/**/*.test.ts', 'tests/**/*.test.ts', 'apps/**/*.test.ts'] } });

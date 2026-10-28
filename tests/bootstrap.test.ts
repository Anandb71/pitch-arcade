import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
test('workspace uses npm and strict TypeScript', () => {
 expect(JSON.parse(readFileSync('package.json', 'utf8')).workspaces).toEqual(['packages/*', 'apps/*']);
 expect(JSON.parse(readFileSync('tsconfig.json', 'utf8')).compilerOptions.strict).toBe(true);
});

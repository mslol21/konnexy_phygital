import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  resolve: { alias: {
    '@': local('./src'),
    'server-only': local('./tests/server-only.ts'),
    'sonner': local('./src/lib/ui-primitives/sonner.tsx'),
    'framer-motion': local('./src/lib/ui-primitives/framer-motion.tsx'),
  } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], hookTimeout: 30000 },
});

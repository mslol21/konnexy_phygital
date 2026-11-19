import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || 'https://auth.neon.tech',
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'konnexy-dev-cookie-secret-min-32-chars-key!',
    sessionDataTtl: 60,
  },
});

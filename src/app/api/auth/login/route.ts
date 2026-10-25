import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth/sign-in';
import { assertSameOrigin, readJson, apiError } from '@/lib/api';
import { checkRateLimit, extractClientIp, AUTH_LOGIN_RATE_LIMIT, buildRateLimitExceededResponse } from '@/lib/security/rate-limiter';
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const limit = await checkRateLimit(extractClientIp(req), AUTH_LOGIN_RATE_LIMIT);
    if (!limit.allowed) return buildRateLimitExceededResponse(limit, AUTH_LOGIN_RATE_LIMIT);
    const result = await signIn(await readJson(req));
    const response = NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.delete('konnexy_role');
    response.cookies.delete('konnexy_sig');
    return response;
  } catch (error) { return apiError(error); }
}

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
export interface RateLimitConfig { namespace:string; maxRequests:number; windowMs:number; errorMessage:string }
export interface RateLimitResult { allowed:boolean; limit:number; remaining:number; resetAtMs:number; retryAfterSeconds:number }
export function extractClientIp(req:NextRequest):string {
  const raw = process.env.VERCEL ? req.headers.get('x-vercel-forwarded-for') || req.headers.get('x-real-ip') : req.headers.get('x-real-ip');
  return raw?.split(',')[0]?.trim().replace(/[^0-9a-fA-F.:]/g,'').slice(0,45) || 'unknown';
}
export async function checkRateLimit(identifier:string,config:RateLimitConfig):Promise<RateLimitResult> {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${config.namespace}:${identifier}`));
  const key=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const {data,error}=await createAdminClient().rpc('consume_rate_limit',{bucket_key:key,max_requests:config.maxRequests,window_ms:config.windowMs});
  if(error || !data) throw new Error('Não foi possível validar o limite de solicitações.');
  const row=Array.isArray(data)?data[0]:data;
  return {allowed:row.allowed,limit:config.maxRequests,remaining:Number(row.remaining),resetAtMs:new Date(row.resets_at).getTime(),retryAfterSeconds:Math.max(1,Math.ceil((new Date(row.resets_at).getTime()-Date.now())/1000))};
}
export function buildRateLimitExceededResponse(result:RateLimitResult,config:RateLimitConfig) {
  return NextResponse.json({error:config.errorMessage},{status:429,headers:{'Retry-After':String(result.retryAfterSeconds),'Cache-Control':'no-store'}});
}
export const AUTH_LOGIN_RATE_LIMIT:RateLimitConfig={namespace:'auth-login',maxRequests:5,windowMs:900000,errorMessage:'Muitas tentativas. Aguarde 15 minutos e tente novamente.'};
export const AI_REVIEWS_RATE_LIMIT:RateLimitConfig={namespace:'ai-reviews',maxRequests:5,windowMs:600000,errorMessage:'Limite de revisões atingido. Você pode continuar com seu próprio texto.'};

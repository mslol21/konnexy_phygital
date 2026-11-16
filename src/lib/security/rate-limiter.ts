import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface RateLimitConfig {namespace:string;maxRequests:number;windowMs:number;errorMessage:string}
export interface RateLimitResult {allowed:boolean;limit:number;remaining:number;resetAtMs:number;retryAfterSeconds:number}
export function extractClientIp(req:NextRequest):string {
  const raw=process.env.VERCEL ? req.headers.get('x-vercel-forwarded-for')||req.headers.get('x-real-ip') : req.headers.get('x-real-ip');
  return raw?.split(',')[0]?.trim().replace(/[^0-9a-fA-F.:]/g,'').slice(0,45)||'unknown';
}
export async function checkRateLimit(identifier:string,config:RateLimitConfig):Promise<RateLimitResult> {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(config.namespace+':'+identifier));
  const key=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const rows=await query<{hits:number;expires_at:string}>(
    'INSERT INTO public.request_limits(key,hits,expires_at)'+
    ' VALUES($1,1,now()+($2::integer * interval '+ "'1 millisecond'"+'))'+
    ' ON CONFLICT(key) DO UPDATE SET'+
    ' hits=CASE WHEN public.request_limits.expires_at<=now() THEN 1 ELSE public.request_limits.hits+1 END,'+
    ' expires_at=CASE WHEN public.request_limits.expires_at<=now() THEN EXCLUDED.expires_at ELSE public.request_limits.expires_at END'+
    ' RETURNING hits,expires_at',
    [key,config.windowMs]
  );
  const row=rows[0];
  const resetAtMs=new Date(row.expires_at).getTime();
  return {allowed:row.hits<=config.maxRequests,limit:config.maxRequests,
    remaining:Math.max(0,config.maxRequests-row.hits),resetAtMs,
    retryAfterSeconds:Math.max(1,Math.ceil((resetAtMs-Date.now())/1000))};
}
export function buildRateLimitExceededResponse(result:RateLimitResult,config:RateLimitConfig){
  return NextResponse.json({error:config.errorMessage},{status:429,headers:{
    'Retry-After':String(result.retryAfterSeconds),'Cache-Control':'no-store'
  }});
}
export const AUTH_LOGIN_RATE_LIMIT:RateLimitConfig={namespace:'auth-login',maxRequests:5,windowMs:900000,errorMessage:'Muitas tentativas. Aguarde 15 minutos e tente novamente.'};
export const AI_REVIEWS_RATE_LIMIT:RateLimitConfig={namespace:'ai-reviews',maxRequests:5,windowMs:600000,errorMessage:'Limite de revisões atingido. Você pode continuar com seu próprio texto.'};

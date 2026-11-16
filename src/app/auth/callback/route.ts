import { NextRequest, NextResponse } from 'next/server';
export async function GET(req:NextRequest){
  const token=req.nextUrl.searchParams.get('token');
  if(token){
    const next=new URL('/reset-password',req.url);
    next.searchParams.set('token',token);
    return NextResponse.redirect(next);
  }
  return NextResponse.redirect(new URL('/forgot-password?error=expired',req.url));
}

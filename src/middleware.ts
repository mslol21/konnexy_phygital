import { NextRequest, NextResponse } from 'next/server';
// A sessão é validada no servidor pelas páginas e APIs protegidas.
// Nunca delegar autorização apenas ao middleware.
export function middleware(req:NextRequest){
  const response=NextResponse.next();
  if(/^\/(dashboard|super-admin|admin|api\/manage)(\/|$)/.test(req.nextUrl.pathname))
    response.headers.set('Cache-Control','private, no-store');
  return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|logos/|covers/).*)']};

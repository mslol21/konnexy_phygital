// Guardião estrito de Server-Side: impede que módulos contendo chaves secretas
// (SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY) sejam importados acidentalmente em Client Components.
if (typeof window !== 'undefined') {
  throw new Error(
    '[SECURITY VIOLATION - server-only]: Este módulo contém segredos de servidor e jamais pode ser importado no Client-Side (Browser).'
  );
}

export {};

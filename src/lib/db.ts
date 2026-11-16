import 'server-only';
import { neon } from '@neondatabase/serverless';

/**
 * Retorna dados serializáveis de forma consistente com a antiga API REST.
 * O driver PostgreSQL retorna Date nativos para DATE/TIMESTAMPTZ;
 * componentes client e JSX esperam strings, não instâncias de Date.
 */
export async function query<T = Record<string, unknown>>(
  statement: string,
  parameters: unknown[] = []
): Promise<T[]> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Conexão Neon indisponível.');
  const sql = neon(url);
  const rows = await sql.query(statement, parameters as any[]);
  return JSON.parse(JSON.stringify(rows)) as T[];
}

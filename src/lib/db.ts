import 'server-only';
import { neon } from '@neondatabase/serverless';

export async function query<T = Record<string, unknown>>(
  statement: string,
  parameters: unknown[] = []
): Promise<T[]> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Conexão Neon indisponível.');
  const sql = neon(url);
  return await sql.query(statement, parameters as any[]) as T[];
}

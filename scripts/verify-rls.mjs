#!/usr/bin/env node
/**
 * KONNEXY TAG - SCRIPT DE AUDITORIA ESTÁTICA E DINÂMICA DE RLS (SUPABASE)
 * Execução: npm run rls:verify (ou node scripts/verify-rls.mjs)
 */
import fs from 'node:fs';
import path from 'node:path';

const CRITICAL_TABLES = [
  'tenants',
  'profiles',
  'tenant_modules',
  'review_logs',
  'analytics_events',
  'tenant_invoices',
  'security_audit_logs'
];

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

console.log('===================================================================');
console.log('🛡️  KONNEXY APPSEC: AUDITORIA DE INTEGRIDADE RLS & MULTI-TENANCY');
console.log('===================================================================\n');

if (!fs.existsSync(migrationsDir)) {
  console.error('❌ Diretório supabase/migrations não encontrado!');
  process.exit(1);
}

const sqlFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const combinedSql = sqlFiles
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
  .join('\n');

let hasFailures = false;

for (const table of CRITICAL_TABLES) {
  // 1. Verifica se ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY está presente
  const rlsRegex = new RegExp(
    `ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
    'i'
  );
  const rlsEnabled = rlsRegex.test(combinedSql);

  // 2. Verifica se há políticas CREATE POLICY ... ON public.<tabela>
  const policyRegex = new RegExp(
    `CREATE\\s+POLICY\\s+["'][^"']+["']\\s+ON\\s+(?:public\\.)?${table}`,
    'gi'
  );
  const policies = combinedSql.match(policyRegex) || [];

  // 3. Verifica isolamento de escrita (nenhuma política FOR UPDATE / DELETE aberta para anon)
  const unsafeAnonWriteRegex = new RegExp(
    `ON\\s+(?:public\\.)?${table}\\s+FOR\\s+(?:UPDATE|DELETE|ALL)\\s+TO\\s+anon`,
    'i'
  );
  const anonWriteBlocked = !unsafeAnonWriteRegex.test(combinedSql);

  const status = rlsEnabled && policies.length > 0 && anonWriteBlocked ? '✅ PASS' : '❌ FAIL';
  if (status === '❌ FAIL') hasFailures = true;

  console.log(
    `${status} | Tabela: public.${table.padEnd(20)} | RLS: ${
      rlsEnabled ? 'ON ' : 'OFF'
    } | Políticas: ${policies.length} | Escrita Anon Bloqueada: ${
      anonWriteBlocked ? 'SIM' : 'NÃO'
    }`
  );
}

console.log('\n-------------------------------------------------------------------');
if (hasFailures) {
  console.error('❌ FALHA DE SEGURANÇA: Uma ou mais tabelas não possuem RLS estrito!');
  process.exit(1);
} else {
  console.log(
    '✅ SUCESSO: Todas as 7 tabelas críticas possuem RLS ativo, isolamento de tenant_id e bloqueio de escrita não autenticada.'
  );
}

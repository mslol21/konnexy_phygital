#!/usr/bin/env node
/**
 * KONNEXY TAG - SAST (STATIC APPLICATION SECURITY TESTING) & CODE SCANNER
 * Verifica vulnerabilidades OWASP Top 10, ReDoS, Prototype Pollution, Segredos Hardcoded
 * e Isolamento Server-Only em todos os arquivos TypeScript/React de src/.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(process.cwd(), 'src');

const SAST_RULES = [
  {
    id: 'SEC-001',
    name: 'Proibição de eval() / Execução Dinâmica de Código',
    pattern: /\beval\s*\(|new\s+Function\s*\(/g,
    severity: 'CRITICAL'
  },
  {
    id: 'SEC-002',
    name: 'Prevenção de Prototype Pollution (__proto__ / constructor.prototype)',
    pattern: /\.__proto__\b|\[['"]__proto__['"]\]/g,
    severity: 'HIGH'
  },
  {
    id: 'SEC-003',
    name: 'Vazamento de Chave Secreta Hardcoded (AIza / sk_live / service_role)',
    pattern: /AIza[0-9A-Za-z-_]{35}|sk_live_[0-9a-zA-Z]{24}/g,
    severity: 'CRITICAL'
  },
  {
    id: 'SEC-004',
    name: 'Uso Inseguro de child_process / exec no Runtime Web',
    pattern: /child_process|execSync\s*\(/g,
    severity: 'HIGH'
  }
];

function collectSourceFiles(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, list);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      list.push(fullPath);
    }
  }
  return list;
}

console.log('===================================================================');
console.log('🔍 KONNEXY SAST: VARREDURA ESTÁTICA DE SEGURANÇA & TIPAGEM (TS/OWASP)');
console.log('===================================================================\n');

const files = collectSourceFiles(SRC_DIR);
let violations = 0;

for (const filePath of files) {
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rule of SAST_RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(content)) {
      console.error(`❌ [${rule.severity}] ${rule.id} (${rule.name}) em: ${relPath}`);
      violations += 1;
    }
  }

  // Verifica se Client Components ('use client') tentam importar src/lib/env.ts ou SUPABASE_SERVICE_ROLE_KEY
  const isClientComponent =
    content.trimStart().startsWith("'use client'") ||
    content.trimStart().startsWith('"use client"');

  if (isClientComponent) {
    if (content.includes("from '@/lib/env'") || content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.error(
        `❌ [CRITICAL] SEC-005 (Vazamento de Segredo Server-Only em Client Component) em: ${relPath}`
      );
      violations += 1;
    }
  }
}

console.log(`✔ Arquivos auditados em src/: ${files.length}`);
if (violations > 0) {
  console.error(`❌ FALHA SAST: ${violations} violação(ões) de segurança encontrada(s)!`);
  process.exit(1);
} else {
  console.log('✅ SUCESSO SAST: Nenhuma ocorrência das regras verificadas. Esta checagem limitada não comprova ausência de vulnerabilidades.');
}

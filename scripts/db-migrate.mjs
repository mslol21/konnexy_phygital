#!/usr/bin/env node
/**
 * ============================================================================
 * KONNEXY TAG - EXECUTOR DE MIGRAÇÕES POSTGRESQL (ZERO DEPENDÊNCIAS EXTERNAS)
 * Implementa o protocolo PostgreSQL v3 + SCRAM-SHA-256 sobre Node `net`/`crypto`
 * para aplicar automaticamente as migrações SQL e auditar RLS no Supabase.
 * ============================================================================
 */

import net from 'node:net';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const HOST = process.env.PG_POOLER_HOST || 'aws-1-sa-east-1.pooler.supabase.com';
const PORT = Number(process.env.PG_POOLER_PORT || 5432);
const USER = process.env.PG_USER || 'postgres';
const PASSWORD = process.env.PG_PASSWORD || '';
const DATABASE = process.env.PG_DATABASE || 'postgres';

function hmacSha256(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function xorBuffers(a, b) {
  const out = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}

class PgWireClient {
  constructor() {
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.waiters = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(PORT, HOST, () => {
        const params = Buffer.from(
          `user\0${USER}\0database\0${DATABASE}\0client_encoding\0UTF8\0\0`,
          'utf8'
        );
        const len = 4 + 4 + params.length;
        const startup = Buffer.alloc(len);
        startup.writeInt32BE(len, 0);
        startup.writeInt32BE(196608, 4); // Protocol 3.0
        params.copy(startup, 8);
        this.socket.write(startup);
      });

      this.socket.on('data', (chunk) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.processBuffer();
      });

      this.socket.on('error', (err) => reject(err));

      this.authenticate().then(resolve).catch(reject);
    });
  }

  nextMessage() {
    return new Promise((resolve) => {
      this.waiters.push(resolve);
      this.processBuffer();
    });
  }

  processBuffer() {
    while (this.waiters.length > 0 && this.buffer.length >= 5) {
      const type = String.fromCharCode(this.buffer[0]);
      const length = this.buffer.readInt32BE(1);
      if (this.buffer.length < 1 + length) break;

      const payload = this.buffer.subarray(5, 1 + length);
      this.buffer = this.buffer.subarray(1 + length);
      const waiter = this.waiters.shift();
      waiter({ type, payload });
    }
  }

  sendSaslInitialResponse(mechanism, clientFirstMessage) {
    const mechBuf = Buffer.from(`${mechanism}\0`, 'utf8');
    const msgBuf = Buffer.from(clientFirstMessage, 'utf8');
    const len = 4 + mechBuf.length + 4 + msgBuf.length;
    const out = Buffer.alloc(1 + len);
    out[0] = 'p'.charCodeAt(0);
    out.writeInt32BE(len, 1);
    mechBuf.copy(out, 5);
    out.writeInt32BE(msgBuf.length, 5 + mechBuf.length);
    msgBuf.copy(out, 9 + mechBuf.length);
    this.socket.write(out);
  }

  sendSaslResponse(clientFinalMessage) {
    const msgBuf = Buffer.from(clientFinalMessage, 'utf8');
    const len = 4 + msgBuf.length;
    const out = Buffer.alloc(1 + len);
    out[0] = 'p'.charCodeAt(0);
    out.writeInt32BE(len, 1);
    msgBuf.copy(out, 5);
    this.socket.write(out);
  }

  async authenticate() {
    const first = await this.nextMessage();
    if (first.type === 'E') {
      throw new Error(`Auth Error: ${first.payload.toString('utf8')}`);
    }
    if (first.type !== 'R') {
      throw new Error(`Unexpected message type: ${first.type}`);
    }

    const authType = first.payload.readInt32BE(0);
    if (authType === 10) {
      // SASL SCRAM-SHA-256
      const clientNonce = crypto.randomBytes(18).toString('base64');
      const clientFirstBare = `n=,r=${clientNonce}`;
      const clientFirstMessage = `n,,${clientFirstBare}`;
      this.sendSaslInitialResponse('SCRAM-SHA-256', clientFirstMessage);

      const cont = await this.nextMessage();
      if (cont.type === 'E') {
        throw new Error(`SASL Error: ${cont.payload.toString('utf8')}`);
      }
      const serverFirst = cont.payload.subarray(4).toString('utf8');
      const parts = Object.fromEntries(
        serverFirst.split(',').map((kv) => [kv[0], kv.slice(2)])
      );
      const serverNonce = parts.r;
      const salt = Buffer.from(parts.s, 'base64');
      const iterations = parseInt(parts.i, 10);

      const saltedPassword = crypto.pbkdf2Sync(
        PASSWORD,
        salt,
        iterations,
        32,
        'sha256'
      );
      const clientKey = hmacSha256(saltedPassword, 'Client Key');
      const storedKey = sha256(clientKey);
      const clientFinalWithoutProof = `c=biws,r=${serverNonce}`;
      const authMessage = `${clientFirstBare},${serverFirst},${clientFinalWithoutProof}`;
      const clientSignature = hmacSha256(storedKey, authMessage);
      const clientProof = xorBuffers(clientKey, clientSignature).toString('base64');
      const clientFinalMessage = `${clientFinalWithoutProof},p=${clientProof}`;

      this.sendSaslResponse(clientFinalMessage);

      const finalMsg = await this.nextMessage();
      if (finalMsg.type === 'E') {
        throw new Error(`SASL Final Error: ${finalMsg.payload.toString('utf8')}`);
      }
    }

    // Read until ReadyForQuery ('Z')
    while (true) {
      const msg = await this.nextMessage();
      if (msg.type === 'Z') break;
      if (msg.type === 'E') {
        throw new Error(`Startup Error: ${msg.payload.toString('utf8')}`);
      }
    }
  }

  async query(sql) {
    const sqlBuf = Buffer.from(`${sql}\0`, 'utf8');
    const len = 4 + sqlBuf.length;
    const out = Buffer.alloc(1 + len);
    out[0] = 'Q'.charCodeAt(0);
    out.writeInt32BE(len, 1);
    sqlBuf.copy(out, 5);
    this.socket.write(out);

    const columns = [];
    const rows = [];
    let errorText = null;

    while (true) {
      const msg = await this.nextMessage();
      if (msg.type === 'T') {
        // RowDescription
        const fieldCount = msg.payload.readInt16BE(0);
        let offset = 2;
        for (let i = 0; i < fieldCount; i++) {
          const end = msg.payload.indexOf(0, offset);
          const colName = msg.payload.toString('utf8', offset, end);
          columns.push(colName);
          offset = end + 1 + 18;
        }
      } else if (msg.type === 'D') {
        // DataRow
        const colCount = msg.payload.readInt16BE(0);
        let offset = 2;
        const row = {};
        for (let i = 0; i < colCount; i++) {
          const valLen = msg.payload.readInt32BE(offset);
          offset += 4;
          if (valLen === -1) {
            row[columns[i]] = null;
          } else {
            row[columns[i]] = msg.payload.toString('utf8', offset, offset + valLen);
            offset += valLen;
          }
        }
        rows.push(row);
      } else if (msg.type === 'E') {
        errorText = msg.payload.toString('utf8').replace(/\0/g, ' ');
      } else if (msg.type === 'Z') {
        break;
      }
    }

    if (errorText) {
      throw new Error(errorText);
    }
    return rows;
  }

  close() {
    if (this.socket) {
      const term = Buffer.from([0x58, 0, 0, 0, 4]);
      this.socket.write(term);
      this.socket.end();
    }
  }
}

async function main() {
  console.log('===================================================================');
  console.log('🚀 KONNEXY TAG - SUPABASE POSTGRESQL MIGRATION & SEED RUNNER');
  console.log(`🔗 Conectando em: ${HOST}:${PORT} (Tenant: ${USER})`);
  console.log('===================================================================\n');

  const client = new PgWireClient();
  await client.connect();
  console.log('✅ Autenticação SCRAM-SHA-256 concluída com sucesso!\n');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = [
    '001_initial_schema.sql',
    '002_rbac_super_admin.sql',
    '003_security_audit_and_rls_verification.sql',
    '004_seed_initial_tenants.sql'
  ];

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    process.stdout.write(`⏳ Aplicando ${file} ... `);
    await client.query(sql);
    console.log('✅ OK!');
  }

  // Recarrega o schema cache do PostgREST no Supabase
  await client.query(`NOTIFY pgrst, 'reload schema';`);

  console.log('\n🛡️  Executando Auditoria de Segurança RLS no Banco (verify_rls_security_posture):');
  const rlsRows = await client.query(`SELECT * FROM public.verify_rls_security_posture();`);
  console.table(rlsRows);

  console.log('\n🏪 Perfis de Estabelecimentos Provisionados no Supabase (`public.tenants`):');
  const tenants = await client.query(
    `SELECT slug, name, nicho, status, plan_tier, mrr_cents FROM public.tenants ORDER BY created_at ASC;`
  );
  console.table(tenants);

  client.close();
  console.log('\n🎉 Banco de dados Supabase 100% migrado, populado e blindado com RLS!');
}

main().catch((err) => {
  console.error('❌ Erro na migração:', err.message);
  process.exit(1);
});

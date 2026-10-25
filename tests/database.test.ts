import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
// Real PostgreSQL engine; only Supabase-managed auth/storage scaffolding is emulated.
const db = new PGlite();
const admin='a0000000-0000-4000-8000-000000000001';
const owner='a0000000-0000-4000-8000-000000000002';
const stranger='a0000000-0000-4000-8000-000000000003';
let tenantId: string;
beforeAll(async () => {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  `);
  for (const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort()) {
    // gen_random_uuid is built in. pgcrypto itself is not used by these migrations.
    const sql=readFileSync(`supabase/migrations/${file}`,'utf8').replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/i,'');
    await db.exec(sql);
  }
  for (const id of [admin,owner,stranger]) await db.query(`insert into auth.users(id,email,raw_user_meta_data) values($1,$2,'{"role":"super_admin"}')`,[id,`${id}@example.test`]);
  await db.query(`update public.profiles set role='super_admin' where id=$1`,[admin]);
  const created=await db.query<{id:string}>(`select public.save_managed_tenant($1,null,$2::jsonb,null) as id`,[admin,JSON.stringify({slug:'real-store',name:'Real store',nicho:'Loja',primary_color:'#123456',plan_tier:'starter',mrr_cents:6700,owner_id:owner,owner_email:`${owner}@example.test`})]);
  tenantId=created.rows[0].id;
},30000);
afterAll(async()=>db.close());
describe('database isolation and persistence',()=>{
  it('ignores administrator privileges supplied in signup metadata',async()=>{
    const result=await db.query<{role:string}>('select role from public.profiles where id=$1',[owner]);
    expect(result.rows[0].role).toBe('tenant_admin');
  });
  it('marks all four examples as demo records without deleting them',async()=>{
    const result=await db.query<{count:number}>('select count(*)::integer as count from public.tenants where is_demo');
    expect(result.rows[0].count).toBe(4);
  });
  it('blocks anonymous direct table access and privileged RPCs',async()=>{
    await expect(db.transaction(async tx=>{await tx.exec('set local role anon');await tx.query('select * from public.tenants');})).rejects.toMatchObject({code:'42501'});
    await expect(db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select public.consume_rate_limit('forged',5,60000)");})).rejects.toMatchObject({code:'42501'});
  });
  it('exposes only owned tenants and modules to an authenticated owner',async()=>{
    await db.transaction(async tx=>{
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[owner]);
      expect((await tx.query<{id:string}>('select id from public.tenants')).rows).toEqual([{id:tenantId}]);
      const mods=await tx.query<{tenant_id:string}>('select distinct tenant_id from public.tenant_modules');
      expect(mods.rows).toEqual([{tenant_id:tenantId}]);
    });
  });
  it('exposes no tenants to another account and denies direct writes even for owners',async()=>{
    await db.transaction(async tx=>{
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[stranger]);
      expect((await tx.query('select id from public.tenants')).rows).toEqual([]);
    });
    await expect(db.transaction(async tx=>{
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[owner]);
      await tx.query("update public.tenants set plan_tier='enterprise' where id=$1",[tenantId]);
    })).rejects.toMatchObject({code:'42501'});
  });
  it('rechecks ownership in the service RPC and retains billing values for owners',async()=>{
    const payload={slug:'renamed-store',name:'Saved store',nicho:'Loja',primary_color:'#456789',plan_tier:'enterprise',mrr_cents:1,status:'canceled'};
    await expect(db.query('select public.save_managed_tenant($1,$2,$3::jsonb,null)',[stranger,tenantId,JSON.stringify(payload)])).rejects.toMatchObject({code:'42501'});
    await db.transaction(async tx=>{
      await tx.exec('set local role service_role');
      await tx.query('select public.save_managed_tenant($1,$2,$3::jsonb,$4::jsonb)',[owner,tenantId,JSON.stringify(payload),JSON.stringify([{module_type:'google_reviews',is_active:true,order_index:0,config_data:{}}])]);
    });
    const result=await db.query<{slug:string;plan_tier:string;mrr_cents:number;status:string}>('select slug,plan_tier,mrr_cents,status from public.tenants where id=$1',[tenantId]);
    expect(result.rows[0]).toEqual({slug:'renamed-store',plan_tier:'starter',mrr_cents:6700,status:'active'});
  });
  it('rolls back the tenant update if module persistence fails',async()=>{
    await expect(db.query('select public.save_managed_tenant($1,$2,$3::jsonb,$4::jsonb)',[owner,tenantId,JSON.stringify({slug:'must-not-save',name:'Broken',nicho:'Loja',primary_color:'#123456'}),JSON.stringify([{module_type:'invalid',is_active:true,order_index:0,config_data:{}}])])).rejects.toBeDefined();
    expect((await db.query<{slug:string}>('select slug from public.tenants where id=$1',[tenantId])).rows[0].slug).toBe('renamed-store');
  });
  it('uses durable counters and resets expired windows',async()=>{
    for (const allowed of [true,true,false]) {
      const result=await db.query<{allowed:boolean}>("select * from public.consume_rate_limit('test',2,60000)");
      expect(result.rows[0].allowed).toBe(allowed);
    }
    await db.exec("update private.request_limits set expires_at=now()-interval '1 second' where key='test'");
    expect((await db.query<{allowed:boolean}>("select * from public.consume_rate_limit('test',2,60000)")).rows[0].allowed).toBe(true);
  });
  it('counts observed events without manufacturing Google reviews',async()=>{
    await db.query("insert into public.analytics_events(tenant_id,event_type,source,module_type) values($1,'page_view','nfc',null),($1,'page_view','qr',null),($1,'module_click','qr','google_reviews')",[tenantId]);
    const result=await db.query<{views:number;nfc:number;qr:number;google_clicks:number}>('select * from public.tenant_metrics(array[$1]::uuid[])',[tenantId]);
    expect(result.rows[0]).toMatchObject({views:2,nfc:1,qr:1,google_clicks:1});
  });
});

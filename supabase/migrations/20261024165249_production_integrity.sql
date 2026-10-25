begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;
revoke all on function private.is_super_admin() from public, anon;
grant execute on function private.is_super_admin() to authenticated, service_role;

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,full_name,role)
  values(new.id,lower(coalesce(new.email,'')),new.raw_user_meta_data->>'full_name','tenant_admin')
  on conflict(id) do nothing;
  return new;
end;
$$;
alter function public.handle_updated_at() set search_path = '';
alter function public.seed_default_tenant_modules() set search_path = '';
alter function public.is_super_admin() set search_path = '';
alter function public.verify_rls_security_posture() set search_path = '';
revoke all on function public.handle_new_auth_user(), public.seed_default_tenant_modules(), public.is_super_admin(), public.verify_rls_security_posture() from public, anon, authenticated;
grant execute on function public.verify_rls_security_posture() to service_role;

alter table public.tenants add column if not exists is_demo boolean not null default false;
-- Preserve shipped examples without presenting their fabricated contacts/payment data as customers.
update public.tenants set is_demo = true
where owner_id is null and slug in ('barbearia-premium','burger-lab-artesanal','clinica-sorriso-prime','petshop-amigo-fiel')
  and logo_url like '/logos/%';

-- Only server endpoints may write. Authenticated reads remain tenant-isolated.
do $$ declare p record; begin
  for p in select tablename,policyname from pg_policies where schemaname='public'
    and tablename in ('profiles','tenants','tenant_modules','review_logs','analytics_events','tenant_invoices','security_audit_logs')
  loop execute format('drop policy %I on public.%I',p.policyname,p.tablename); end loop;
end $$;
revoke all on public.profiles, public.tenants, public.tenant_modules, public.review_logs, public.analytics_events, public.tenant_invoices, public.security_audit_logs from anon, authenticated;
grant select on public.profiles, public.tenants, public.tenant_modules, public.review_logs, public.analytics_events, public.tenant_invoices, public.security_audit_logs to authenticated;
grant all on public.profiles, public.tenants, public.tenant_modules, public.review_logs, public.analytics_events, public.tenant_invoices, public.security_audit_logs to service_role;
create policy profiles_read on public.profiles for select to authenticated using (id=(select auth.uid()) or (select private.is_super_admin()));
create policy tenants_read on public.tenants for select to authenticated using (owner_id=(select auth.uid()) or (select private.is_super_admin()));
create policy modules_read on public.tenant_modules for select to authenticated using (exists(select 1 from public.tenants t where t.id=tenant_id and (t.owner_id=(select auth.uid()) or (select private.is_super_admin()))));
create policy reviews_read on public.review_logs for select to authenticated using (exists(select 1 from public.tenants t where t.id=tenant_id and (t.owner_id=(select auth.uid()) or (select private.is_super_admin()))));
create policy events_read on public.analytics_events for select to authenticated using (exists(select 1 from public.tenants t where t.id=tenant_id and (t.owner_id=(select auth.uid()) or (select private.is_super_admin()))));
create policy invoices_read on public.tenant_invoices for select to authenticated using (exists(select 1 from public.tenants t where t.id=tenant_id and (t.owner_id=(select auth.uid()) or (select private.is_super_admin()))));
create policy audit_read on public.security_audit_logs for select to authenticated using ((select private.is_super_admin()));

-- Atomic updates; callable exclusively by the server after authenticating the actor.
create or replace function public.save_managed_tenant(actor_id uuid,target_id uuid,tenant_data jsonb,module_data jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare actor_role public.user_role; old_row public.tenants; saved_id uuid; mod jsonb;
begin
  select role into actor_role from public.profiles where id=actor_id;
  if actor_role is null then raise exception 'Unauthorized' using errcode='42501'; end if;
  if target_id is null then
    if actor_role <> 'super_admin' then raise exception 'Forbidden' using errcode='42501'; end if;
    insert into public.tenants(slug,name,nicho,bio,primary_color,google_place_id,whatsapp_feedback,owner_id,owner_email,plan_tier,plan,mrr_cents,status,next_billing_date)
    values(tenant_data->>'slug',tenant_data->>'name',tenant_data->>'nicho',tenant_data->>'bio',tenant_data->>'primary_color',nullif(tenant_data->>'google_place_id',''),nullif(tenant_data->>'whatsapp_feedback',''),(tenant_data->>'owner_id')::uuid,nullif(tenant_data->>'owner_email',''),tenant_data->>'plan_tier',(tenant_data->>'plan_tier')::public.plan_tier,(tenant_data->>'mrr_cents')::integer,'active',current_date+30)
    returning id into saved_id;
  else
    select * into old_row from public.tenants where id=target_id for update;
    if old_row.id is null or (actor_role <> 'super_admin' and old_row.owner_id is distinct from actor_id) then raise exception 'Forbidden' using errcode='42501'; end if;
    update public.tenants set slug=tenant_data->>'slug',name=tenant_data->>'name',nicho=tenant_data->>'nicho',bio=tenant_data->>'bio',logo_url=tenant_data->>'logo_url',cover_url=tenant_data->>'cover_url',primary_color=tenant_data->>'primary_color',google_place_id=nullif(tenant_data->>'google_place_id',''),whatsapp_feedback=nullif(tenant_data->>'whatsapp_feedback',''),
      status=case when actor_role='super_admin' then (tenant_data->>'status')::public.tenant_status else old_row.status end,
      is_active=case when actor_role='super_admin' then tenant_data->>'status' in ('active','trial') else old_row.is_active end,
      plan_tier=case when actor_role='super_admin' then tenant_data->>'plan_tier' else old_row.plan_tier end,
      plan=case when actor_role='super_admin' then (tenant_data->>'plan_tier')::public.plan_tier else old_row.plan end,
      mrr_cents=case when actor_role='super_admin' then (tenant_data->>'mrr_cents')::integer else old_row.mrr_cents end
    where id=target_id;
    saved_id:=target_id;
  end if;
  if module_data is not null then
    for mod in select * from jsonb_array_elements(module_data) loop
      insert into public.tenant_modules(tenant_id,module_type,title,is_active,order_index,config_data)
      values(saved_id,(mod->>'module_type')::public.module_type_enum,mod->>'title',(mod->>'is_active')::boolean,(mod->>'order_index')::integer,mod->'config_data')
      on conflict(tenant_id,module_type) do update set title=excluded.title,is_active=excluded.is_active,order_index=excluded.order_index,config_data=excluded.config_data;
    end loop;
    update public.tenant_modules set is_active=false where tenant_id=saved_id
      and module_type::text not in (select item->>'module_type' from jsonb_array_elements(module_data) item);
  end if;
  insert into public.security_audit_logs(actor_id,actor_role,action,target_tenant_slug,severity,metadata)
  values(actor_id,actor_role::text,'TENANT_SAVED',tenant_data->>'slug','INFO',jsonb_build_object('tenant_id',saved_id));
  return saved_id;
end;
$$;
revoke all on function public.save_managed_tenant(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_managed_tenant(uuid,uuid,jsonb,jsonb) to service_role;

create or replace function public.tenant_metrics(tenant_ids uuid[])
returns table(tenant_id uuid,views bigint,nfc bigint,qr bigint,google_clicks bigint)
language sql stable security invoker set search_path = '' as $$
select e.tenant_id,
 count(*) filter(where event_type='page_view'),
 count(*) filter(where event_type='page_view' and source='nfc'),
 count(*) filter(where event_type='page_view' and source='qr'),
 count(*) filter(where event_type='module_click' and module_type='google_reviews')
from public.analytics_events e where e.tenant_id=any(tenant_ids) and created_at >= now()-interval '30 days' group by e.tenant_id;
$$;
revoke all on function public.tenant_metrics(uuid[]) from public,anon,authenticated;
grant execute on function public.tenant_metrics(uuid[]) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('tenant-assets','tenant-assets',true,4000000,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- Public images are intentional. Uploads use the server-only service client after ownership checks.
create table if not exists private.request_limits (
  key text primary key, hits integer not null, expires_at timestamptz not null
);
alter table private.request_limits enable row level security;
revoke all on private.request_limits from public,anon,authenticated;
grant all on private.request_limits to service_role;
create index if not exists request_limits_expiry_idx on private.request_limits(expires_at);
create or replace function public.consume_rate_limit(bucket_key text,max_requests integer,window_ms integer)
returns table(allowed boolean,remaining integer,resets_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
declare bucket private.request_limits;
begin
  if max_requests < 1 or window_ms < 1000 or window_ms > 86400000 then raise exception 'Invalid limit'; end if;
  delete from private.request_limits where expires_at < now()-interval '1 day';
  insert into private.request_limits(key,hits,expires_at)
  values(bucket_key,1,now()+make_interval(secs=>window_ms/1000.0))
  on conflict(key) do update set
    hits=case when private.request_limits.expires_at <= now() then 1 else least(private.request_limits.hits+1,max_requests+1) end,
    expires_at=case when private.request_limits.expires_at <= now() then excluded.expires_at else private.request_limits.expires_at end
  returning * into bucket;
  return query select bucket.hits<=max_requests,greatest(0,max_requests-bucket.hits),bucket.expires_at;
end;
$$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
commit;

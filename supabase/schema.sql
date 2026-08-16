-- Papa News source ingestion and translation schema.
-- PostgreSQL stores timestamptz values in UTC internally.

create table if not exists public.system_config (
  key text primary key check (key = 'system_start_time'),
  system_start_time timestamptz not null,
  poll_interval_seconds integer not null default 300 check (poll_interval_seconds >= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source_article_id text unique,
  source_url text not null unique,
  canonical_url text,
  original_title text not null,
  original_content text not null,
  hindi_title text,
  hindi_content text,
  category text,
  image_url text,
  published_at timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processing_started_at timestamptz,
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'processing', 'completed', 'failed', 'ignored')),
  processing_error text,
  retry_count integer not null default 0
);

alter table public.articles add column if not exists retry_count integer not null default 0;

create index if not exists articles_completed_published_at_idx
  on public.articles (published_at desc)
  where processing_status = 'completed';
create index if not exists articles_claimable_idx
  on public.articles (created_at)
  where processing_status in ('pending', 'processing');

-- Atomic insert: unique source_url and source_article_id are the authority.
create or replace function public.insert_article_if_new(
  p_source_article_id text, p_source_url text, p_canonical_url text,
  p_original_title text, p_original_content text, p_category text,
  p_image_url text, p_published_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare inserted_id uuid;
begin
  insert into public.articles (
    source_article_id, source_url, canonical_url, original_title,
    original_content, category, image_url, published_at, processing_status
  ) values (
    p_source_article_id, p_source_url, p_canonical_url, p_original_title,
    p_original_content, p_category, p_image_url, p_published_at, 'pending'
  ) on conflict do nothing returning id into inserted_id;
  return inserted_id;
end;
$$;

-- SKIP LOCKED makes simultaneous workers claim disjoint rows. A stale claim
-- older than one hour is recoverable after a worker crash.
create or replace function public.claim_articles_for_translation(p_limit integer default 10)
returns setof public.articles
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with candidates as (
    select id
    from public.articles
    where processing_status = 'pending'
       or (processing_status = 'processing'
           and processing_started_at < now() - interval '10 minutes')
       or (processing_status = 'failed'
           and retry_count < 10)
    order by published_at desc
    for update skip locked
    limit greatest(1, least(p_limit, 100))
  ), claimed as (
    update public.articles article
    set processing_status = 'processing', processing_started_at = now(),
        processing_error = null, updated_at = now()
    from candidates
    where article.id = candidates.id
    returning article.*
  ) select * from claimed;
end;
$$;

alter table public.articles enable row level security;
alter table public.system_config enable row level security;

-- The public/mobile anon role can only see completed articles and cannot write.
grant usage on schema public to anon;
grant select on public.articles to anon;
revoke insert, update, delete, truncate on public.articles from anon;
revoke all on public.system_config from anon;
drop policy if exists "anon reads completed articles" on public.articles;
create policy "anon reads completed articles"
  on public.articles for select to anon
  using (processing_status = 'completed');

grant execute on function public.insert_article_if_new(text, text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.claim_articles_for_translation(integer) to service_role;

-- Push notification device tokens.
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  expo_push_token text unique not null,
  created_at timestamptz not null default now()
);

alter table public.device_tokens enable row level security;

-- Anon may register a token; it cannot read, update, or delete.
grant insert on public.device_tokens to anon;
revoke select, update, delete, truncate on public.device_tokens from anon;

drop policy if exists "anon inserts device token" on public.device_tokens;
create policy "anon inserts device token"
  on public.device_tokens for insert to anon
  with check (true);

-- The server reads tokens for push sending and deletes invalid ones.
grant select, delete on public.device_tokens to service_role;

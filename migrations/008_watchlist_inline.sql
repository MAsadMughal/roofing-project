-- Inline watchlist ids on users table as bigint[]
alter table users add column if not exists watchlist_lead_ids bigint[] default '{}'::bigint[];

-- migrate existing rows from user_watchlists if table exists
do $$
begin
  if exists (select 1 from information_schema.tables where table_name='user_watchlists') then
    update users u set watchlist_lead_ids = coalesce(sub.lead_ids, '{}'::bigint[])
    from (
      select user_id, array_agg(lead_id order by created_at desc) as lead_ids
      from user_watchlists
      group by user_id
    ) sub
    where u.id = sub.user_id;
  end if;
end $$;

-- drop old mapping table if present
drop table if exists user_watchlists;



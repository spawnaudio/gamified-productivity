create table public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  notes text not null default '',
  created_at timestamptz not null,
  completed_at timestamptz
);

create table public.habits (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  archived_at timestamptz
);

create table public.habit_ticks (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  ticked_at timestamptz not null
);

create table public.focus_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  planned_minutes integer not null check (planned_minutes in (15, 25, 50)),
  started_at timestamptz not null,
  ended_at timestamptz,
  note text,
  paid boolean not null default false
);

create table public.wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0)
);

create table public.ledger (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  source text not null check (source in ('task', 'habit', 'focus', 'purchase')),
  source_id text not null,
  created_at timestamptz not null,
  unique (user_id, source, source_id)
);

create table public.inventory (
  user_id uuid not null references auth.users (id) on delete cascade,
  catalog_id text not null,
  count integer not null check (count > 0),
  primary key (user_id, catalog_id)
);

create table public.board_pieces (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  catalog_id text not null,
  x integer not null,
  y integer not null,
  rotation integer not null check (rotation in (0, 90, 180, 270))
);

alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.habit_ticks enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.wallets enable row level security;
alter table public.ledger enable row level security;
alter table public.inventory enable row level security;
alter table public.board_pieces enable row level security;

create policy "owner_select_tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "owner_select_habits" on public.habits for select using (auth.uid() = user_id);
create policy "owner_select_ticks" on public.habit_ticks for select using (auth.uid() = user_id);
create policy "owner_select_focus" on public.focus_sessions for select using (auth.uid() = user_id);
create policy "owner_select_wallets" on public.wallets for select using (auth.uid() = user_id);
create policy "owner_select_ledger" on public.ledger for select using (auth.uid() = user_id);
create policy "owner_select_inventory" on public.inventory for select using (auth.uid() = user_id);
create policy "owner_select_board" on public.board_pieces for select using (auth.uid() = user_id);

create or replace function public.seed_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallets (user_id, balance) values (new.id, 0);
  insert into public.habits (id, user_id, title, archived_at) values
    ('00000000-0000-4000-8000-000000000001', new.id, 'Make the bed', null),
    ('00000000-0000-4000-8000-000000000002', new.id, 'Write for ten minutes', null);
  insert into public.board_pieces (id, user_id, catalog_id, x, y, rotation) values
    ('00000000-0000-4000-8000-000000000011', new.id, 'well', 7, 5, 0),
    ('00000000-0000-4000-8000-000000000012', new.id, 'path', 7, 6, 0),
    ('00000000-0000-4000-8000-000000000013', new.id, 'path', 7, 7, 0),
    ('00000000-0000-4000-8000-000000000014', new.id, 'path', 7, 8, 0);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_new_user();

create or replace function public.apply_action(action jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  return public.apply_action_inner(uid, action);
end;
$$;

create or replace function public.apply_action_inner(uid uuid, action jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  kind text := action->>'type';
  layout text := coalesce(action->>'layout', 'home');
  catalog_id text;
  price integer;
  item_w integer;
  item_h integer;
  rot integer;
  width integer;
  height integer;
  px integer;
  py integer;
  current_balance integer;
begin
  if layout = 'companion' and kind in ('buy', 'place', 'pickUp') then
    raise exception 'companion_forbidden';
  end if;

  if kind = 'createTask' then
    insert into public.tasks (id, user_id, title, notes, created_at, completed_at)
    values (
      (action->>'id')::uuid,
      uid,
      trim(action->>'title'),
      coalesce(action->>'notes', ''),
      (action->>'at')::timestamptz,
      null
    )
    on conflict (id) do nothing;
  elsif kind = 'completeTask' then
    update public.tasks
      set completed_at = (action->>'at')::timestamptz
      where id = (action->>'id')::uuid and user_id = uid and completed_at is null;
    if found then
      insert into public.ledger (id, user_id, delta, source, source_id, created_at)
      values ('task:' || (action->>'id'), uid, 1, 'task', action->>'id', (action->>'at')::timestamptz)
      on conflict do nothing;
      if found then
        update public.wallets set balance = balance + 1 where user_id = uid;
      end if;
    end if;
  elsif kind = 'deleteTask' then
    delete from public.tasks where id = (action->>'id')::uuid and user_id = uid;
  elsif kind = 'createHabit' then
    insert into public.habits (id, user_id, title, archived_at)
    values ((action->>'id')::uuid, uid, trim(action->>'title'), null)
    on conflict (id) do nothing;
  elsif kind = 'tickHabit' then
    if not exists (
      select 1 from public.habits
      where id = (action->>'habitId')::uuid and user_id = uid and archived_at is null
    ) then
      raise exception 'not_found';
    end if;
    insert into public.habit_ticks (id, user_id, habit_id, ticked_at)
    values ((action->>'tickId')::uuid, uid, (action->>'habitId')::uuid, (action->>'at')::timestamptz)
    on conflict (id) do nothing;
    if found then
      insert into public.ledger (id, user_id, delta, source, source_id, created_at)
      values ('habit:' || (action->>'tickId'), uid, 1, 'habit', action->>'tickId', (action->>'at')::timestamptz)
      on conflict do nothing;
      if found then
        update public.wallets set balance = balance + 1 where user_id = uid;
      end if;
    end if;
  elsif kind = 'archiveHabit' then
    update public.habits
      set archived_at = coalesce(archived_at, now())
      where id = (action->>'id')::uuid and user_id = uid;
  elsif kind = 'startFocus' then
    if exists (select 1 from public.focus_sessions where user_id = uid and ended_at is null) then
      raise exception 'focus_already_open';
    end if;
    insert into public.focus_sessions (id, user_id, planned_minutes, started_at, ended_at, note, paid)
    values (
      (action->>'id')::uuid,
      uid,
      (action->>'plannedMinutes')::integer,
      (action->>'at')::timestamptz,
      null,
      null,
      false
    )
    on conflict (id) do nothing;
  elsif kind = 'finishFocus' then
    if trim(coalesce(action->>'note', '')) = '' then
      raise exception 'note_required';
    end if;
    update public.focus_sessions
      set ended_at = (action->>'at')::timestamptz,
          note = trim(action->>'note'),
          paid = true
      where id = (action->>'id')::uuid and user_id = uid and paid = false and ended_at is null;
    if found then
      insert into public.ledger (id, user_id, delta, source, source_id, created_at)
      values ('focus:' || (action->>'id'), uid, 1, 'focus', action->>'id', (action->>'at')::timestamptz)
      on conflict do nothing;
      if found then
        update public.wallets set balance = balance + 1 where user_id = uid;
      end if;
    end if;
  elsif kind = 'discardFocus' then
    update public.focus_sessions
      set ended_at = (action->>'at')::timestamptz,
          paid = false
      where id = (action->>'id')::uuid and user_id = uid and ended_at is null;
  elsif kind = 'buy' then
    catalog_id := action->>'catalogId';
    if catalog_id = 'well' then
      raise exception 'starter_not_for_sale';
    end if;
    price := case catalog_id
      when 'path' then 1
      when 'flowerbox' then 2
      when 'bench' then 3
      when 'lamp' then 3
      when 'tree' then 4
      when 'garden' then 6
      when 'cottage' then 8
      when 'workshop' then 10
      when 'library' then 12
      else null
    end;
    if price is null then
      raise exception 'unknown_catalog';
    end if;
    if exists (select 1 from public.ledger where id = 'purchase:' || (action->>'id') and user_id = uid) then
      null;
    else
      select balance into current_balance from public.wallets where user_id = uid for update;
      if current_balance < price then
        raise exception 'insufficient_funds';
      end if;
      update public.wallets set balance = balance - price where user_id = uid;
      insert into public.ledger (id, user_id, delta, source, source_id, created_at)
      values ('purchase:' || (action->>'id'), uid, -price, 'purchase', action->>'id', (action->>'at')::timestamptz);
      insert into public.inventory (user_id, catalog_id, count)
      values (uid, catalog_id, 1)
      on conflict (user_id, catalog_id) do update set count = public.inventory.count + 1;
    end if;
  elsif kind = 'place' then
    catalog_id := action->>'catalogId';
    px := (action->>'x')::integer;
    py := (action->>'y')::integer;
    rot := (action->>'rotation')::integer;
    select count into current_balance from public.inventory
      where user_id = uid and inventory.catalog_id = catalog_id;
    if coalesce(current_balance, 0) < 1 then
      raise exception 'empty_inventory';
    end if;
    item_w := case catalog_id
      when 'bench' then 2 when 'garden' then 2 when 'cottage' then 2
      when 'workshop' then 2 when 'library' then 2 else 1 end;
    item_h := case catalog_id
      when 'garden' then 2 when 'cottage' then 2 when 'workshop' then 2
      when 'library' then 2 else 1 end;
    if rot in (90, 270) then
      width := item_h;
      height := item_w;
    else
      width := item_w;
      height := item_h;
    end if;
    if px < 0 or py < 0 or px + width > 16 or py + height > 12 then
      raise exception 'off_board';
    end if;
    if exists (
      select 1 from public.board_pieces p
      where p.user_id = uid
        and not (
          px + width <= p.x or
          p.x + (case when p.rotation in (90, 270) then
            case p.catalog_id when 'bench' then 1 when 'garden' then 2 when 'cottage' then 2
              when 'workshop' then 2 when 'library' then 2 else 1 end
          else
            case p.catalog_id when 'bench' then 2 when 'garden' then 2 when 'cottage' then 2
              when 'workshop' then 2 when 'library' then 2 else 1 end
          end) <= px or
          py + height <= p.y or
          p.y + (case when p.rotation in (90, 270) then
            case p.catalog_id when 'bench' then 2 when 'garden' then 2 when 'cottage' then 2
              when 'workshop' then 2 when 'library' then 2 else 1 end
          else
            case p.catalog_id when 'garden' then 2 when 'cottage' then 2 when 'workshop' then 2
              when 'library' then 2 else 1 end
          end) <= py
        )
    ) then
      raise exception 'overlap';
    end if;
    if exists (select 1 from public.board_pieces where id = (action->>'id')::uuid) then
      null;
    else
      update public.inventory
        set count = count - 1
        where user_id = uid and inventory.catalog_id = catalog_id;
      delete from public.inventory where user_id = uid and inventory.catalog_id = catalog_id and count <= 0;
      insert into public.board_pieces (id, user_id, catalog_id, x, y, rotation)
      values ((action->>'id')::uuid, uid, catalog_id, px, py, rot);
    end if;
  elsif kind = 'pickUp' then
    select board_pieces.catalog_id into catalog_id from public.board_pieces
      where id = (action->>'id')::uuid and user_id = uid;
    if catalog_id is null then
      raise exception 'not_found';
    end if;
    delete from public.board_pieces where id = (action->>'id')::uuid and user_id = uid;
    insert into public.inventory (user_id, catalog_id, count)
    values (uid, catalog_id, 1)
    on conflict (user_id, catalog_id) do update set count = public.inventory.count + 1;
  else
    raise exception 'unknown_action';
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.apply_action(jsonb) from public;
grant execute on function public.apply_action(jsonb) to authenticated;
revoke all on function public.apply_action_inner(uuid, jsonb) from public;

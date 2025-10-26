-- Chat Message Persistence
-- Single table approach storing entire UIMessage[] array as JSONB

create table public.chats (
  id text primary key,
  title text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for history queries (ordered by most recent)
create index chats_updated_at_idx on public.chats(updated_at desc);

-- Enable RLS (permissive policies for now, no auth)
alter table public.chats enable row level security;

-- Allow all operations on chats
create policy "Allow all operations on chats" 
  on public.chats 
  for all 
  using (true) 
  with check (true);

-- Comment for documentation
comment on table public.chats is 'AI chat conversations with messages stored as JSONB';
comment on column public.chats.messages is 'UIMessage[] array from AI SDK stored as JSONB';


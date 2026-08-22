-- Folders (self-referential for nesting)
create table folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_folder_id uuid references folders(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Files
create table files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references folders(id) on delete cascade,
  title text not null,
  content text not null default '',
  file_type text not null default 'md' check (file_type in ('md', 'txt')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index folders_user_id_idx on folders(user_id);
create index folders_parent_idx on folders(parent_folder_id);
create index files_user_id_idx on files(user_id);
create index files_folder_id_idx on files(folder_id);

-- RLS: every user only ever sees their own rows.
alter table folders enable row level security;
alter table files enable row level security;

create policy "user isolation" on folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user isolation" on files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

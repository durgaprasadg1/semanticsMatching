-- Structural + semantic links between files (and files -> folders).
create table file_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_file_id uuid not null references files(id) on delete cascade,
  target_file_id uuid references files(id) on delete cascade,
  target_folder_id uuid references folders(id) on delete cascade,
  link_type text not null check (link_type in ('structural', 'semantic')),
  similarity_score float,
  created_at timestamptz default now(),
  unique (source_file_id, target_file_id, link_type),
  check (
    (link_type = 'structural' and target_folder_id is not null and target_file_id is null)
    or
    (link_type = 'semantic' and target_file_id is not null and target_folder_id is null)
  )
);

create index file_links_user_id_idx on file_links(user_id);
create index file_links_source_idx on file_links(source_file_id);
create index file_links_target_file_idx on file_links(target_file_id);
create index file_links_target_folder_idx on file_links(target_folder_id);

alter table file_links enable row level security;

create policy "user isolation" on file_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

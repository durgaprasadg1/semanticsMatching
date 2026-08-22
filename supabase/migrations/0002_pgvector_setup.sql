-- Enable pgvector and create the chunk-level embeddings table used by
-- rag-service (not built yet, but the schema is ready for it).
create extension if not exists vector;

create table file_embeddings (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references files(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chunk_index int not null,
  chunk_text text not null,
  embedding vector(384),
  created_at timestamptz default now()
);

create index file_embeddings_file_id_idx on file_embeddings(file_id);
create index file_embeddings_embedding_idx on file_embeddings
  using ivfflat (embedding vector_cosine_ops);

alter table file_embeddings enable row level security;

create policy "user isolation" on file_embeddings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

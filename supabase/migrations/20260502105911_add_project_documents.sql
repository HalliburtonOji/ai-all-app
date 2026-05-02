-- ============================================================
-- Phase 10 — Document reader (Studio: PDF Q&A)
-- ============================================================
--
-- Per-project document uploads (PDF only at v1). Each row points at
-- a file in the `project-documents` Storage bucket. The Q&A flow
-- sends the PDF to Anthropic with each user question; Claude reads
-- the PDF natively, no parsing on our side.
--
-- Why a separate table from studio_outputs: outputs are AI-generated;
-- documents are user-uploaded inputs. Different shape, different
-- lifecycle (a single doc gets asked-about many times).

create table public.project_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  filename text not null check (
    char_length(filename) > 0 and char_length(filename) <= 200
  ),
  storage_path text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  -- Page count is recorded on upload when we can detect it; null is fine.
  page_count int null check (page_count is null or page_count > 0),
  created_at timestamptz not null default now()
);

alter table public.project_documents enable row level security;

create policy "Users can view own project documents"
  on public.project_documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own project documents"
  on public.project_documents for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own project documents"
  on public.project_documents for delete
  using (auth.uid() = user_id);

create index project_documents_project_idx
  on public.project_documents(project_id, created_at desc);

-- Storage bucket for the actual PDFs. Path convention mirrors the
-- studio-images bucket: `${user_id}/${project_id}/${doc_id}.pdf`.
-- Storage RLS: the `(storage.foldername(name))[1] = auth.uid()::text`
-- shape ensures users can only access files prefixed with their own
-- user_id.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-documents',
  'project-documents',
  false,
  10485760, -- 10 MiB
  array['application/pdf']
)
on conflict (id) do nothing;

create policy "Users can read own documents"
  on storage.objects for select
  using (
    bucket_id = 'project-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'project-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'project-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

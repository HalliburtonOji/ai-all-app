-- ============================================================
-- Studio v1 — image generation
-- ============================================================
--
-- First Studio tool: project-scoped image generation. Users type a
-- prompt, the app calls Replicate (FLUX schnell), the resulting PNG is
-- stored in a private Supabase Storage bucket, and a row in
-- studio_images links it back to the Project.

-- 1. Storage bucket for generated images. Private — access via signed
--    URLs only.
insert into storage.buckets (id, name, public)
values ('studio-images', 'studio-images', false)
on conflict (id) do nothing;

-- 2. Storage RLS policies. Path convention: ${user_id}/${project_id}/${image_id}.png
--    The first path segment must equal the requester's auth.uid() —
--    that's how ownership is enforced at the storage layer.
create policy "Users can read own studio images"
  on storage.objects for select
  using (
    bucket_id = 'studio-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own studio images"
  on storage.objects for insert
  with check (
    bucket_id = 'studio-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own studio images"
  on storage.objects for delete
  using (
    bucket_id = 'studio-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. studio_images table. Image metadata + pointer into the bucket.
--    Immutable once generated (no update policy). Users can delete to
--    retry — delete also cascades the storage object via app code.
create table public.studio_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null check (char_length(prompt) > 0 and char_length(prompt) <= 1000),
  storage_path text not null,
  model text not null default 'flux-schnell',
  created_at timestamptz not null default now()
);

create index studio_images_project_created_idx
  on public.studio_images(project_id, created_at desc);

alter table public.studio_images enable row level security;

create policy "Users can view own studio images"
  on public.studio_images for select
  using (auth.uid() = user_id);

create policy "Users can insert own studio images"
  on public.studio_images for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own studio images"
  on public.studio_images for delete
  using (auth.uid() = user_id);

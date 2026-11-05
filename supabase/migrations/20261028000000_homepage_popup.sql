-- Homepage popup configuration. Only the exact admin email may change it.
create table if not exists public.homepage_popup (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  title text not null default '',
  message text not null default '',
  image_url text,
  updated_at timestamptz not null default now()
);

alter table public.homepage_popup enable row level security;

drop policy if exists "Anyone can read homepage popup" on public.homepage_popup;
create policy "Anyone can read homepage popup"
  on public.homepage_popup for select
  to anon, authenticated
  using (true);

drop policy if exists "Only TechnoShows admin can insert homepage popup" on public.homepage_popup;
create policy "Only TechnoShows admin can insert homepage popup"
  on public.homepage_popup for insert
  to authenticated
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'technoproboizz@gmail.com');

drop policy if exists "Only TechnoShows admin can update homepage popup" on public.homepage_popup;
create policy "Only TechnoShows admin can update homepage popup"
  on public.homepage_popup for update
  to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'technoproboizz@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'technoproboizz@gmail.com');

insert into public.homepage_popup (id, enabled, title, message)
values (1, false, '', '')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('homepage-popup', 'homepage-popup', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

drop policy if exists "Public can view homepage popup images" on storage.objects;
create policy "Public can view homepage popup images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'homepage-popup');

drop policy if exists "Only TechnoShows admin can upload homepage popup images" on storage.objects;
create policy "Only TechnoShows admin can upload homepage popup images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'homepage-popup'
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'technoproboizz@gmail.com'
  );

drop policy if exists "Only TechnoShows admin can update homepage popup images" on storage.objects;
create policy "Only TechnoShows admin can update homepage popup images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'homepage-popup'
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'technoproboizz@gmail.com'
  )
  with check (
    bucket_id = 'homepage-popup'
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'technoproboizz@gmail.com'
  );

drop policy if exists "Only TechnoShows admin can delete homepage popup images" on storage.objects;
create policy "Only TechnoShows admin can delete homepage popup images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'homepage-popup'
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'technoproboizz@gmail.com'
  );

-- Create users profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  file_path text,
  public_url text,
  model_id text default 'prebuilt-invoice',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create extracted fields table
create table if not exists public.extracted_fields (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  field_name text not null,
  field_value text,
  confidence float,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.extracted_fields enable row level security;

-- Profiles RLS Policies
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- Documents RLS Policies
create policy "documents_select_own" on public.documents for select using (auth.uid() = user_id);
create policy "documents_insert_own" on public.documents for insert with check (auth.uid() = user_id);
create policy "documents_update_own" on public.documents for update using (auth.uid() = user_id);
create policy "documents_delete_own" on public.documents for delete using (auth.uid() = user_id);

-- Extracted Fields RLS Policies (access through documents)
create policy "extracted_fields_select_own" on public.extracted_fields for select 
  using (document_id in (select id from documents where user_id = auth.uid()));
create policy "extracted_fields_insert_own" on public.extracted_fields for insert 
  with check (document_id in (select id from documents where user_id = auth.uid()));
create policy "extracted_fields_update_own" on public.extracted_fields for update 
  using (document_id in (select id from documents where user_id = auth.uid()));
create policy "extracted_fields_delete_own" on public.extracted_fields for delete 
  using (document_id in (select id from documents where user_id = auth.uid()));

-- Create trigger for profile creation on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- 1. Crear tabla de Perfiles (Profiles) vinculada a auth.users
-- Esta tabla guardará el rol de cada usuario (admin o worker)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  role text default 'worker' check (role in ('admin', 'worker')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar Seguridad (RLS)
alter table public.profiles enable row level security;

-- Permitir lectura pública de perfiles (necesario para verificar rol al hacer login)
create policy "Ver perfiles" on public.profiles
  for select using (true);

-- Permitir que usuarios actualicen su propio perfil
create policy "Editar propio perfil" on public.profiles
  for update using (auth.uid() = id);

-- 3. Trigger para crear perfil automáticamente al crear usuario
-- Cada vez que crees un usuario en Supabase Auth, se creará una entrada aquí con rol 'worker' por defecto
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'worker');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- INSTRUCCIONES POSTERIORES:
-- 1. Ve a Supabase -> Authentication -> Users.
-- 2. Crea un usuario (ej: admin@tienda.com).
-- 3. Ve al Table Editor -> tabla 'profiles'.
-- 4. Cambia manualmente el rol de ese usuario a 'admin'.

-- =============================================
-- PERMISOS PARA STAFF (admin + worker)
-- Permite que trabajadores actualicen estados de pedidos y
-- que el descuento automático de stock funcione al confirmar.
--
-- NOTA:
-- - Estas políticas NO son destructivas (no eliminan otras políticas).
-- - Si RLS está habilitado en tus tablas, estas reglas darán acceso a workers.
-- - Si RLS NO está habilitado, no afectan el comportamiento.
-- =============================================

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'worker')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.can_access_pedido(pedido_id bigint)
returns boolean
language sql
stable
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.pedidos p
      where p.id = pedido_id
        and p.asignado_a = auth.uid()
    );
$$;

drop policy if exists "Staff puede leer pedidos" on public.pedidos;
drop policy if exists "Staff puede actualizar pedidos" on public.pedidos;
drop policy if exists "Staff puede leer pedido_items" on public.pedido_items;
drop policy if exists "Staff puede leer productos" on public.productos;
drop policy if exists "Staff puede actualizar productos" on public.productos;

create policy "Staff puede leer pedidos"
  on public.pedidos for select
  using (public.is_admin() or asignado_a = auth.uid());

create policy "Staff puede actualizar pedidos"
  on public.pedidos for update
  using (public.is_admin() or asignado_a = auth.uid())
  with check (public.is_admin() or asignado_a = auth.uid());

create policy "Staff puede leer pedido_items"
  on public.pedido_items for select
  using (public.can_access_pedido(pedido_id));

create policy "Staff puede leer productos"
  on public.productos for select
  using (true);

create policy "Staff puede actualizar productos"
  on public.productos for update
  using (
    public.is_admin()
    or exists (
      select 1
      from public.pedido_items pi
      join public.pedidos p on p.id = pi.pedido_id
      where pi.producto_id = productos.id
        and p.asignado_a = auth.uid()
        and coalesce(p.stock_descontado, false) = false
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.pedido_items pi
      join public.pedidos p on p.id = pi.pedido_id
      where pi.producto_id = productos.id
        and p.asignado_a = auth.uid()
        and coalesce(p.stock_descontado, false) = false
    )
  );

drop policy if exists "Staff puede leer clientes" on public.clientes;

create policy "Staff puede leer clientes"
  on public.clientes for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.pedidos p
      where p.cliente_id = clientes.id
        and p.asignado_a = auth.uid()
    )
  );

drop policy if exists "Staff puede leer incidencias" on public.incidencias;
drop policy if exists "Staff puede crear incidencias" on public.incidencias;
drop policy if exists "Admin puede eliminar incidencias" on public.incidencias;
drop policy if exists "Admin puede actualizar incidencias" on public.incidencias;

create policy "Staff puede leer incidencias"
  on public.incidencias for select
  using (public.can_access_pedido(pedido_id));

create policy "Staff puede crear incidencias"
  on public.incidencias for insert
  with check (public.can_access_pedido(pedido_id));

create policy "Admin puede eliminar incidencias"
  on public.incidencias for delete
  using (public.is_admin());

create policy "Admin puede actualizar incidencias"
  on public.incidencias for update
  using (public.is_admin())
  with check (public.is_admin());


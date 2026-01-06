
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

drop policy if exists "Staff puede leer producto_variantes" on public.producto_variantes;
drop policy if exists "Staff puede actualizar producto_variantes" on public.producto_variantes;
drop policy if exists "Staff puede leer producto_especificaciones" on public.producto_especificaciones;

-- =============================================
-- Variantes / Especificaciones (RLS)
-- =============================================

alter table public.producto_variantes enable row level security;
alter table public.producto_especificaciones enable row level security;

drop policy if exists "Public puede leer producto_variantes" on public.producto_variantes;
drop policy if exists "Admin puede crear producto_variantes" on public.producto_variantes;
drop policy if exists "Admin puede actualizar producto_variantes" on public.producto_variantes;
drop policy if exists "Admin puede eliminar producto_variantes" on public.producto_variantes;

create policy "Public puede leer producto_variantes"
  on public.producto_variantes for select
  using (activo = true);

create policy "Admin puede crear producto_variantes"
  on public.producto_variantes for insert
  with check (public.is_admin());

create policy "Admin puede actualizar producto_variantes"
  on public.producto_variantes for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin puede eliminar producto_variantes"
  on public.producto_variantes for delete
  using (public.is_admin());

create policy "Staff puede leer producto_variantes"
  on public.producto_variantes for select
  using (true);

create policy "Staff puede actualizar producto_variantes"
  on public.producto_variantes for update
  using (
    public.is_admin()
    or exists (
      select 1
      from public.pedido_items pi
      join public.pedidos p on p.id = pi.pedido_id
      where pi.producto_variante_id = producto_variantes.id
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
      where pi.producto_variante_id = producto_variantes.id
        and p.asignado_a = auth.uid()
        and coalesce(p.stock_descontado, false) = false
    )
  );

drop policy if exists "Public puede leer producto_especificaciones" on public.producto_especificaciones;
drop policy if exists "Admin puede crear producto_especificaciones" on public.producto_especificaciones;
drop policy if exists "Admin puede actualizar producto_especificaciones" on public.producto_especificaciones;
drop policy if exists "Admin puede eliminar producto_especificaciones" on public.producto_especificaciones;

create policy "Public puede leer producto_especificaciones"
  on public.producto_especificaciones for select
  using (true);

create policy "Admin puede crear producto_especificaciones"
  on public.producto_especificaciones for insert
  with check (public.is_admin());

create policy "Admin puede actualizar producto_especificaciones"
  on public.producto_especificaciones for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin puede eliminar producto_especificaciones"
  on public.producto_especificaciones for delete
  using (public.is_admin());

create policy "Staff puede leer producto_especificaciones"
  on public.producto_especificaciones for select
  using (true);

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

drop policy if exists "Public puede crear clientes" on public.clientes;
drop policy if exists "Public puede crear pedidos" on public.pedidos;
drop policy if exists "Public puede crear pedido_items" on public.pedido_items;

create policy "Public puede crear clientes"
  on public.clientes for insert
  with check (
    nombre is not null
    and length(trim(nombre)) > 0
    and telefono is not null
    and length(trim(telefono)) > 0
  );

create policy "Public puede crear pedidos"
  on public.pedidos for insert
  with check (
    total is not null
    and total >= 0
    and coalesce(status, 'Pendiente') = 'Pendiente'
  );

create policy "Public puede crear pedido_items"
  on public.pedido_items for insert
  with check (
    pedido_id is not null
    and cantidad is not null
    and cantidad > 0
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

-- =============================================
-- CUPONES (admin CRUD + público lectura + consumo atómico)
-- =============================================

alter table public.cupones enable row level security;

drop policy if exists "Admin puede leer cupones" on public.cupones;
drop policy if exists "Admin puede crear cupones" on public.cupones;
drop policy if exists "Admin puede actualizar cupones" on public.cupones;
drop policy if exists "Admin puede eliminar cupones" on public.cupones;
drop policy if exists "Public puede leer cupones activos" on public.cupones;

create policy "Admin puede leer cupones"
  on public.cupones for select
  using (public.is_admin());

create policy "Admin puede crear cupones"
  on public.cupones for insert
  with check (public.is_admin());

create policy "Admin puede actualizar cupones"
  on public.cupones for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin puede eliminar cupones"
  on public.cupones for delete
  using (public.is_admin());

create policy "Public puede leer cupones activos"
  on public.cupones for select
  using (
    activo = true
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at >= now())
    and (max_usos is null or usos < max_usos)
  );

create or replace function public.apply_coupon_to_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_descuento numeric;
  v_rows int;
  v_tipo text;
  v_valor numeric;
  v_activo boolean;
  v_min_total numeric;
  v_max_usos int;
  v_usos int;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
begin
  if new.cupon_codigo is null or length(trim(new.cupon_codigo)) = 0 then
    return new;
  end if;

  if new.subtotal is null then
    raise exception 'Subtotal requerido para aplicar cupón';
  end if;

  v_code := upper(trim(new.cupon_codigo));

  select c.tipo, c.valor, c.activo, c.min_total, c.max_usos, c.usos, c.starts_at, c.expires_at
    into v_tipo, v_valor, v_activo, v_min_total, v_max_usos, v_usos, v_starts_at, v_expires_at
  from public.cupones c
  where c.codigo = v_code
  for update;

  if not found then
    raise exception 'Cupón inválido';
  end if;

  if v_activo is not true then
    raise exception 'Cupón inactivo';
  end if;

  if v_starts_at is not null and now() < v_starts_at then
    raise exception 'Cupón aún no disponible';
  end if;

  if v_expires_at is not null and now() > v_expires_at then
    raise exception 'Cupón expiró';
  end if;

  if coalesce(new.subtotal, 0) < coalesce(v_min_total, 0) then
    raise exception 'El cupón no aplica para este total';
  end if;

  if v_max_usos is not null and v_usos >= v_max_usos then
    raise exception 'Cupón agotado';
  end if;

  if v_tipo = 'porcentaje' then
    v_descuento := round(coalesce(new.subtotal, 0) * (coalesce(v_valor, 0) / 100.0), 2);
  else
    v_descuento := coalesce(v_valor, 0);
  end if;

  v_descuento := greatest(0, least(coalesce(new.subtotal, 0), v_descuento));

  update public.cupones
     set usos = usos + 1
   where codigo = v_code
     and (max_usos is null or usos < max_usos);

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Cupón agotado';
  end if;

  new.cupon_codigo := v_code;
  new.descuento := v_descuento;
  new.total := greatest(0, round((coalesce(new.subtotal, 0) - v_descuento), 2));

  return new;
end;
$$;

drop trigger if exists before_insert_apply_coupon on public.pedidos;
create trigger before_insert_apply_coupon
  before insert on public.pedidos
  for each row execute procedure public.apply_coupon_to_pedido();

create or replace function public.get_top_products(limit_count int default 8, exclude_id bigint default null)
returns setof public.productos
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.productos p
  left join public.pedido_items pi on pi.producto_id = p.id
  left join public.pedidos pe on pe.id = pi.pedido_id
  where (exclude_id is null or p.id <> exclude_id)
    and coalesce(p.stock, 0) > 0
  group by p.id
  order by coalesce(sum(pi.cantidad), 0) desc, p.created_at desc
  limit limit_count;
$$;

grant execute on function public.get_top_products(int, bigint) to anon;
grant execute on function public.get_top_products(int, bigint) to authenticated;


-- Esquema de la APP de pedidos para dermatólogos. Idempotente: se puede ejecutar varias veces.

create table if not exists lines (
  id text primary key,
  name text not null,
  focus text not null,
  sort int not null default 0
);

create table if not exists products (
  id serial primary key,
  slug text not null unique,
  line_id text not null references lines(id),
  name text not null,
  format text not null,
  professional boolean not null default false,
  source_url text,
  -- Precio profesional sin IVA en céntimos. Null = aún sin precio: no se puede pedir.
  price_cents int,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Foto del producto: ruta local (/productos/...) si se descargó, si no la URL original del fabricante.
alter table products add column if not exists image_url text;

create table if not exists customers (
  id serial primary key,
  name text not null,
  clinic text not null,
  email text not null unique,
  phone text,
  province text not null,
  license_number text,
  tax_id text,
  address text,
  interest_line_id text references lines(id),
  consent_email boolean not null default false,
  consent_whatsapp boolean not null default false,
  consent_at timestamptz,
  consent_version text,
  -- De dónde salió el contacto (alta-web, carta, anuncio, contacto-propio, agente)
  source text not null default 'alta-web',
  status text not null default 'nuevo',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id serial primary key,
  customer_id int not null references customers(id),
  kind text not null default 'pedido', -- pedido | muestra
  status text not null default 'pendiente-pago',
  subtotal_cents int not null,
  discount_pct int not null default 0,
  discount_cents int not null default 0,
  shipping_cents int not null default 0,
  vat_cents int not null default 0,
  total_cents int not null,
  notes text,
  created_by text not null default 'cliente', -- cliente | agente | admin
  created_at timestamptz not null default now()
);

create table if not exists order_lines (
  id serial primary key,
  order_id int not null references orders(id) on delete cascade,
  product_id int not null references products(id),
  name text not null,
  quantity int not null check (quantity > 0),
  unit_cents int not null,
  line_cents int not null
);

create table if not exists login_tokens (
  token text primary key,
  customer_id int not null references customers(id),
  expires_at timestamptz not null,
  used_at timestamptz
);

-- Registro de todo lo que pasa con cada cliente (altas, pedidos, y en el paso 3 los mensajes del agente)
create table if not exists events (
  id serial primary key,
  customer_id int references customers(id),
  type text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

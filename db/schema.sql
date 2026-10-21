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

-- --- Paso 3: el agente ---

-- Clínicas encontradas por el agente (Google Maps) o importadas por el distribuidor. Son posibles clientes SIN
-- consentimiento: solo se les escribe por carta postal (con un código QR personal), nunca correo ni WhatsApp.
create table if not exists prospects (
  id serial primary key,
  clinic text not null,
  name text,
  address text,
  province text,
  phone text,
  website text,
  email text,
  -- google-maps | csv | manual
  source text not null default 'manual',
  place_id text unique,
  -- nuevo | carta-preparada | carta-enviada | registrado | descartado
  status text not null default 'nuevo',
  -- Código del QR de la carta: /alta?origen=carta&c=<code>
  code text not null unique,
  customer_id int references customers(id),
  notes text,
  created_at timestamptz not null default now(),
  letter_at timestamptz
);

-- Conversaciones por correo y WhatsApp, solo con clientes registrados.
create table if not exists messages (
  id serial primary key,
  customer_id int not null references customers(id),
  channel text not null, -- email | whatsapp | panel
  direction text not null, -- entrada | salida
  author text not null, -- cliente | agente | humano
  subject text,
  body text not null,
  -- Clave para no repetir seguimientos automáticos (p. ej. muestra-7:12)
  dedupe_key text unique,
  status text not null default 'ok', -- ok | sin-enviar | error
  created_at timestamptz not null default now()
);

-- Datos de Google Maps para decidir a qué clínicas merece la pena escribir: nota, nº de opiniones y última opinión.
alter table prospects add column if not exists rating numeric(2,1);
alter table prospects add column if not exists rating_count int;
alter table prospects add column if not exists last_review_at timestamptz;

alter table customers add column if not exists needs_human boolean not null default false;
alter table customers add column if not exists prospect_code text;

-- En Supabase, el esquema public también se publica por su API REST. La APP entra como propietaria de las tablas
-- (no le afecta RLS); activar RLS sin políticas cierra esa API para que nadie lea los datos con la clave pública.
alter table lines enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_lines enable row level security;
alter table login_tokens enable row level security;
alter table events enable row level security;
alter table settings enable row level security;
alter table prospects enable row level security;
alter table messages enable row level security;

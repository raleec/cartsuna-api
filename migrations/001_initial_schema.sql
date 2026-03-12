-- Enable pg_trgm for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users
CREATE TABLE IF NOT EXISTS t_user (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  passphrase VARCHAR(256) NOT NULL,
  role VARCHAR(25) NOT NULL,
  locale VARCHAR(10) NOT NULL DEFAULT 'en',
  name VARCHAR(50) NOT NULL
);

-- Merchants
CREATE TABLE IF NOT EXISTS t_merchant (
  merchant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location TEXT,
  schedule TEXT,
  quota INTEGER,
  description TEXT,
  tags TEXT[],
  logo_url TEXT,
  banner_url TEXT,
  welcome_message TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website_url TEXT,
  social_links JSONB,
  is_private BOOLEAN NOT NULL DEFAULT false,
  tier VARCHAR(50),
  country_code VARCHAR(10),
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Customers
CREATE TABLE IF NOT EXISTS t_customer (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location TEXT,
  description TEXT,
  tags TEXT[],
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Inventory
CREATE TABLE IF NOT EXISTS t_inventory (
  inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT[],
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Items
CREATE TABLE IF NOT EXISTS t_item (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES t_merchant(merchant_id),
  inventory_id UUID REFERENCES t_inventory(inventory_id),
  name VARCHAR(255) NOT NULL,
  desc TEXT,
  image TEXT,
  unit_price DOUBLE PRECISION,
  tax DOUBLE PRECISION,
  tags TEXT[],
  status VARCHAR(25) NOT NULL DEFAULT 'active'
);

-- Orders
CREATE TABLE IF NOT EXISTS t_order (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES t_item(item_id),
  availability_id UUID,
  item_count INTEGER NOT NULL DEFAULT 1,
  memo TEXT,
  state VARCHAR(25) NOT NULL DEFAULT 'pending'
);

-- Requests
CREATE TABLE IF NOT EXISTS t_request (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES t_customer(customer_id),
  order_id UUID REFERENCES t_order(order_id),
  merchant_id UUID NOT NULL REFERENCES t_merchant(merchant_id),
  title VARCHAR(255) NOT NULL,
  desc TEXT,
  eta TIMESTAMPTZ,
  status VARCHAR(25) NOT NULL DEFAULT 'open'
);

-- Events
CREATE TABLE IF NOT EXISTS t_event (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  image TEXT,
  quota INTEGER,
  cron VARCHAR(100),
  duration INTEGER,
  tags TEXT[],
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Reviews
CREATE TABLE IF NOT EXISTS t_review (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES t_customer(customer_id),
  item_id UUID NOT NULL REFERENCES t_item(item_id),
  merchant_id UUID NOT NULL REFERENCES t_merchant(merchant_id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Favorites
CREATE TABLE IF NOT EXISTS t_favorite (
  favorite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES t_customer(customer_id),
  item_id UUID NOT NULL REFERENCES t_item(item_id),
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Punchcards
CREATE TABLE IF NOT EXISTS t_punchcard (
  punchcard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES t_customer(customer_id),
  merchant_id UUID NOT NULL REFERENCES t_merchant(merchant_id),
  punches INTEGER NOT NULL DEFAULT 0,
  max_punches INTEGER NOT NULL DEFAULT 10,
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Bids
CREATE TABLE IF NOT EXISTS t_bid (
  bid_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES t_item(item_id),
  customer_id UUID NOT NULL REFERENCES t_customer(customer_id),
  amount DOUBLE PRECISION NOT NULL,
  state VARCHAR(25) NOT NULL DEFAULT 'pending',
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Merchant-Customer association
CREATE TABLE IF NOT EXISTS t_merchant_customer (
  merchant_id UUID NOT NULL REFERENCES t_merchant(merchant_id),
  customer_id UUID NOT NULL REFERENCES t_customer(customer_id),
  PRIMARY KEY (merchant_id, customer_id)
);

-- Indexes for trgm search
CREATE INDEX IF NOT EXISTS idx_item_name_trgm ON t_item USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_merchant_name_trgm ON t_merchant USING gin (name gin_trgm_ops);

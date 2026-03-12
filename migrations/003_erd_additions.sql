-- Merchant Invites
CREATE TABLE IF NOT EXISTS t_merchant_invite (
  invite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES t_merchant(merchant_id),
  code_hash VARCHAR(256) NOT NULL,
  label VARCHAR(100),
  max_uses INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Tier Config
CREATE TABLE IF NOT EXISTS t_tier_config (
  tier_config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(10) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  max_customers_per_month INTEGER,
  max_orders_per_month INTEGER,
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Bluetooth Sessions
CREATE TABLE IF NOT EXISTS t_bluetooth_session (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES t_merchant(merchant_id),
  customer_id UUID REFERENCES t_customer(customer_id),
  state VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Item Availability
CREATE TABLE IF NOT EXISTS t_item_availability (
  availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES t_item(item_id),
  merchant_id UUID NOT NULL REFERENCES t_merchant(merchant_id),
  location_name VARCHAR(255),
  location_addr TEXT,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  rrule TEXT,
  recurrence_end TIMESTAMPTZ,
  quota INTEGER,
  booked INTEGER NOT NULL DEFAULT 0,
  unit_price DOUBLE PRECISION,
  tax DOUBLE PRECISION,
  tags TEXT[],
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Add FK from t_order to t_item_availability now that the table exists
ALTER TABLE t_order
  ADD CONSTRAINT fk_order_availability
  FOREIGN KEY (availability_id)
  REFERENCES t_item_availability(availability_id);

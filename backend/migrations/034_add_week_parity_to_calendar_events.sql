ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS week_parity VARCHAR(10);
-- week_parity: 'odd' or 'even' or null (null = every week)

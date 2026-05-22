-- ============================================================
-- Exportify: Multi-merchant schema for Supabase
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Merchants table — stores OAuth tokens per merchant
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id TEXT NOT NULL UNIQUE,          -- Ratio merchant ID (e.g. "196jdfqy1aot")
  merchant_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  scopes TEXT,                                -- comma-separated scopes
  token_expires_at TIMESTAMPTZ,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchants_merchant_id ON merchants(merchant_id);
CREATE INDEX idx_merchants_active ON merchants(is_active) WHERE is_active = TRUE;

-- 2. Export jobs table — tracks async export jobs per merchant
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id TEXT NOT NULL REFERENCES merchants(merchant_id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  format TEXT NOT NULL DEFAULT 'xlsx'
    CHECK (format IN ('xlsx', 'csv')),
  file_name TEXT NOT NULL,
  file_url TEXT,                              -- Supabase Storage URL after upload
  file_size_bytes BIGINT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_export_jobs_merchant ON export_jobs(merchant_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_created ON export_jobs(created_at DESC);

-- 3. Export job sheets — config for each sheet within a job
CREATE TABLE IF NOT EXISTS export_job_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
  entity TEXT NOT NULL CHECK (entity IN ('orders', 'products')),
  columns TEXT[] NOT NULL DEFAULT '{}',       -- selected column keys
  filters JSONB DEFAULT '[]',                 -- array of {field, value}
  total_items INT DEFAULT 0,
  processed_items INT DEFAULT 0,
  exported_rows INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_export_sheets_job ON export_job_sheets(job_id);

-- 4. Auto-update updated_at on merchants
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_merchants_updated
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Supabase Storage bucket for export files
-- Run this separately if needed:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', false);

-- 6. RLS policies (enable row-level security)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_job_sheets ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (backend uses service key)
CREATE POLICY "Service role full access" ON merchants
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access" ON export_jobs
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access" ON export_job_sheets
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

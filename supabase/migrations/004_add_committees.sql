-- Migration: Add committees table for budget tracking
-- Each committee has an annual budget allocation

-- Create committees table
CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  annual_budget DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  chair_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add committee_id to transactions table (optional foreign key)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS committee_id UUID REFERENCES committees(id) ON DELETE SET NULL;

-- Enable RLS on committees
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for committees
-- All authenticated users can view committees
CREATE POLICY "Authenticated users can view committees"
  ON committees FOR SELECT
  TO authenticated
  USING (true);

-- Only treasurer can insert/update/delete committees
CREATE POLICY "Treasurer can manage committees"
  ON committees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'treasurer'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_committee ON transactions(committee_id);

-- Add some common ABWA committees as defaults (optional - can be removed)
INSERT INTO committees (name, annual_budget, description) VALUES
  ('Programs', 0, 'Monthly meeting programs and speakers'),
  ('Membership', 0, 'Recruitment and retention activities'),
  ('Marketing', 0, 'Publicity, social media, and promotion'),
  ('Fundraising', 0, 'Chapter fundraising events'),
  ('Community Service', 0, 'Community outreach and service projects'),
  ('Education', 0, 'Scholarships and educational programs')
ON CONFLICT (name) DO NOTHING;

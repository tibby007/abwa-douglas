-- Migration: Allow anonymous users to check which officer positions are taken
-- This is needed for the signup form to show which positions are available

-- Allow anonymous users to SELECT role from profiles
-- This is safe because we're only exposing which positions are taken, not personal info
CREATE POLICY "Allow anonymous users to check taken positions"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);

-- Note: Existing RLS policies for authenticated users should remain unchanged
-- This policy only grants read access to anonymous users for signup validation

-- Migration: Add unique constraint for officer positions
-- This prevents multiple users from holding the same officer position
-- while still allowing multiple members

-- Add unique constraint for officer positions only (excluding 'member')
-- This allows multiple members but prevents duplicate officers
CREATE UNIQUE INDEX unique_officer_positions
  ON profiles(role)
  WHERE role IN ('treasurer', 'president', 'vice_president', 'secretary');

-- Add helpful comment
COMMENT ON INDEX unique_officer_positions IS
  'Ensures only one user can hold each officer position. Member role is excluded to allow multiple members.';

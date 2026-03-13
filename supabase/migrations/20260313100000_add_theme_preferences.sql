-- Add theme preference columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme_accent text NOT NULL DEFAULT 'steel'
    CHECK (theme_accent IN ('sky', 'steel', 'mint', 'amber', 'purple')),
  ADD COLUMN IF NOT EXISTS theme_mode text NOT NULL DEFAULT 'system'
    CHECK (theme_mode IN ('light', 'dark', 'system'));

-- Allow users to update their own theme preferences
-- (RLS already restricts profiles to own row via Phase 1 security policies)

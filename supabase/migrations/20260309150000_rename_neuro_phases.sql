-- Rename NEURO phases: realise → redesign, ongoing → optimise
-- PostgreSQL doesn't support ALTER TYPE RENAME VALUE, so we need to:
-- 1. Update existing rows to use new values
-- 2. Recreate the enum

-- Step 1: Remove the default temporarily
ALTER TABLE projects ALTER COLUMN neuro_phase DROP DEFAULT;

-- Step 2: Change column to text temporarily
ALTER TABLE projects ALTER COLUMN neuro_phase TYPE TEXT;

-- Step 3: Update existing values
UPDATE projects SET neuro_phase = 'redesign' WHERE neuro_phase = 'realise';
UPDATE projects SET neuro_phase = 'optimise' WHERE neuro_phase = 'ongoing';

-- Step 4: Drop and recreate the enum
DROP TYPE IF EXISTS neuro_phase;
CREATE TYPE neuro_phase AS ENUM ('needs', 'engage', 'understand', 'redesign', 'optimise');

-- Step 5: Convert column back to enum
ALTER TABLE projects ALTER COLUMN neuro_phase TYPE neuro_phase USING neuro_phase::neuro_phase;

-- Step 6: Restore default
ALTER TABLE projects ALTER COLUMN neuro_phase SET DEFAULT 'needs';

-- Add project_stage enum and stage column to projects table
CREATE TYPE project_stage AS ENUM (
  'contract_signing',
  'onboarding',
  'planning',
  'data_gathering',
  'content_build',
  'delivery',
  'analysis_feedback',
  'closing'
);

ALTER TABLE projects ADD COLUMN stage project_stage DEFAULT 'contract_signing';

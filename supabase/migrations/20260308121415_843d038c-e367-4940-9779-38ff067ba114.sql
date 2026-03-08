
-- Add missing columns to organisations
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS vat_number text;

-- Add missing columns to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_contacted timestamptz;

-- Add missing columns to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pdf_url text;

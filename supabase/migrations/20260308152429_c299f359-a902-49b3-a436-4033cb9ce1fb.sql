-- Step 2.1: Add foreign keys for document chain
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL;

-- Step 3.2: Add last_contacted index (column already exists)
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON public.contacts(last_contacted);
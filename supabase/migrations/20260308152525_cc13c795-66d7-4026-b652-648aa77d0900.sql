-- Step 2.2: Auto-create contract when proposal accepted
CREATE OR REPLACE FUNCTION public.handle_proposal_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    INSERT INTO public.contracts (title, deal_id, organisation_id, proposal_id, status, value, created_by)
    VALUES (NEW.title, NEW.deal_id, NEW.organisation_id, NEW.id, 'draft', NEW.value, NEW.created_by);

    INSERT INTO public.activity_log (entity_type, action, entity_title, entity_id)
    VALUES ('contract', 'auto_created', NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_proposal_accepted ON public.proposals;
CREATE TRIGGER on_proposal_accepted
  AFTER UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_proposal_accepted();

-- Step 2.3: Auto-create invoice when contract signed
CREATE OR REPLACE FUNCTION public.handle_contract_signed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num INTEGER;
  v_invoice_number TEXT;
  v_year TEXT;
BEGIN
  IF OLD.signed_at IS NULL AND NEW.signed_at IS NOT NULL THEN
    v_year := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'NDG-\d{4}-(\d+)') AS INTEGER)), 0) + 1
    INTO v_next_num
    FROM public.invoices
    WHERE invoice_number LIKE 'NDG-' || v_year || '-%';

    v_invoice_number := 'NDG-' || v_year || '-' || LPAD(v_next_num::TEXT, 3, '0');

    INSERT INTO public.invoices (
      invoice_number, organisation_id, deal_id, contract_id, status,
      subtotal, vat_rate, vat_amount, total,
      issue_date, due_date, created_by
    ) VALUES (
      v_invoice_number, NEW.organisation_id, NEW.deal_id, NEW.id, 'draft',
      COALESCE(NEW.value, 0), 20.00, COALESCE(NEW.value, 0) * 0.20, COALESCE(NEW.value, 0) * 1.20,
      CURRENT_DATE, CURRENT_DATE + 30, NEW.created_by
    );

    INSERT INTO public.activity_log (entity_type, action, entity_title, entity_id)
    VALUES ('invoice', 'auto_created', v_invoice_number, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_contract_signed ON public.contracts;
CREATE TRIGGER on_contract_signed
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_contract_signed();

-- 1. Add project_id to deliveries
ALTER TABLE public.deliveries
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- 2. Attach trigger: seed milestones on new project
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_project_milestones();

-- 3. Attach trigger: deal won -> create delivery
DROP TRIGGER IF EXISTS on_deal_won ON public.deals;
CREATE TRIGGER on_deal_won
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deal_won();

-- 4. Attach trigger: proposal accepted -> create contract
DROP TRIGGER IF EXISTS on_proposal_accepted ON public.proposals;
CREATE TRIGGER on_proposal_accepted
  AFTER UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_proposal_accepted();

-- 5. Attach trigger: contract signed -> create invoice
DROP TRIGGER IF EXISTS on_contract_signed ON public.contracts;
CREATE TRIGGER on_contract_signed
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_contract_signed();

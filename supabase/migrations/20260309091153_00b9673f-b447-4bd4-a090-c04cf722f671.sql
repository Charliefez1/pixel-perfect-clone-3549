
-- Notification trigger functions

-- 1. Deal won → notify the deal owner
CREATE OR REPLACE FUNCTION public.notify_deal_won()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.stage = 'won' AND (OLD.stage IS NULL OR OLD.stage <> 'won') THEN
    v_user_id := COALESCE(NEW.owner_id, (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1));
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (v_user_id, 'Deal Won! 🎉', 'Deal "' || NEW.title || '" has been marked as won.', '/deals?open=' || NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Invoice overdue → notify the creator
CREATE OR REPLACE FUNCTION public.notify_invoice_overdue()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.status = 'overdue' AND (OLD.status IS NULL OR OLD.status <> 'overdue') THEN
    v_user_id := COALESCE(NEW.created_by, (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1));
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (v_user_id, 'Invoice Overdue', 'Invoice ' || NEW.invoice_number || ' is now overdue.', '/invoices');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Proposal accepted → notify the creator
CREATE OR REPLACE FUNCTION public.notify_proposal_accepted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    v_user_id := COALESCE(NEW.created_by, (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1));
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (v_user_id, 'Proposal Accepted ✅', 'Proposal "' || NEW.title || '" has been accepted.', '/proposals');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Task assigned → notify the assignee
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR OLD.assignee_id <> NEW.assignee_id) THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (NEW.assignee_id, 'Task Assigned', 'You have been assigned: "' || NEW.title || '"', '/tasks');
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trg_notify_deal_won
  AFTER UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.notify_deal_won();

CREATE TRIGGER trg_notify_invoice_overdue
  AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.notify_invoice_overdue();

CREATE TRIGGER trg_notify_proposal_accepted
  AFTER UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.notify_proposal_accepted();

CREATE TRIGGER trg_notify_task_assigned
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_assigned();

-- Add RLS policy for storage bucket to allow authenticated users to upload/download
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Admins can delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

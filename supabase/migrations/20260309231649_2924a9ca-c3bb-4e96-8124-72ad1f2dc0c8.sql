
-- Pass 3: Fix public form access
-- Allow anyone to read active forms (for public form page)
CREATE POLICY "Anyone can view active forms"
ON public.forms
FOR SELECT
TO anon, authenticated
USING (active = true);

-- Create form_responses table if it doesn't exist (it may already exist)
CREATE TABLE IF NOT EXISTS public.form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  delivery_id uuid REFERENCES public.deliveries(id) ON DELETE SET NULL,
  respondent_name text,
  respondent_email text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert form responses (public submissions)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'form_responses' AND policyname = 'Anyone can submit form responses'
  ) THEN
    CREATE POLICY "Anyone can submit form responses"
    ON public.form_responses
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- Allow admins to read all form responses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'form_responses' AND policyname = 'Admins can read form responses'
  ) THEN
    CREATE POLICY "Admins can read form responses"
    ON public.form_responses
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Allow admins to delete form responses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'form_responses' AND policyname = 'Admins can delete form responses'
  ) THEN
    CREATE POLICY "Admins can delete form responses"
    ON public.form_responses
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Create increment function for form responses count
CREATE OR REPLACE FUNCTION public.increment_form_responses(form_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.forms
  SET responses_count = COALESCE(responses_count, 0) + 1
  WHERE id = form_id_param;
END;
$$;

-- Grant anon access to the increment function
GRANT EXECUTE ON FUNCTION public.increment_form_responses(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_form_responses(uuid) TO authenticated;

-- Pass 4: Add document template columns to templates table
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS template_type text DEFAULT 'project';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS variables jsonb DEFAULT '[]'::jsonb;

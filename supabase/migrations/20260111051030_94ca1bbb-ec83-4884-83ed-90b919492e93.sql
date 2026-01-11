-- Drop existing insecure policies on form_submissions
DROP POLICY IF EXISTS "Allow read for admin dashboard" ON public.form_submissions;
DROP POLICY IF EXISTS "Allow update for admin" ON public.form_submissions;
DROP POLICY IF EXISTS "Allow delete for admin" ON public.form_submissions;

-- Create secure policies that require admin authentication
CREATE POLICY "Admins can read form submissions" 
ON public.form_submissions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update form submissions" 
ON public.form_submissions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete form submissions" 
ON public.form_submissions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));
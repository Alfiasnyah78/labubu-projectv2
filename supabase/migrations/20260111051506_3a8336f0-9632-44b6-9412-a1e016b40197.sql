-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit a form" ON public.form_submissions;

-- Create a PERMISSIVE INSERT policy so anyone can submit forms
CREATE POLICY "Anyone can submit a form" 
ON public.form_submissions 
FOR INSERT 
TO public
WITH CHECK (true);
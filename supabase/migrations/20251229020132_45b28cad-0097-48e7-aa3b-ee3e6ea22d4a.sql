-- Create table for form submissions
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  service TEXT NOT NULL,
  land_size TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public form)
CREATE POLICY "Anyone can submit a form"
ON public.form_submissions
FOR INSERT
WITH CHECK (true);

-- Create policy to allow anyone to read (for admin dashboard - will use session auth)
CREATE POLICY "Allow read for admin dashboard"
ON public.form_submissions
FOR SELECT
USING (true);

-- Create policy to allow updates
CREATE POLICY "Allow update for admin"
ON public.form_submissions
FOR UPDATE
USING (true);

-- Create policy to allow deletes
CREATE POLICY "Allow delete for admin"
ON public.form_submissions
FOR DELETE
USING (true);
-- Create enum for submission status
CREATE TYPE public.submission_status AS ENUM ('pending', 'negosiasi', 'success');

-- Add status column to form_submissions
ALTER TABLE public.form_submissions 
ADD COLUMN status public.submission_status NOT NULL DEFAULT 'pending';

-- Add RLS policy for admins to delete profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to update profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));
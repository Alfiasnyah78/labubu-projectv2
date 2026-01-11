-- Add user_id column to form_submissions to properly link submissions to authenticated users
ALTER TABLE public.form_submissions 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for efficient user_id queries
CREATE INDEX idx_form_submissions_user_id ON public.form_submissions(user_id);

-- Add RLS policy for customers to read their own submissions (by user_id)
CREATE POLICY "Users can view their own submissions"
ON public.form_submissions
FOR SELECT
USING (auth.uid() = user_id);
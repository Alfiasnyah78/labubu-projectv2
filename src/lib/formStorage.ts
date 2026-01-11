import { supabase } from "@/integrations/supabase/client";

export type SubmissionStatus = 'pending' | 'negosiasi' | 'success';

export interface FormSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  service: string;
  land_size: string | null;
  message: string | null;
  status: SubmissionStatus;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
}

// User management functions
export const getProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return data || [];
};

export const updateProfile = async (
  id: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
};

export const deleteProfile = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting profile:', error);
    return false;
  }

  return true;
};

// Submissions functions
export const getSubmissions = async (): Promise<FormSubmission[]> => {
  const { data, error } = await supabase
    .from('form_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }

  return (data || []) as FormSubmission[];
};

export const addSubmission = async (
  submission: Omit<FormSubmission, 'id' | 'created_at' | 'status'>
): Promise<FormSubmission | null> => {
  // Get current authenticated user to link submission
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('form_submissions')
    .insert({
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      company: submission.company || null,
      service: submission.service,
      land_size: submission.land_size || null,
      message: submission.message || null,
      user_id: user?.id || null, // Link to authenticated user if logged in
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding submission:', error);
    return null;
  }

  return data as FormSubmission;
};

export const updateSubmission = async (
  id: string,
  updates: Partial<FormSubmission>
): Promise<FormSubmission | null> => {
  const { data, error } = await supabase
    .from('form_submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating submission:', error);
    return null;
  }

  return data as FormSubmission;
};

export const deleteSubmission = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('form_submissions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting submission:', error);
    return false;
  }

  return true;
};



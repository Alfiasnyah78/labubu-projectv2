import { supabase } from "@/integrations/supabase/client";

export interface FormSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  service: string;
  land_size: string | null;
  message: string | null;
  created_at: string;
}

export const getSubmissions = async (): Promise<FormSubmission[]> => {
  const { data, error } = await supabase
    .from('form_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }

  return data || [];
};

export const addSubmission = async (
  submission: Omit<FormSubmission, 'id' | 'created_at'>
): Promise<FormSubmission | null> => {
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
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding submission:', error);
    return null;
  }

  return data;
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

  return data;
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

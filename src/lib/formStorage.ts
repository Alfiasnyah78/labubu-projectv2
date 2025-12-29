export interface FormSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  landSize: string;
  message: string;
  createdAt: string;
}

const STORAGE_KEY = 'almondsense_submissions';

export const getSubmissions = (): FormSubmission[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const addSubmission = (submission: Omit<FormSubmission, 'id' | 'createdAt'>): FormSubmission => {
  const submissions = getSubmissions();
  const newSubmission: FormSubmission = {
    ...submission,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  submissions.push(newSubmission);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  return newSubmission;
};

export const updateSubmission = (id: string, updates: Partial<FormSubmission>): FormSubmission | null => {
  const submissions = getSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  submissions[index] = { ...submissions[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  return submissions[index];
};

export const deleteSubmission = (id: string): boolean => {
  const submissions = getSubmissions();
  const filtered = submissions.filter(s => s.id !== id);
  if (filtered.length === submissions.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

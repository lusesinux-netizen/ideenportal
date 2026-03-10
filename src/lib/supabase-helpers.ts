import { supabase } from '@/integrations/supabase/client';

export type DbSuggestion = {
  id: string;
  title: string;
  problem_description: string;
  solution_description: string;
  expected_benefit: string;
  category: string;
  scope: string;
  estimated_savings: string | null;
  feasibility: string;
  attachments: string[] | null;
  status: string;
  premium_class: number | null;
  premium_choice: string | null;
  jury_comment: string | null;
  submitted_by: string;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string } | null;
  suggestion_team_members?: { id: string; name: string; email: string }[];
};

export async function fetchSuggestions() {
  const { data, error } = await supabase
    .from('suggestions')
    .select('*, profiles:submitted_by(display_name), suggestion_team_members(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as DbSuggestion[];
}

export async function fetchSuggestionById(id: string) {
  const { data, error } = await supabase
    .from('suggestions')
    .select('*, profiles:submitted_by(display_name), suggestion_team_members(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as DbSuggestion;
}

export async function createSuggestion(
  suggestion: {
    title: string;
    problem_description: string;
    solution_description: string;
    expected_benefit: string;
    category: string;
    scope: string;
    estimated_savings?: string;
    feasibility: string;
    submitted_by: string;
  },
  teamMembers: { name: string; email: string }[]
) {
  const { data, error } = await supabase
    .from('suggestions')
    .insert(suggestion)
    .select()
    .single();
  if (error) throw error;

  if (teamMembers.length > 0) {
    const { error: tmError } = await supabase
      .from('suggestion_team_members')
      .insert(teamMembers.map(m => ({ ...m, suggestion_id: data.id })));
    if (tmError) throw tmError;
  }

  return data;
}

export async function updateSuggestion(id: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from('suggestions')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function fetchDashboardStats() {
  const { data, error } = await supabase
    .from('suggestions')
    .select('status, estimated_savings');
  if (error) throw error;

  const total = data.length;
  const inReview = data.filter(s => s.status === 'in_pruefung').length;
  const implemented = data.filter(s => s.status === 'umgesetzt').length;
  
  return { totalSubmitted: total, inReview, implemented, savedResources: `${implemented * 5000} €` };
}

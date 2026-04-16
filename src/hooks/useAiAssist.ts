import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAiAssist() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const callAi = async (action: string, params: Record<string, any>) => {
    setLoading(prev => ({ ...prev, [action]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { action, ...params },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return null;
      }
      return data;
    } catch (err: any) {
      toast.error('KI-Anfrage fehlgeschlagen');
      console.error('AI assist error:', err);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const improveText = async (field: string, text: string, context?: { title?: string; category?: string }) => {
    if (!text.trim()) {
      toast.error('Bitte geben Sie zuerst Text ein.');
      return null;
    }
    const result = await callAi('improve_text', { field, text, context });
    return result?.improved_text || null;
  };

  const getJuryAssessment = async (suggestion: any) => {
    const result = await callAi('jury_assessment', { suggestion });
    return result?.assessment || null;
  };

  const getSummary = async (suggestion: { title: string; problem_description: string; solution_description: string }) => {
    const result = await callAi('summarize', { suggestion });
    return result?.summary || null;
  };

  return {
    loading,
    improveText,
    getJuryAssessment,
    getSummary,
  };
}

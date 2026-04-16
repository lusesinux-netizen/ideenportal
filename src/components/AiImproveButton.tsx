import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAiAssist } from '@/hooks/useAiAssist';
import { toast } from 'sonner';

interface AiImproveButtonProps {
  field: string;
  text: string;
  onImproved: (text: string) => void;
  context?: { title?: string; category?: string };
}

export default function AiImproveButton({ field, text, onImproved, context }: AiImproveButtonProps) {
  const { improveText, loading } = useAiAssist();
  const isLoading = loading['improve_text'];

  const handleClick = async () => {
    const result = await improveText(field, text, context);
    if (result) {
      onImproved(result);
      toast.success('Text wurde von der KI verbessert');
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
      onClick={handleClick}
      disabled={isLoading || !text.trim()}
    >
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      KI-Verbesserung
    </Button>
  );
}

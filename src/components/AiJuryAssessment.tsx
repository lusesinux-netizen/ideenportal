import { useState } from 'react';
import { Sparkles, Loader2, ThumbsUp, ThumbsDown, RefreshCw, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAiAssist } from '@/hooks/useAiAssist';
import { Badge } from '@/components/ui/badge';

interface JuryAssessment {
  feasibility_score: string;
  benefit_score: string;
  suggested_premium_class: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  comment_draft: string;
}

interface AiJuryAssessmentProps {
  suggestion: any;
  onApplyComment?: (comment: string) => void;
  onApplyPremiumClass?: (cls: string) => void;
}

const scoreColors: Record<string, string> = {
  hoch: 'text-success',
  mittel: 'text-warning',
  niedrig: 'text-destructive',
};

const recommendationLabels: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  annehmen: { label: 'Annehmen', variant: 'default' },
  ablehnen: { label: 'Ablehnen', variant: 'destructive' },
  ueberarbeiten: { label: 'Überarbeiten', variant: 'secondary' },
};

export default function AiJuryAssessment({ suggestion, onApplyComment, onApplyPremiumClass }: AiJuryAssessmentProps) {
  const { getJuryAssessment, loading } = useAiAssist();
  const [assessment, setAssessment] = useState<JuryAssessment | null>(null);
  const isLoading = loading['jury_assessment'];

  const handleGenerate = async () => {
    const result = await getJuryAssessment(suggestion);
    if (result) setAssessment(result);
  };

  if (!assessment) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleGenerate}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        KI-Bewertungshilfe
      </Button>
    );
  }

  const rec = recommendationLabels[assessment.recommendation] || { label: assessment.recommendation, variant: 'secondary' as const };

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" /> KI-Einschätzung
        </h5>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Machbarkeit</p>
          <p className={`font-semibold ${scoreColors[assessment.feasibility_score] || ''}`}>{assessment.feasibility_score}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Nutzen</p>
          <p className={`font-semibold ${scoreColors[assessment.benefit_score] || ''}`}>{assessment.benefit_score}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Empfehlung</p>
          <Badge variant={rec.variant} className="mt-0.5">{rec.label}</Badge>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold text-success flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Stärken</p>
          <ul className="mt-1 space-y-0.5">{assessment.strengths.map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}</ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-destructive flex items-center gap-1"><ThumbsDown className="h-3 w-3" /> Schwächen</p>
          <ul className="mt-1 space-y-0.5">{assessment.weaknesses.map((w, i) => <li key={i} className="text-xs text-muted-foreground">• {w}</li>)}</ul>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <Award className="h-3.5 w-3.5 text-primary" />
        <span>Vorgeschlagene Prämienklasse: <strong>Klasse {assessment.suggested_premium_class}</strong></span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {onApplyComment && (
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => onApplyComment(assessment.comment_draft)}>
            Kommentar übernehmen
          </Button>
        )}
        {onApplyPremiumClass && (
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => onApplyPremiumClass(assessment.suggested_premium_class.toString())}>
            Prämienklasse übernehmen
          </Button>
        )}
      </div>
    </div>
  );
}

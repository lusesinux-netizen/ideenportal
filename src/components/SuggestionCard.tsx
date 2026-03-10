import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import { DbSuggestion } from '@/lib/supabase-helpers';
import StatusBadge from './StatusBadge';

export default function SuggestionCard({ suggestion, index = 0 }: { suggestion: DbSuggestion; index?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link to={`/vorschlag/${suggestion.id}`}>
        <div className="group rounded-xl border bg-card p-5 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={suggestion.status} />
                <span className="text-xs text-muted-foreground truncate">{suggestion.category}</span>
              </div>
              <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors truncate">{suggestion.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{suggestion.solution_description}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(suggestion.created_at).toLocaleDateString('de-DE')}</span>
                {(suggestion.suggestion_team_members?.length ?? 0) > 0 && (
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />+{suggestion.suggestion_team_members!.length}</span>
                )}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

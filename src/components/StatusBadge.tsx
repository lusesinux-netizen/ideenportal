import { SuggestionStatus } from '@/lib/types';

const statusConfig: Record<SuggestionStatus, { label: string; className: string }> = {
  eingereicht: { label: 'Eingereicht', className: 'bg-info/10 text-info border-info/20' },
  in_pruefung: { label: 'In Prüfung', className: 'bg-warning/10 text-warning border-warning/20' },
  angenommen: { label: 'Angenommen', className: 'bg-success/10 text-success border-success/20' },
  abgelehnt: { label: 'Abgelehnt', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  umgesetzt: { label: 'Umgesetzt', className: 'bg-primary/10 text-primary border-primary/20' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as SuggestionStatus] || { label: status, className: 'bg-muted text-muted-foreground border-border' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

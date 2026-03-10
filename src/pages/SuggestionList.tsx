import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SuggestionCard from '@/components/SuggestionCard';
import { useQuery } from '@tanstack/react-query';
import { fetchSuggestions } from '@/lib/supabase-helpers';

const statusOptions = [
  { value: 'alle', label: 'Alle Status' },
  { value: 'eingereicht', label: 'Eingereicht' },
  { value: 'in_pruefung', label: 'In Prüfung' },
  { value: 'angenommen', label: 'Angenommen' },
  { value: 'abgelehnt', label: 'Abgelehnt' },
  { value: 'umgesetzt', label: 'Umgesetzt' },
];

export default function SuggestionList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const { data: suggestions = [] } = useQuery({ queryKey: ['suggestions'], queryFn: fetchSuggestions });

  const filtered = suggestions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.solution_description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'alle' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alle Vorschläge</h1>
        <p className="mt-1 text-muted-foreground">{suggestions.length} Vorschläge insgesamt</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Vorschläge durchsuchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length > 0
          ? filtered.map((s, i) => <SuggestionCard key={s.id} suggestion={s} index={i} />)
          : <div className="text-center py-12 text-muted-foreground"><p>Keine Vorschläge gefunden.</p></div>
        }
      </div>
    </motion.div>
  );
}

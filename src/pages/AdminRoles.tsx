import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Shield, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

type AppRole = 'mitarbeitend' | 'jury' | 'geschaeftsfuehrung';

const ROLE_LABELS: Record<AppRole, string> = {
  mitarbeitend: 'Mitarbeitend',
  jury: 'Jury',
  geschaeftsfuehrung: 'Geschäftsführung',
};

const ROLE_COLORS: Record<AppRole, string> = {
  mitarbeitend: 'bg-muted text-muted-foreground',
  jury: 'bg-primary/10 text-primary',
  geschaeftsfuehrung: 'bg-accent/10 text-accent-foreground',
};

export default function AdminRoles() {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, display_name, email');
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['user_roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('id, user_id, role');
      if (error) throw error;
      return data;
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      toast.success('Rolle erfolgreich zugewiesen');
      setAddDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('');
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate')) {
        toast.error('Benutzer hat diese Rolle bereits');
      } else {
        toast.error('Fehler beim Zuweisen der Rolle');
      }
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      toast.success('Rolle entfernt');
    },
    onError: () => toast.error('Fehler beim Entfernen der Rolle'),
  });

  const usersWithRoles = profiles.map((profile) => ({
    ...profile,
    roles: userRoles.filter((r) => r.user_id === profile.id),
  }));

  const isLoading = loadingProfiles || loadingRoles;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Rollenverwaltung</h1>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Rolle zuweisen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Benutzer & Rollen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Laden...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rollen</TableHead>
                  <TableHead className="w-[80px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithRoles.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.display_name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        {user.roles.map((r) => (
                          <Badge key={r.id} variant="outline" className={ROLE_COLORS[r.role]}>
                            {ROLE_LABELS[r.role]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.roles
                          .filter((r) => r.role !== 'mitarbeitend')
                          .map((r) => (
                            <Button
                              key={r.id}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeRoleMutation.mutate(r.id)}
                              title={`${ROLE_LABELS[r.role]} entfernen`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolle zuweisen</DialogTitle>
            <DialogDescription>Wählen Sie einen Benutzer und die zuzuweisende Rolle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Benutzer wählen" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name} ({p.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Rolle wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jury">Jury</SelectItem>
                <SelectItem value="geschaeftsfuehrung">Geschäftsführung</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              disabled={!selectedUserId || !selectedRole || addRoleMutation.isPending}
              onClick={() => addRoleMutation.mutate({ userId: selectedUserId, role: selectedRole as AppRole })}
            >
              Zuweisen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

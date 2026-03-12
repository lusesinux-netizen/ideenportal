import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, List, Menu, X, Lightbulb, Shield, LogOut, User, Settings, FileText, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { displayName, hasRole, signOut } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/einreichen', label: 'Vorschlag einreichen', icon: PlusCircle },
    { to: '/vorschlaege', label: 'Alle Vorschläge', icon: List },
    ...(hasRole('jury') || hasRole('geschaeftsfuehrung')
      ? [
          { to: '/jury', label: 'Jury', icon: Shield },
          { to: '/jury/protokolle', label: 'Protokolle', icon: FileText },
        ]
      : []),
    ...(hasRole('geschaeftsfuehrung')
      ? [{ to: '/admin/rollen', label: 'Rollen', icon: Settings }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 gradient-hero border-b border-primary/20">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Lightbulb className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-primary-foreground leading-tight">Ideenportal</h1>
              <p className="text-xs text-primary-foreground/70">Handwerkskammer Berlin</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    size="sm"
                    className={active ? 'text-secondary-foreground font-semibold' : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-primary-foreground/70">
              <User className="h-3.5 w-3.5" /> {displayName}
            </span>
            <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden border-t border-primary-foreground/10">
              <div className="container py-3 flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}>
                      <Button variant={active ? 'secondary' : 'ghost'} className={`w-full justify-start ${!active ? 'text-primary-foreground/80 hover:bg-primary-foreground/10' : ''}`}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="container py-6 md:py-10">{children}</main>
    </div>
  );
}

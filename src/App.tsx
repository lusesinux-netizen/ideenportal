import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import SubmitSuggestion from "./pages/SubmitSuggestion";
import SuggestionList from "./pages/SuggestionList";
import SuggestionDetail from "./pages/SuggestionDetail";
import JuryView from "./pages/JuryView";
import AdminRoles from "./pages/AdminRoles";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Laden...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RoleRoute({ children, role }: { children: React.ReactNode; role: 'jury' | 'geschaeftsfuehrung' }) {
  const { hasRole } = useAuth();
  if (!hasRole(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/einreichen" element={<SubmitSuggestion />} />
                    <Route path="/vorschlaege" element={<SuggestionList />} />
                    <Route path="/vorschlag/:id" element={<SuggestionDetail />} />
                    <Route path="/jury" element={<RoleRoute role="jury"><JuryView /></RoleRoute>} />
                    <Route path="/admin/rollen" element={<RoleRoute role="geschaeftsfuehrung"><AdminRoles /></RoleRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

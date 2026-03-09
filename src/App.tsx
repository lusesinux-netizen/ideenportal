import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import SubmitSuggestion from "./pages/SubmitSuggestion";
import SuggestionList from "./pages/SuggestionList";
import SuggestionDetail from "./pages/SuggestionDetail";
import JuryView from "./pages/JuryView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/einreichen" element={<SubmitSuggestion />} />
            <Route path="/vorschlaege" element={<SuggestionList />} />
            <Route path="/vorschlag/:id" element={<SuggestionDetail />} />
            <Route path="/jury" element={<JuryView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

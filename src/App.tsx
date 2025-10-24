
import { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { QueueProvider } from "@/context/QueueContext";
import Navigation from "@/components/Navigation";
import Index from "./pages/Index";
import Tablet from "./pages/Tablet";
import Triagem from "./pages/Triagem";
import TV from "./pages/TV";
import Medico from "./pages/Medico";
import Prontuario from "./pages/Prontuario";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PwaBootstrap = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    try {
      const mm = window.matchMedia?.bind(window);
      const standalone = (mm && (mm('(display-mode: standalone)').matches || mm('(display-mode: fullscreen)').matches))
        || (navigator as any)?.standalone === true;
      if (standalone && location.pathname === '/') {
        navigate('/tablet', { replace: true });
      }
    } catch {}
  }, [navigate, location.pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <QueueProvider>
        <BrowserRouter>
          <PwaBootstrap />
          <div className="relative min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tablet" element={<Tablet />} />
              <Route path="/triagem" element={<Triagem />} />
              <Route path="/tv" element={<TV />} />
              <Route path="/medico" element={<Medico />} />
              <Route path="/prontuario" element={<Prontuario />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Navigation />
          </div>
        </BrowserRouter>
      </QueueProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

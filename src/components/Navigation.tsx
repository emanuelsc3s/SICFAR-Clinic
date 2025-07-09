
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Tablet, 
  Stethoscope, 
  Monitor, 
  Users, 
  BarChart3,
  Home
} from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/tablet', label: 'Tablet', icon: Tablet },
    { path: '/triagem', label: 'Triagem', icon: Users },
    { path: '/tv', label: 'TV', icon: Monitor },
    { path: '/medico', label: 'Médico', icon: Stethoscope },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  if (location.pathname === '/tv') {
    return null; // Não mostrar navegação na TV
  }

  return (
    <Card className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 shadow-elegant-xl bg-surface-elevated/95 backdrop-blur-lg border-0 rounded-2xl animate-slide-up">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center p-4 h-auto rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-primary text-white shadow-glow scale-105' 
                    : 'hover:bg-accent hover:scale-105 text-muted-foreground hover:text-foreground'
                } border-0`}
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Navigation;

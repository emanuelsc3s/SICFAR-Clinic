
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
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-lg bg-white/95 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center p-3 h-auto ${
                  isActive ? 'bg-primary text-white' : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Navigation;

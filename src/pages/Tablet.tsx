
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueue } from '@/context/QueueContext';
import { Patient } from '@/types/queue';
import { UserCheck, AlertTriangle, Tablet as TabletIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { printTicket } from '@/utils/printTicket';

const Tablet = () => {
  const [employeeBadge, setEmployeeBadge] = useState('');
  const { state, dispatch } = useQueue();

  const generatePassword = (type: 'normal' | 'priority') => {
    if (!employeeBadge.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o número do crachá do colaborador",
        variant: "destructive"
      });
      return;
    }

    const prefix = type === 'normal' ? 'N' : 'P';
    const count = state.patients.filter(p => p.type === type).length + 1;
    const number = `${prefix}${count.toString().padStart(3, '0')}`;

    const newPatient: Patient = {
      id: `${Date.now()}-${Math.random()}`,
      number,
      type,
      employeeBadge: employeeBadge.trim(),
      timestamp: new Date(),
      status: 'waiting'
    };

    dispatch({ type: 'ADD_PATIENT', payload: newPatient });

    toast({
      title: "Senha Gerada!",
      description: `Senha ${number} gerada com sucesso`,
    });

    // Print ticket automatically for normal passwords
    if (type === 'normal') {
      printTicket({
        number: number,
        employeeBadge: employeeBadge.trim(),
        timestamp: new Date()
      });
    }

    setEmployeeBadge('');
  };

  return (
    <div className="h-screen bg-gradient-subtle p-2 font-inter animate-fade-in overflow-hidden">
      <div className="max-w-full mx-auto h-full flex flex-col">
        {/* Compact Header */}
        <div className="text-center mb-2 animate-scale-in">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 bg-gradient-primary rounded-xl mr-3 shadow-glow">
              <TabletIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Sistema de Senhas
            </h1>
          </div>
        </div>

        {/* Compact Badge Input */}
        <Card className="mb-2 shadow-elegant-lg border-0 bg-surface-elevated backdrop-blur-sm">
          <CardHeader className="bg-gradient-primary text-white rounded-t-lg p-2">
            <CardTitle className="text-sm flex items-center justify-center">
              <UserCheck className="mr-2 w-4 h-4" />
              Crachá do Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <Input
              type="text"
              placeholder="Número do crachá"
              value={employeeBadge}
              onChange={(e) => setEmployeeBadge(e.target.value)}
              className="text-base p-2 border-2 border-muted rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              onKeyPress={(e) => e.key === 'Enter' && generatePassword('normal')}
            />
          </CardContent>
        </Card>

        {/* Compact Password Generation Cards */}
        <div className="grid grid-cols-2 gap-2 mb-2 flex-1">
          {/* Normal Password Card */}
          <Card
            className="shadow-elegant-xl hover:shadow-glow border-0 bg-surface-elevated transition-all duration-300 cursor-pointer group flex flex-col"
            onClick={() => generatePassword('normal')}
          >
            <CardContent className="p-3 text-center flex flex-col justify-between h-full">
              <div className="mb-2">
                <div className="p-2 bg-gradient-to-br from-success/10 to-success/5 rounded-xl w-fit mx-auto mb-2">
                  <UserCheck className="w-10 h-10 text-success mx-auto" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">NORMAL</h2>
                <Badge variant="outline" className="text-xs px-2 py-1 border border-success/30 text-success bg-success/5">
                  Fila: {state.stats.normalQueue}
                </Badge>
              </div>
              <Button
                size="sm"
                className="w-full text-sm py-3 bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success text-white font-bold rounded-lg shadow-elegant-lg transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  generatePassword('normal');
                }}
              >
                Gerar Senha
              </Button>
            </CardContent>
          </Card>

          {/* Priority Password Card */}
          <Card
            className="shadow-elegant-xl hover:shadow-glow border-0 bg-surface-elevated transition-all duration-300 cursor-pointer group flex flex-col"
            onClick={() => generatePassword('priority')}
          >
            <CardContent className="p-3 text-center flex flex-col justify-between h-full">
              <div className="mb-2">
                <div className="p-2 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl w-fit mx-auto mb-2">
                  <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">PRIORITÁRIA</h2>
                <Badge variant="outline" className="text-xs px-2 py-1 border border-destructive/30 text-destructive bg-destructive/5">
                  Fila: {state.stats.priorityQueue}
                </Badge>
              </div>
              <Button
                size="sm"
                className="w-full text-sm py-3 bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-white font-bold rounded-lg shadow-elegant-lg transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  generatePassword('priority');
                }}
              >
                Gerar Senha
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Compact Statistics */}
        <Card className="shadow-elegant-xl border-0 bg-surface-elevated">
          <CardHeader className="bg-gradient-subtle rounded-t-lg border-b border-border/50 p-2">
            <CardTitle className="text-sm text-center text-foreground">Estatísticas do Dia</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
                <div className="text-xl font-bold text-primary">{state.stats.totalToday}</div>
                <div className="text-[10px] text-muted-foreground font-medium">Total</div>
              </div>
              <div className="p-2 bg-gradient-to-br from-success/5 to-success/10 rounded-lg">
                <div className="text-xl font-bold text-success">{state.stats.normalQueue}</div>
                <div className="text-[10px] text-muted-foreground font-medium">Normal</div>
              </div>
              <div className="p-2 bg-gradient-to-br from-destructive/5 to-destructive/10 rounded-lg">
                <div className="text-xl font-bold text-destructive">{state.stats.priorityQueue}</div>
                <div className="text-[10px] text-muted-foreground font-medium">Prior.</div>
              </div>
              <div className="p-2 bg-gradient-to-br from-warning/5 to-warning/10 rounded-lg">
                <div className="text-xl font-bold text-warning">{state.stats.completedToday}</div>
                <div className="text-[10px] text-muted-foreground font-medium">Atend.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tablet;

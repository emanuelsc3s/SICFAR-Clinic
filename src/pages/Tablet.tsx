
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
    <div className="min-h-screen bg-gradient-subtle p-6 font-inter animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Modern Header */}
        <div className="text-center mb-16 animate-scale-in">
          <div className="flex items-center justify-center mb-8">
            <div className="p-4 bg-gradient-primary rounded-2xl mr-6 shadow-glow animate-float">
              <TabletIcon className="w-20 h-20 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Sistema de Senhas
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-muted-foreground font-light">
            Geração de Senhas Ambulatoriais
          </p>
        </div>

        {/* Elegant Badge Input */}
        <Card className="mb-12 shadow-elegant-lg border-0 bg-surface-elevated backdrop-blur-sm">
          <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
            <CardTitle className="text-3xl flex items-center justify-center py-4">
              <UserCheck className="mr-4 w-8 h-8" />
              Identificação do Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10">
            <Input
              type="text"
              placeholder="Digite o número do crachá"
              value={employeeBadge}
              onChange={(e) => setEmployeeBadge(e.target.value)}
              className="text-3xl p-8 border-2 border-muted rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-elegant-sm"
              onKeyPress={(e) => e.key === 'Enter' && generatePassword('normal')}
            />
          </CardContent>
        </Card>

        {/* Modern Password Generation Cards */}
        <div className="grid md:grid-cols-2 gap-10 mb-12">
          {/* Normal Password Card */}
          <Card 
            className="shadow-elegant-xl hover:shadow-glow border-0 bg-surface-elevated transition-all duration-500 cursor-pointer group animate-slide-up hover:scale-105" 
            onClick={() => generatePassword('normal')}
          >
            <CardContent className="p-12 text-center">
              <div className="mb-8">
                <div className="p-6 bg-gradient-to-br from-success/10 to-success/5 rounded-3xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-elegant-md">
                  <UserCheck className="w-28 h-28 text-success mx-auto" />
                </div>
                <h2 className="text-5xl font-bold text-foreground mb-4">NORMAL</h2>
                <Badge variant="outline" className="text-xl px-6 py-3 border-2 border-success/30 text-success bg-success/5">
                  Fila: {state.stats.normalQueue} pacientes
                </Badge>
              </div>
              <Button 
                size="lg" 
                className="w-full text-3xl py-8 bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success text-white font-bold rounded-xl shadow-elegant-lg hover:shadow-glow transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  generatePassword('normal');
                }}
              >
                Gerar Senha Normal
              </Button>
            </CardContent>
          </Card>

          {/* Priority Password Card */}
          <Card 
            className="shadow-elegant-xl hover:shadow-glow border-0 bg-surface-elevated transition-all duration-500 cursor-pointer group animate-slide-up hover:scale-105"
            style={{ animationDelay: '100ms' }}
            onClick={() => generatePassword('priority')}
          >
            <CardContent className="p-12 text-center">
              <div className="mb-8">
                <div className="p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-3xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-elegant-md">
                  <AlertTriangle className="w-28 h-28 text-destructive mx-auto" />
                </div>
                <h2 className="text-5xl font-bold text-foreground mb-4">PRIORITÁRIA</h2>
                <Badge variant="outline" className="text-xl px-6 py-3 border-2 border-destructive/30 text-destructive bg-destructive/5">
                  Fila: {state.stats.priorityQueue} pacientes
                </Badge>
              </div>
              <Button 
                size="lg" 
                className="w-full text-3xl py-8 bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-white font-bold rounded-xl shadow-elegant-lg hover:shadow-glow transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  generatePassword('priority');
                }}
              >
                Gerar Senha Prioritária
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Elegant Statistics */}
        <Card className="shadow-elegant-xl border-0 bg-surface-elevated animate-fade-in">
          <CardHeader className="bg-gradient-subtle rounded-t-lg border-b border-border/50">
            <CardTitle className="text-3xl text-center py-4 text-foreground">Estatísticas do Dia</CardTitle>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl shadow-elegant-sm hover:shadow-elegant-md transition-all duration-300">
                <div className="text-5xl font-bold text-primary mb-2">{state.stats.totalToday}</div>
                <div className="text-lg text-muted-foreground font-medium">Total Hoje</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-success/5 to-success/10 rounded-2xl shadow-elegant-sm hover:shadow-elegant-md transition-all duration-300">
                <div className="text-5xl font-bold text-success mb-2">{state.stats.normalQueue}</div>
                <div className="text-lg text-muted-foreground font-medium">Fila Normal</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-destructive/5 to-destructive/10 rounded-2xl shadow-elegant-sm hover:shadow-elegant-md transition-all duration-300">
                <div className="text-5xl font-bold text-destructive mb-2">{state.stats.priorityQueue}</div>
                <div className="text-lg text-muted-foreground font-medium">Fila Prioritária</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-warning/5 to-warning/10 rounded-2xl shadow-elegant-sm hover:shadow-elegant-md transition-all duration-300">
                <div className="text-5xl font-bold text-warning mb-2">{state.stats.completedToday}</div>
                <div className="text-lg text-muted-foreground font-medium">Atendidos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tablet;

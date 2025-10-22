
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueue } from '@/context/QueueContext';
import { Patient } from '@/types/queue';
import { UserCheck, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { printTicket } from '@/utils/printTicket';
import { printThermalTicket } from '@/utils/thermalPrinter';

const Tablet = () => {
  const [employeeBadge, setEmployeeBadge] = useState('');
  const { state, dispatch } = useQueue();

  const generatePassword = async (type: 'normal' | 'priority') => {
    if (!employeeBadge.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o número do crachá do colaborador",
        variant: "destructive",
      });
      return;
    }

    const prefix = type === 'normal' ? 'N' : 'P';
    const count = state.patients.filter((p) => p.type === type).length + 1;
    const number = `${prefix}${count.toString().padStart(3, '0')}`;

    const newPatient: Patient = {
      id: `${Date.now()}-${Math.random()}`,
      number,
      type,
      employeeBadge: employeeBadge.trim(),
      timestamp: new Date(),
      status: 'waiting',
    };

    dispatch({ type: 'ADD_PATIENT', payload: newPatient });

    toast({
      title: "Senha Gerada!",
      description: `Senha ${number} gerada com sucesso`,
    });

    // Impressão térmica via RawBT (Android). Fallback para impressão via janela
    try {
      await printThermalTicket({
        number,
        employeeBadge: employeeBadge.trim(),
        timestamp: new Date(),
      });
    } catch (err) {
      // Ambiente não-Android ou RawBT ausente → usa impressão HTML padrão
      printTicket({
        number,
        employeeBadge: employeeBadge.trim(),
        timestamp: new Date(),
      });
    }

    setEmployeeBadge('');
  };

  return (
    <div className="h-screen bg-gradient-subtle p-1.5 font-inter animate-fade-in overflow-hidden">
      <div className="max-w-full mx-auto h-full flex flex-col">
        {/* Ultra Compact Header - Optimized for 800x460 */}
        <div className="text-center mb-1.5 animate-scale-in">
          <div className="flex items-center justify-center">
            <img
              src="/farmace.png"
              alt="Farmace"
              className="h-8 mr-2"
            />
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Ambulatório - Senha de Atendimento
            </h1>
          </div>
        </div>

        {/* Ultra Compact Badge Input */}
        <Card className="mb-1.5 shadow-elegant-lg border-0 bg-surface-elevated backdrop-blur-sm">
        </Card>

        {/* Ultra Compact Password Generation Cards - Centered Layout */}
        <div className="flex justify-center gap-3 mb-1.5 flex-1 items-center px-4">
          {/* Normal Password Card */}
          <Card
            className="shadow-elegant-xl hover:shadow-glow border-0 bg-surface-elevated transition-all duration-300 cursor-pointer group flex flex-col w-[200px] hover:scale-105"
            onClick={() => generatePassword('normal')}
          >
            <CardContent className="p-3 text-center flex flex-col justify-between h-full">
              <div className="mb-2">
                <div className="p-2 bg-gradient-to-br from-success/10 to-success/5 rounded-lg w-fit mx-auto mb-2">
                  <UserCheck className="w-8 h-8 text-success mx-auto" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1.5">NORMAL</h2>
                <Badge variant="outline" className="text-[11px] px-2 py-0.5 border border-success/30 text-success bg-success/5">
                  Fila: {state.stats.normalQueue}
                </Badge>
              </div>
              <Button
                size="sm"
                className="w-full text-sm py-2.5 h-9 bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success text-white font-bold rounded-lg shadow-elegant-lg transition-all duration-300"
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
            className="shadow-elegant-xl hover:shadow-glow border-0 bg-surface-elevated transition-all duration-300 cursor-pointer group flex flex-col w-[200px] hover:scale-105"
            onClick={() => generatePassword('priority')}
          >
            <CardContent className="p-3 text-center flex flex-col justify-between h-full">
              <div className="mb-2">
                <div className="p-2 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-lg w-fit mx-auto mb-2">
                  <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1.5">PRIORITÁRIA</h2>
                <Badge variant="outline" className="text-[11px] px-2 py-0.5 border border-destructive/30 text-destructive bg-destructive/5">
                  Fila: {state.stats.priorityQueue}
                </Badge>
              </div>
              <Button
                size="sm"
                className="w-full text-sm py-2.5 h-9 bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-white font-bold rounded-lg shadow-elegant-lg transition-all duration-300"
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
      </div>
    </div>
  );
};

export default Tablet;

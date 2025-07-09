
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueue } from '@/context/QueueContext';
import { Patient } from '@/types/queue';
import { UserCheck, AlertTriangle, Tablet as TabletIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

    setEmployeeBadge('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 font-inter">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <TabletIcon className="w-16 h-16 text-primary mr-4" />
            <h1 className="text-6xl font-bold text-primary">Sistema de Senhas</h1>
          </div>
          <p className="text-2xl text-gray-600">Geração de Senhas Ambulatoriais</p>
        </div>

        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-primary text-white">
            <CardTitle className="text-2xl flex items-center">
              <UserCheck className="mr-3" />
              Identificação do Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Digite o número do crachá"
                value={employeeBadge}
                onChange={(e) => setEmployeeBadge(e.target.value)}
                className="text-2xl p-6 flex-1"
                onKeyPress={(e) => e.key === 'Enter' && generatePassword('normal')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" 
                onClick={() => generatePassword('normal')}>
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <UserCheck className="w-24 h-24 text-green-500 mx-auto mb-4" />
                <h2 className="text-4xl font-bold text-gray-800 mb-2">NORMAL</h2>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Fila: {state.stats.normalQueue} pacientes
                </Badge>
              </div>
              <Button 
                size="lg" 
                className="w-full text-2xl py-8 bg-green-500 hover:bg-green-600"
                onClick={(e) => {
                  e.stopPropagation();
                  generatePassword('normal');
                }}
              >
                Gerar Senha Normal
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => generatePassword('priority')}>
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-4" />
                <h2 className="text-4xl font-bold text-gray-800 mb-2">PRIORITÁRIA</h2>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Fila: {state.stats.priorityQueue} pacientes
                </Badge>
              </div>
              <Button 
                size="lg" 
                className="w-full text-2xl py-8 bg-red-500 hover:bg-red-600"
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

        <Card className="shadow-lg">
          <CardHeader className="bg-gray-100">
            <CardTitle className="text-xl">Estatísticas do Dia</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{state.stats.totalToday}</div>
                <div className="text-sm text-gray-600">Total Hoje</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">{state.stats.normalQueue}</div>
                <div className="text-sm text-gray-600">Fila Normal</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-500">{state.stats.priorityQueue}</div>
                <div className="text-sm text-gray-600">Fila Prioritária</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500">{state.stats.completedToday}</div>
                <div className="text-sm text-gray-600">Atendidos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tablet;

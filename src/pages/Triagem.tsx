
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueue } from '@/context/QueueContext';
import { Clock, User, Phone, AlertTriangle, UserCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Triagem = () => {
  const { state, dispatch } = useQueue();
  
  const waitingPatients = state.patients
    .filter(p => p.status === 'waiting')
    .sort((a, b) => {
      // Prioridade primeiro, depois por horário
      if (a.type !== b.type) {
        return a.type === 'priority' ? -1 : 1;
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

  const calledPatients = state.patients.filter(p => p.status === 'called');

  const callPatient = (patientId: string) => {
    dispatch({ 
      type: 'CALL_PATIENT', 
      payload: { 
        patientId, 
        location: 'Triagem', 
        attendant: 'Atendente Triagem' 
      } 
    });
    
    const patient = state.patients.find(p => p.id === patientId);
    toast({
      title: "Paciente Chamado!",
      description: `Senha ${patient?.number} chamada para Triagem`,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getWaitTime = (timestamp: Date) => {
    const diff = Date.now() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes}min`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 font-inter">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-2">TRIAGEM</h1>
          <p className="text-xl text-gray-600">Painel de Atendimento</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Fila de Espera */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-primary text-white">
                <CardTitle className="text-2xl flex items-center">
                  <Clock className="mr-3" />
                  Fila de Espera ({waitingPatients.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {waitingPatients.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-xl">Nenhum paciente na fila</p>
                    </div>
                  ) : (
                    waitingPatients.map((patient, index) => (
                      <div 
                        key={patient.id} 
                        className={`p-6 border-b hover:bg-gray-50 ${index === 0 ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-primary">
                                {patient.number}
                              </div>
                              <Badge 
                                variant={patient.type === 'priority' ? 'destructive' : 'default'}
                                className="mt-1"
                              >
                                {patient.type === 'priority' ? (
                                  <>
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Prioritária
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Normal
                                  </>
                                )}
                              </Badge>
                            </div>
                            
                            <div>
                              <p className="font-medium">Crachá: {patient.employeeBadge}</p>
                              <p className="text-sm text-gray-600">
                                Chegada: {formatTime(patient.timestamp)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Aguardando: {getWaitTime(patient.timestamp)}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            size="lg"
                            onClick={() => callPatient(patient.id)}
                            className={`${index === 0 ? 'animate-pulse-soft' : ''}`}
                            disabled={index !== 0}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Chamar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pacientes em Atendimento */}
          <div>
            <Card className="shadow-lg">
              <CardHeader className="bg-green-500 text-white">
                <CardTitle className="text-xl flex items-center">
                  <User className="mr-2" />
                  Em Atendimento ({calledPatients.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {calledPatients.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum paciente em atendimento
                    </p>
                  ) : (
                    calledPatients.map((patient) => (
                      <div key={patient.id} className="p-4 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-700">
                          {patient.number}
                        </div>
                        <div className="text-sm text-gray-600">
                          Chamado: {patient.calledAt ? formatTime(patient.calledAt) : '-'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Atendente: {patient.attendant}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="shadow-lg mt-6">
              <CardHeader className="bg-gray-100">
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Fila Normal:</span>
                    <Badge variant="outline">{state.stats.normalQueue}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Fila Prioritária:</span>
                    <Badge variant="destructive">{state.stats.priorityQueue}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Hoje:</span>
                    <Badge>{state.stats.totalToday}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Atendidos:</span>
                    <Badge variant="default">{state.stats.completedToday}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Triagem;


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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Triagem</h1>
              <p className="text-sm text-gray-600">Painel de Atendimento</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Fila de Espera */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="mr-2 w-5 h-5" />
                  Fila de Espera ({waitingPatients.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {waitingPatients.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Nenhum paciente na fila</p>
                    </div>
                  ) : (
                    waitingPatients.map((patient, index) => (
                      <div 
                        key={patient.id} 
                        className={`p-4 border-b border-gray-200 hover:bg-gray-50 ${
                          index === 0 ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {patient.number}
                              </div>
                              <Badge 
                                variant={patient.type === 'priority' ? 'destructive' : 'secondary'}
                                className="mt-1 text-xs"
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
                              <p className="font-medium text-gray-900">Crachá: {patient.employeeBadge}</p>
                              <p className="text-sm text-gray-600">
                                Chegada: {formatTime(patient.timestamp)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Aguardando: {getWaitTime(patient.timestamp)}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => callPatient(patient.id)}
                            className="bg-blue-600 hover:bg-blue-700"
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pacientes em Atendimento */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="mr-2 w-5 h-5" />
                  Em Atendimento ({calledPatients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calledPatients.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      Nenhum paciente em atendimento
                    </p>
                  ) : (
                    calledPatients.map((patient) => (
                      <div key={patient.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
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
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fila Normal:</span>
                    <Badge variant="outline">{state.stats.normalQueue}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fila Prioritária:</span>
                    <Badge variant="destructive">{state.stats.priorityQueue}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Hoje:</span>
                    <Badge>{state.stats.totalToday}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Atendidos:</span>
                    <Badge variant="secondary">{state.stats.completedToday}</Badge>
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

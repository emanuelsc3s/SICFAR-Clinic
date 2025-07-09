
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueue } from '@/context/QueueContext';
import { Stethoscope, Clock, User, Phone, AlertTriangle, UserCheck, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Medico = () => {
  const { state, dispatch } = useQueue();
  const [selectedRoom, setSelectedRoom] = useState('1');
  
  const calledPatients = state.patients.filter(p => p.status === 'called');
  const patientsForConsulting = calledPatients.filter(p => 
    p.attendant === 'Atendente Triagem' && !p.consultingRoom
  );

  const patientsInConsulting = state.patients.filter(p => 
    p.status === 'called' && p.consultingRoom
  );

  const callToConsulting = (patientId: string) => {
    const room = `Consultório ${selectedRoom}`;
    dispatch({ 
      type: 'CALL_PATIENT', 
      payload: { 
        patientId, 
        location: room, 
        attendant: `Médico Consultório ${selectedRoom}` 
      } 
    });
    
    // Atualizar o consultório do paciente
    const updatedPatients = state.patients.map(patient => 
      patient.id === patientId 
        ? { ...patient, consultingRoom: room }
        : patient
    );
    
    const patient = state.patients.find(p => p.id === patientId);
    toast({
      title: "Paciente Chamado!",
      description: `Senha ${patient?.number} chamada para ${room}`,
    });
  };

  const completeConsultation = (patientId: string) => {
    dispatch({ type: 'COMPLETE_PATIENT', payload: patientId });
    
    const patient = state.patients.find(p => p.id === patientId);
    toast({
      title: "Consulta Finalizada!",
      description: `Atendimento da senha ${patient?.number} concluído`,
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

  const consultingRooms = ['1', '2', '3', '4', '5'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Stethoscope className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Área Médica</h1>
                <p className="text-sm text-gray-600">Painel de Atendimento Médico</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Consultório:</span>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {consultingRooms.map(room => (
                    <SelectItem key={room} value={room}>
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Fila Pós-Triagem */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="mr-2 w-5 h-5" />
                  Fila Pós-Triagem ({patientsForConsulting.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {patientsForConsulting.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Nenhum paciente aguardando consulta</p>
                    </div>
                  ) : (
                    patientsForConsulting.map((patient, index) => (
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
                                Triagem: {patient.calledAt ? formatTime(patient.calledAt) : '-'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Aguardando consulta: {patient.calledAt ? getWaitTime(patient.calledAt) : '-'}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => callToConsulting(patient.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Chamar para Consultório {selectedRoom}
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
            {/* Pacientes em Consulta */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Stethoscope className="mr-2 w-5 h-5" />
                  Em Consulta ({patientsInConsulting.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patientsInConsulting.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      Nenhum paciente em consulta
                    </p>
                  ) : (
                    patientsInConsulting.map((patient) => (
                      <div key={patient.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-lg font-bold text-green-700">
                              {patient.number}
                            </div>
                            <div className="text-sm text-gray-600">
                              {patient.consultingRoom}
                            </div>
                            <div className="text-sm text-gray-600">
                              Início: {patient.calledAt ? formatTime(patient.calledAt) : '-'}
                            </div>
                          </div>
                          <Badge 
                            variant={patient.type === 'priority' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {patient.type === 'priority' ? 'PRIOR' : 'NORMAL'}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => completeConsultation(patient.id)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Finalizar Consulta
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Consultórios */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Consultórios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consultingRooms.map(room => {
                    const roomPatients = patientsInConsulting.filter(p => 
                      p.consultingRoom === `Consultório ${room}`
                    );
                    return (
                      <div key={room} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Consultório {room}:</span>
                        <Badge variant={roomPatients.length > 0 ? 'default' : 'outline'}>
                          {roomPatients.length > 0 ? 'Ocupado' : 'Livre'}
                        </Badge>
                      </div>
                    );
                  })}
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
                    <span className="text-sm text-gray-600">Aguardando Consulta:</span>
                    <Badge variant="outline">{patientsForConsulting.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Em Consulta:</span>
                    <Badge variant="default">{patientsInConsulting.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Atendidos Hoje:</span>
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

export default Medico;

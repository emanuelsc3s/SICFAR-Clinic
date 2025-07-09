
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 font-inter">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Stethoscope className="w-12 h-12 text-primary mr-4" />
            <h1 className="text-5xl font-bold text-primary">ÁREA MÉDICA</h1>
          </div>
          <p className="text-xl text-gray-600">Painel de Atendimento Médico</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Fila Pós-Triagem */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-primary text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl flex items-center">
                    <Clock className="mr-3" />
                    Fila Pós-Triagem ({patientsForConsulting.length})
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Consultório:</span>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger className="w-24 bg-white/10 border-white/20 text-white">
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
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {patientsForConsulting.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-xl">Nenhum paciente aguardando consulta</p>
                    </div>
                  ) : (
                    patientsForConsulting.map((patient, index) => (
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
                                Triagem: {patient.calledAt ? formatTime(patient.calledAt) : '-'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Aguardando consulta: {patient.calledAt ? getWaitTime(patient.calledAt) : '-'}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            size="lg"
                            onClick={() => callToConsulting(patient.id)}
                            className={`${index === 0 ? 'animate-pulse-soft' : ''}`}
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

          {/* Pacientes em Consulta */}
          <div>
            <Card className="shadow-lg">
              <CardHeader className="bg-green-500 text-white">
                <CardTitle className="text-xl flex items-center">
                  <Stethoscope className="mr-2" />
                  Em Consulta ({patientsInConsulting.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {patientsInConsulting.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum paciente em consulta
                    </p>
                  ) : (
                    patientsInConsulting.map((patient) => (
                      <div key={patient.id} className="p-4 bg-green-50 rounded-lg">
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
                            variant={patient.type === 'priority' ? 'destructive' : 'default'}
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

            {/* Estatísticas por Consultório */}
            <Card className="shadow-lg mt-6">
              <CardHeader className="bg-gray-100">
                <CardTitle className="text-lg">Consultórios</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {consultingRooms.map(room => {
                    const roomPatients = patientsInConsulting.filter(p => 
                      p.consultingRoom === `Consultório ${room}`
                    );
                    return (
                      <div key={room} className="flex items-center justify-between">
                        <span>Consultório {room}:</span>
                        <Badge variant={roomPatients.length > 0 ? 'default' : 'outline'}>
                          {roomPatients.length > 0 ? 'Ocupado' : 'Livre'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas Gerais */}
            <Card className="shadow-lg mt-6">
              <CardHeader className="bg-gray-100">
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Aguardando Consulta:</span>
                    <Badge variant="outline">{patientsForConsulting.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Em Consulta:</span>
                    <Badge variant="default">{patientsInConsulting.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Atendidos Hoje:</span>
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

export default Medico;

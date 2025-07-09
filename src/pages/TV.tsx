
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueue } from '@/context/QueueContext';
import { Monitor, Clock, AlertTriangle, UserCheck } from 'lucide-react';

const TV = () => {
  const { state } = useQueue();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentCalls = state.currentCalls.slice(0, 2);
  const recentHistory = state.currentCalls.slice(0, 6);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-900 text-white font-inter overflow-hidden">
      {/* Header */}
      <div className="bg-black/20 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Monitor className="w-12 h-12 mr-4" />
            <div>
              <h1 className="text-4xl font-bold">PAINEL DE CHAMADAS</h1>
              <p className="text-xl opacity-90">Sistema Ambulatorial</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-mono font-bold">{formatTime(currentTime)}</div>
            <div className="text-lg opacity-90">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Chamadas Atuais */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <AlertTriangle className="w-8 h-8 mr-3 text-yellow-400" />
            CHAMADAS ATUAIS
          </h2>
          
          {currentCalls.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-12 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-2xl opacity-75">Nenhuma chamada ativa no momento</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {currentCalls.map((call, index) => (
                <Card key={call.id} className="bg-white/10 backdrop-blur-sm border-white/20 animate-pulse-soft">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-6xl font-bold text-yellow-400 mb-2">
                            {call.patientNumber}
                          </div>
                          <Badge 
                            variant={call.patientNumber.startsWith('P') ? 'destructive' : 'default'}
                            className="text-lg px-4 py-2"
                          >
                            {call.patientNumber.startsWith('P') ? (
                              <>
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Prioritária
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Normal
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="text-2xl">
                          <div className="font-bold mb-2">DIRIJA-SE PARA:</div>
                          <div className="text-4xl font-bold text-yellow-400">
                            {call.location}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-xl opacity-75">
                        <div>Chamada às</div>
                        <div className="font-mono text-2xl">
                          {formatTime(call.timestamp)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Histórico */}
        <div>
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <Clock className="w-8 h-8 mr-3" />
            ÚLTIMAS CHAMADAS
          </h2>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              {recentHistory.length === 0 ? (
                <p className="text-center text-xl opacity-75 py-8">
                  Nenhuma chamada registrada ainda
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentHistory.map((call, index) => (
                    <div 
                      key={call.id} 
                      className={`p-4 rounded-lg bg-white/5 border border-white/10 ${
                        index < 2 ? 'ring-2 ring-yellow-400/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-yellow-400">
                          {call.patientNumber}
                        </span>
                        <Badge 
                          variant={call.patientNumber.startsWith('P') ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {call.patientNumber.startsWith('P') ? 'PRIOR' : 'NORMAL'}
                        </Badge>
                      </div>
                      <div className="text-lg font-medium mb-1">{call.location}</div>
                      <div className="text-sm opacity-75 font-mono">
                        {formatTime(call.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas no rodapé */}
        <div className="mt-12 grid grid-cols-4 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {state.stats.totalToday}
              </div>
              <div className="text-lg opacity-75">Senhas Hoje</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {state.stats.normalQueue}
              </div>
              <div className="text-lg opacity-75">Fila Normal</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">
                {state.stats.priorityQueue}
              </div>
              <div className="text-lg opacity-75">Fila Prioritária</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {state.stats.completedToday}
              </div>
              <div className="text-lg opacity-75">Atendidos</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TV;

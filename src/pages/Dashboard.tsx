
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueue } from '@/context/QueueContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, Users, Clock, TrendingUp, Calendar, Activity } from 'lucide-react';

const Dashboard = () => {
  const { state } = useQueue();

  // Dados para gráficos (simulados para demonstração)
  const hourlyData = [
    { hora: '08:00', normal: 5, prioritaria: 2 },
    { hora: '09:00', normal: 8, prioritaria: 3 },
    { hora: '10:00', normal: 12, prioritaria: 4 },
    { hora: '11:00', normal: 15, prioritaria: 6 },
    { hora: '12:00', normal: 10, prioritaria: 3 },
    { hora: '13:00', normal: 8, prioritaria: 2 },
    { hora: '14:00', normal: 14, prioritaria: 5 },
    { hora: '15:00', normal: 18, prioritaria: 7 },
    { hora: '16:00', normal: 16, prioritaria: 6 },
    { hora: '17:00', normal: 12, prioritaria: 4 },
  ];

  const typeDistribution = [
    { name: 'Normal', value: state.stats.normalQueue + state.stats.completedToday * 0.7, color: '#22c55e' },
    { name: 'Prioritária', value: state.stats.priorityQueue + state.stats.completedToday * 0.3, color: '#ef4444' }
  ];

  const weeklyTrend = [
    { dia: 'Seg', atendimentos: 45 },
    { dia: 'Ter', atendimentos: 52 },
    { dia: 'Qua', atendimentos: 38 },
    { dia: 'Qui', atendimentos: 61 },
    { dia: 'Sex', atendimentos: state.stats.totalToday },
    { dia: 'Sáb', atendimentos: 28 },
    { dia: 'Dom', atendimentos: 15 },
  ];

  const averageWaitTime = 25; // minutos simulados
  const peakHour = "15:00";
  const efficiency = 92; // percentual simulado

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 font-inter">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BarChart3 className="w-12 h-12 text-primary mr-4" />
            <h1 className="text-5xl font-bold text-primary">DASHBOARD</h1>
          </div>
          <p className="text-xl text-gray-600">Relatórios e Análises do Sistema</p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-primary mb-1">
                {state.stats.totalToday}
              </div>
              <div className="text-sm text-gray-600">Total Hoje</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-orange-500 mb-1">
                {averageWaitTime}min
              </div>
              <div className="text-sm text-gray-600">Tempo Médio</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-500 mb-1">
                {efficiency}%
              </div>
              <div className="text-sm text-gray-600">Eficiência</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <Activity className="w-12 h-12 text-purple-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-purple-500 mb-1">
                {peakHour}
              </div>
              <div className="text-sm text-gray-600">Pico de Movimento</div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Barras - Atendimentos por Hora */}
          <Card className="shadow-lg">
            <CardHeader className="bg-primary text-white">
              <CardTitle className="text-xl flex items-center">
                <BarChart3 className="mr-2" />
                Atendimentos por Hora
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="normal" fill="#22c55e" name="Normal" />
                  <Bar dataKey="prioritaria" fill="#ef4444" name="Prioritária" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Distribuição por Tipo */}
          <Card className="shadow-lg">
            <CardHeader className="bg-green-500 text-white">
              <CardTitle className="text-xl flex items-center">
                <Users className="mr-2" />
                Distribuição por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Linha - Tendência Semanal */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-purple-500 text-white">
                <CardTitle className="text-xl flex items-center">
                  <TrendingUp className="mr-2" />
                  Tendência Semanal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="atendimentos" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Status Atual */}
          <div>
            <Card className="shadow-lg">
              <CardHeader className="bg-gray-700 text-white">
                <CardTitle className="text-xl flex items-center">
                  <Calendar className="mr-2" />
                  Status Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fila Normal</span>
                    <Badge variant="default" className="bg-green-500">
                      {state.stats.normalQueue}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fila Prioritária</span>
                    <Badge variant="destructive">
                      {state.stats.priorityQueue}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Em Atendimento</span>
                    <Badge variant="outline">
                      {state.patients.filter(p => p.status === 'called').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Concluídos</span>
                    <Badge variant="default" className="bg-blue-500">
                      {state.stats.completedToday}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alertas */}
            <Card className="shadow-lg mt-6">
              <CardHeader className="bg-orange-500 text-white">
                <CardTitle className="text-lg">Alertas</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {state.stats.priorityQueue > 5 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">
                        Fila prioritária alta: {state.stats.priorityQueue} pacientes
                      </p>
                    </div>
                  )}
                  {averageWaitTime > 30 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700 font-medium">
                        Tempo de espera elevado: {averageWaitTime}min
                      </p>
                    </div>
                  )}
                  {state.stats.normalQueue + state.stats.priorityQueue === 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">
                        Sistema funcionando normalmente
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

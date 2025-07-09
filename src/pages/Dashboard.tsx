
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Relatórios e Análises do Sistema</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">{state.stats.totalToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{averageWaitTime}min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Eficiência</p>
                  <p className="text-2xl font-bold text-gray-900">{efficiency}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pico de Movimento</p>
                  <p className="text-2xl font-bold text-gray-900">{peakHour}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Barras - Atendimentos por Hora */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="mr-2 w-5 h-5" />
                Atendimentos por Hora
              </CardTitle>
            </CardHeader>
            <CardContent>
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
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="mr-2 w-5 h-5" />
                Distribuição por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
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

        {/* Gráfico de Linha e Status */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="mr-2 w-5 h-5" />
                  Tendência Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
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

          {/* Status Atual e Alertas */}
          <div className="space-y-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="mr-2 w-5 h-5" />
                  Status Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Fila Normal</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {state.stats.normalQueue}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Fila Prioritária</span>
                    <Badge variant="destructive">
                      {state.stats.priorityQueue}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Em Atendimento</span>
                    <Badge variant="outline">
                      {state.patients.filter(p => p.status === 'called').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Concluídos</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {state.stats.completedToday}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alertas */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Alertas</CardTitle>
              </CardHeader>
              <CardContent>
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

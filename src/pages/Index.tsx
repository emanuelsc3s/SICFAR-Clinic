
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '@/context/QueueContext';
import { 
  Tablet, 
  Stethoscope, 
  Monitor, 
  Users, 
  BarChart3,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { state } = useQueue();

  const modules = [
    {
      title: 'TABLET',
      description: 'Geração de senhas para pacientes',
      icon: Tablet,
      path: '/tablet',
      color: 'bg-blue-500 hover:bg-blue-600',
      features: ['Senhas Normal/Prioritária', 'Identificação por crachá', 'Interface touch-friendly']
    },
    {
      title: 'TRIAGEM',
      description: 'Painel de atendimento da triagem',
      icon: Users,
      path: '/triagem',
      color: 'bg-green-500 hover:bg-green-600',
      features: ['Lista de pacientes', 'Chamada para triagem', 'Controle de fila']
    },
    {
      title: 'TV',
      description: 'Painel de chamadas público',
      icon: Monitor,
      path: '/tv',
      color: 'bg-purple-500 hover:bg-purple-600',
      features: ['Chamadas em tempo real', 'Histórico de senhas', 'Interface fullscreen']
    },
    {
      title: 'MÉDICO',
      description: 'Painel médico para consultas',
      icon: Stethoscope,
      path: '/medico',
      color: 'bg-red-500 hover:bg-red-600',
      features: ['Fila pós-triagem', 'Chamada por consultório', 'Controle de atendimento']
    },
    {
      title: 'DASHBOARD',
      description: 'Relatórios e análises',
      icon: BarChart3,
      path: '/dashboard',
      color: 'bg-orange-500 hover:bg-orange-600',
      features: ['Métricas em tempo real', 'Gráficos interativos', 'Relatórios detalhados']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-900 text-white font-inter">
      {/* Header */}
      <div className="bg-black/20 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Activity className="w-16 h-16 mr-4" />
            <h1 className="text-6xl font-bold">Sistema de Senhas Ambulatoriais</h1>
          </div>
          <p className="text-2xl opacity-90">
            Gestão completa de filas e atendimento médico
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-blue-300" />
              <div className="text-3xl font-bold mb-1">{state.stats.totalToday}</div>
              <div className="text-sm opacity-75">Total Hoje</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-green-300" />
              <div className="text-3xl font-bold mb-1">{state.stats.normalQueue}</div>
              <div className="text-sm opacity-75">Fila Normal</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-300" />
              <div className="text-3xl font-bold mb-1">{state.stats.priorityQueue}</div>
              <div className="text-sm opacity-75">Fila Prioritária</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Activity className="w-12 h-12 mx-auto mb-3 text-purple-300" />
              <div className="text-3xl font-bold mb-1">{state.stats.completedToday}</div>
              <div className="text-sm opacity-75">Atendidos</div>
            </CardContent>
          </Card>
        </div>

        {/* Módulos do Sistema */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.path} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full ${module.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-12 h-12" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{module.title}</CardTitle>
                  <p className="text-lg opacity-90">{module.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 mb-6">
                    {module.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm opacity-80">
                        <div className="w-2 h-2 bg-white/50 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => navigate(module.path)}
                    className={`w-full ${module.color} text-white font-semibold py-3 text-lg`}
                  >
                    Acessar {module.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Fluxo do Sistema */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mt-12">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Fluxo do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center items-center gap-4 text-lg">
              <div className="flex items-center bg-blue-500/20 px-4 py-2 rounded-full">
                <Tablet className="w-5 h-5 mr-2" />
                Gerar Senha
              </div>
              <div className="text-2xl">→</div>
              <div className="flex items-center bg-green-500/20 px-4 py-2 rounded-full">
                <Users className="w-5 h-5 mr-2" />
                Triagem
              </div>
              <div className="text-2xl">→</div>
              <div className="flex items-center bg-purple-500/20 px-4 py-2 rounded-full">
                <Monitor className="w-5 h-5 mr-2" />
                TV Mostra Chamada
              </div>
              <div className="text-2xl">→</div>
              <div className="flex items-center bg-red-500/20 px-4 py-2 rounded-full">
                <Stethoscope className="w-5 h-5 mr-2" />
                Consulta Médica
              </div>
              <div className="text-2xl">→</div>
              <div className="flex items-center bg-orange-500/20 px-4 py-2 rounded-full">
                <Monitor className="w-5 h-5 mr-2" />
                TV Mostra Consultório
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

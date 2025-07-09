
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
  AlertTriangle,
  FileText
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
      color: 'bg-blue-600 hover:bg-blue-700',
      features: ['Senhas Normal/Prioritária', 'Identificação por crachá', 'Interface touch-friendly']
    },
    {
      title: 'TRIAGEM',
      description: 'Painel de atendimento da triagem',
      icon: Users,
      path: '/triagem',
      color: 'bg-green-600 hover:bg-green-700',
      features: ['Lista de pacientes', 'Chamada para triagem', 'Controle de fila']
    },
    {
      title: 'TV',
      description: 'Painel de chamadas público',
      icon: Monitor,
      path: '/tv',
      color: 'bg-purple-600 hover:bg-purple-700',
      features: ['Chamadas em tempo real', 'Histórico de senhas', 'Interface fullscreen']
    },
    {
      title: 'MÉDICO',
      description: 'Painel médico para consultas',
      icon: Stethoscope,
      path: '/medico',
      color: 'bg-red-600 hover:bg-red-700',
      features: ['Fila pós-triagem', 'Chamada por consultório', 'Controle de atendimento']
    },
    {
      title: 'PRONTUÁRIO',
      description: 'Sistema de prontuário eletrônico',
      icon: FileText,
      path: '/prontuario',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      features: ['Anamnese completa', 'Exame físico', 'Prescrições médicas']
    },
    {
      title: 'DASHBOARD',
      description: 'Relatórios e análises',
      icon: BarChart3,
      path: '/dashboard',
      color: 'bg-orange-600 hover:bg-orange-700',
      features: ['Métricas em tempo real', 'Gráficos interativos', 'Relatórios detalhados']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Senhas Ambulatoriais</h1>
              <p className="text-sm text-gray-600">Gestão completa de filas e atendimento médico</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Estatísticas */}
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fila Normal</p>
                  <p className="text-2xl font-bold text-gray-900">{state.stats.normalQueue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fila Prioritária</p>
                  <p className="text-2xl font-bold text-gray-900">{state.stats.priorityQueue}</p>
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
                  <p className="text-sm font-medium text-gray-600">Atendidos</p>
                  <p className="text-2xl font-bold text-gray-900">{state.stats.completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card 
                key={module.path} 
                className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(module.path)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-gray-100 rounded-lg mr-4 group-hover:bg-gray-200 transition-colors">
                      <Icon className="w-8 h-8 text-gray-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">{module.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 mb-6">
                    {module.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(module.path);
                    }}
                  >
                    Acessar {module.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Fluxo do Sistema */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Fluxo do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-md border border-blue-200">
                <Tablet className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium text-blue-900">Gerar Senha</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center bg-green-50 px-4 py-2 rounded-md border border-green-200">
                <Users className="w-4 h-4 mr-2 text-green-600" />
                <span className="font-medium text-green-900">Triagem</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center bg-purple-50 px-4 py-2 rounded-md border border-purple-200">
                <Monitor className="w-4 h-4 mr-2 text-purple-600" />
                <span className="font-medium text-purple-900">TV Chamada</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center bg-red-50 px-4 py-2 rounded-md border border-red-200">
                <Stethoscope className="w-4 h-4 mr-2 text-red-600" />
                <span className="font-medium text-red-900">Consulta</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

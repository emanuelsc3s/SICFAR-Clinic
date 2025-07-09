
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
    <div className="min-h-screen bg-gradient-primary text-white font-inter animate-fade-in">
      {/* Modern Header with Glass Effect */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6 animate-scale-in">
            <div className="p-4 bg-white/10 rounded-2xl mr-6 shadow-glow animate-float">
              <Activity className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Sistema de Senhas Ambulatoriais
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-white/90 font-light">
            Gestão completa de filas e atendimento médico
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Estatísticas Elegantes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 animate-slide-up">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-elegant-lg hover:shadow-glow transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-blue-300" />
              </div>
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{state.stats.totalToday}</div>
              <div className="text-sm text-white/70 font-medium">Total Hoje</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-elegant-lg hover:shadow-glow transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-green-300" />
              </div>
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{state.stats.normalQueue}</div>
              <div className="text-sm text-white/70 font-medium">Fila Normal</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-elegant-lg hover:shadow-glow transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-8 h-8 text-red-300" />
              </div>
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{state.stats.priorityQueue}</div>
              <div className="text-sm text-white/70 font-medium">Fila Prioritária</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-elegant-lg hover:shadow-glow transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-8 h-8 text-purple-300" />
              </div>
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{state.stats.completedToday}</div>
              <div className="text-sm text-white/70 font-medium">Atendidos</div>
            </CardContent>
          </Card>
        </div>

        {/* Módulos Modernos */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card 
                key={module.path} 
                className="bg-white/10 backdrop-blur-lg border-white/20 shadow-elegant-lg hover:shadow-glow hover:bg-white/15 transition-all duration-500 cursor-pointer group animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(module.path)}
              >
                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-6">
                    <div className="relative p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl group-hover:scale-110 group-hover:shadow-glow transition-all duration-500">
                      <Icon className="w-16 h-16 text-white drop-shadow-lg" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                    {module.title}
                  </CardTitle>
                  <p className="text-lg text-white/80 font-light leading-relaxed">{module.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {module.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-white/70 group-hover:text-white/90 transition-colors duration-300">
                        <div className="w-2 h-2 bg-gradient-to-r from-white/60 to-white/40 rounded-full mr-4 group-hover:shadow-glow transition-all duration-300"></div>
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-gradient-to-r from-white/20 to-white/10 text-white border border-white/30 hover:bg-gradient-to-r hover:from-white/30 hover:to-white/20 hover:border-white/50 font-semibold py-4 text-lg rounded-xl shadow-elegant-md hover:shadow-glow transition-all duration-300 backdrop-blur-sm"
                  >
                    Acessar {module.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Fluxo Moderno */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-elegant-xl animate-fade-in">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Fluxo do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-wrap justify-center items-center gap-6 text-lg">
              <div className="flex items-center bg-gradient-to-r from-blue-500/20 to-blue-600/20 px-6 py-3 rounded-2xl border border-blue-400/30 backdrop-blur-sm shadow-elegant-md hover:shadow-glow transition-all duration-300">
                <Tablet className="w-6 h-6 mr-3 text-blue-300" />
                <span className="font-semibold text-white">Gerar Senha</span>
              </div>
              <div className="text-3xl text-white/60">→</div>
              <div className="flex items-center bg-gradient-to-r from-green-500/20 to-green-600/20 px-6 py-3 rounded-2xl border border-green-400/30 backdrop-blur-sm shadow-elegant-md hover:shadow-glow transition-all duration-300">
                <Users className="w-6 h-6 mr-3 text-green-300" />
                <span className="font-semibold text-white">Triagem</span>
              </div>
              <div className="text-3xl text-white/60">→</div>
              <div className="flex items-center bg-gradient-to-r from-purple-500/20 to-purple-600/20 px-6 py-3 rounded-2xl border border-purple-400/30 backdrop-blur-sm shadow-elegant-md hover:shadow-glow transition-all duration-300">
                <Monitor className="w-6 h-6 mr-3 text-purple-300" />
                <span className="font-semibold text-white">TV Chamada</span>
              </div>
              <div className="text-3xl text-white/60">→</div>
              <div className="flex items-center bg-gradient-to-r from-red-500/20 to-red-600/20 px-6 py-3 rounded-2xl border border-red-400/30 backdrop-blur-sm shadow-elegant-md hover:shadow-glow transition-all duration-300">
                <Stethoscope className="w-6 h-6 mr-3 text-red-300" />
                <span className="font-semibold text-white">Consulta</span>
              </div>
              <div className="text-3xl text-white/60">→</div>
              <div className="flex items-center bg-gradient-to-r from-orange-500/20 to-orange-600/20 px-6 py-3 rounded-2xl border border-orange-400/30 backdrop-blur-sm shadow-elegant-md hover:shadow-glow transition-all duration-300">
                <Monitor className="w-6 h-6 mr-3 text-orange-300" />
                <span className="font-semibold text-white">Consultório</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

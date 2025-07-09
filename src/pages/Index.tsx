
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
    <div className="min-h-screen bg-gradient-subtle text-foreground font-inter animate-fade-in">
      {/* Modern Header with Glass Effect */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-border p-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6 animate-scale-in">
            <div className="p-4 bg-primary/10 rounded-2xl mr-6 shadow-glow animate-float">
              <Activity className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Sistema de Senhas Ambulatoriais
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            Gestão completa de filas e atendimento médico
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Estatísticas Elegantes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 animate-slide-up">
          <Card className="bg-card backdrop-blur-lg border shadow-elegant-lg hover:shadow-glow transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="text-4xl font-bold mb-2 text-foreground">{state.stats.totalToday}</div>
              <div className="text-sm text-muted-foreground font-medium">Total Hoje</div>
            </CardContent>
          </Card>

          <Card className="bg-card backdrop-blur-lg border shadow-elegant-lg hover:shadow-glow transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-success/10 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-success" />
              </div>
              <div className="text-4xl font-bold mb-2 text-foreground">{state.stats.normalQueue}</div>
              <div className="text-sm text-muted-foreground font-medium">Fila Normal</div>
            </CardContent>
          </Card>

          <Card className="bg-card backdrop-blur-lg border shadow-elegant-lg hover:shadow-glow transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-warning/10 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
              <div className="text-4xl font-bold mb-2 text-foreground">{state.stats.priorityQueue}</div>
              <div className="text-sm text-muted-foreground font-medium">Fila Prioritária</div>
            </CardContent>
          </Card>

          <Card className="bg-card backdrop-blur-lg border shadow-elegant-lg hover:shadow-glow transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-accent rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-8 h-8 text-accent-foreground" />
              </div>
              <div className="text-4xl font-bold mb-2 text-foreground">{state.stats.completedToday}</div>
              <div className="text-sm text-muted-foreground font-medium">Atendidos</div>
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
                className="bg-card backdrop-blur-lg border shadow-elegant-lg hover:shadow-glow hover:bg-surface-elevated transition-all duration-500 cursor-pointer group animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(module.path)}
              >
                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-6">
                    <div className="relative p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl group-hover:scale-110 group-hover:shadow-glow transition-all duration-500">
                      <Icon className="w-16 h-16 text-primary drop-shadow-lg" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold mb-3 text-foreground">
                    {module.title}
                  </CardTitle>
                  <p className="text-lg text-muted-foreground font-light leading-relaxed">{module.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {module.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        <div className="w-2 h-2 bg-primary/60 rounded-full mr-4 group-hover:shadow-glow transition-all duration-300"></div>
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-gradient-to-r from-primary/10 to-primary/5 text-foreground border border-border hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:border-primary/30 font-semibold py-4 text-lg rounded-xl shadow-elegant-md hover:shadow-glow transition-all duration-300 backdrop-blur-sm"
                  >
                    Acessar {module.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Fluxo Moderno */}
        <Card className="bg-card backdrop-blur-lg border shadow-elegant-xl animate-fade-in">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl font-bold text-foreground">
              Fluxo do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-wrap justify-center items-center gap-6 text-lg">
              <div className="flex items-center bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 backdrop-blur-sm shadow-elegant-md hover:shadow-glow transition-all duration-300">
                <Tablet className="w-6 h-6 mr-3 text-primary" />
                <span className="font-semibold text-foreground">Gerar Senha</span>
              </div>
              <div className="text-3xl text-muted-foreground">→</div>
              <div className="flex items-center bg-success/10 px-6 py-3 rounded-2xl border border-success/20 backdrop-blur-sm shadow-elegant-md hover:shadow-glow transition-all duration-300">
                <Users className="w-6 h-6 mr-3 text-success" />
                <span className="font-semibold text-foreground">Triagem</span>
              </div>
              <div className="text-3xl text-muted-foreground">→</div>
              <div className="flex items-center bg-accent px-6 py-3 rounded-2xl border border-accent/50 backdrop-blur-sm shadow-elegant-md hover:shadow-glow transition-all duration-300">
                <Monitor className="w-6 h-6 mr-3 text-accent-foreground" />
                <span className="font-semibold text-accent-foreground">TV Chamada</span>
              </div>
              <div className="text-3xl text-muted-foreground">→</div>
              <div className="flex items-center bg-warning/10 px-6 py-3 rounded-2xl border border-warning/20 backdrop-blur-sm shadow-elegant-md hover:shadow-glow transition-all duration-300">
                <Stethoscope className="w-6 h-6 mr-3 text-warning" />
                <span className="font-semibold text-foreground">Consulta</span>
              </div>
              <div className="text-3xl text-muted-foreground">→</div>
              <div className="flex items-center bg-secondary px-6 py-3 rounded-2xl border border-secondary/50 backdrop-blur-sm shadow-elegant-md hover:shadow-glow transition-all duration-300">
                <Monitor className="w-6 h-6 mr-3 text-secondary-foreground" />
                <span className="font-semibold text-secondary-foreground">Consultório</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

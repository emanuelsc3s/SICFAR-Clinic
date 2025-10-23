
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueue } from '@/context/QueueContext';
import { Patient } from '@/types/queue';
import { UserCheck, AlertTriangle, IdCard, Search, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { printThermalTicket } from '@/utils/thermalPrinter';
import { Progress } from '@/components/ui/progress';

const Tablet = () => {
  // Estado do Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [personType, setPersonType] = useState<'visitante' | 'colaborador' | null>(null);

  // Estados de identificação
  const [employeeBadge, setEmployeeBadge] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [loadingBadge, setLoadingBadge] = useState(false);
  const [badgeValid, setBadgeValid] = useState<boolean | null>(null);

  const { state, dispatch } = useQueue();

  // Mock simples de colaboradores - substituir por integração com Supabase
  const MOCK_COLABS: Record<string, string> = {
    '1001': 'Maria Souza',
    '1002': 'João Santos',
    '2001': 'Ana Lima',
  };

  const lookupEmployeeByBadge = async (badge: string): Promise<string | null> => {
    await new Promise((res) => setTimeout(res, 400));
    const name = MOCK_COLABS[badge.trim()];
    return name ?? null;
  };

  const handleSearchBadge = async () => {
    if (!employeeBadge.trim()) {
      setBadgeValid(false);
      toast({
        title: "Erro",
        description: "Por favor, insira o número da matrícula",
        variant: "destructive",
      });
      return;
    }
    setLoadingBadge(true);
    try {
      const name = await lookupEmployeeByBadge(employeeBadge);
      if (name) {
        setEmployeeName(name);
        setBadgeValid(true);
        toast({
          title: "Colaborador encontrado",
          description: `${name}`,
        });
      } else {
        setEmployeeName('');
        setBadgeValid(false);
        toast({
          title: "Matrícula não encontrada",
          description: `Verifique o número digitado e tente novamente`,
          variant: "destructive",
        });
      }
    } finally {
      setLoadingBadge(false);
    }
  };

  const generatePassword = async (queueType: 'normal' | 'priority') => {
    // Validações por tipo de pessoa
    if (personType === 'colaborador') {
      if (!employeeBadge.trim()) {
        toast({
          title: "Erro",
          description: "Por favor, informe a matrícula do colaborador",
          variant: "destructive",
        });
        return;
      }
      if (badgeValid !== true || !employeeName.trim()) {
        toast({
          title: "Validação pendente",
          description: "Valide a matrícula para continuar",
          variant: "destructive",
        });
        return;
      }
    } else if (personType === 'visitante') {
      if (!visitorName.trim()) {
        toast({
          title: "Erro",
          description: "Informe o nome do visitante",
          variant: "destructive",
        });
        return;
      }
    } else {
      toast({
        title: "Selecione o tipo de pessoa",
        description: "Escolha Visitante ou Colaborador",
        variant: "destructive",
      });
      setStep(1);
      return;
    }

    const prefix = queueType === 'normal' ? 'N' : 'P';
    const count = state.patients.filter((p) => p.type === queueType).length + 1;
    const number = `${prefix}${count.toString().padStart(3, '0')}`;

    const badgeToSave = personType === 'colaborador' ? employeeBadge.trim() : 'VISITANTE';
    const nameToSave = personType === 'colaborador' ? employeeName.trim() : visitorName.trim();

    const newPatient: Patient = {
      id: `${Date.now()}-${Math.random()}`,
      number,
      type: queueType,
      employeeBadge: badgeToSave,
      timestamp: new Date(),
      status: 'waiting',
      // Campos adicionais do wizard
      personType: personType || undefined,
      name: nameToSave || undefined,
    };

    dispatch({ type: 'ADD_PATIENT', payload: newPatient });

    toast({
      title: "Senha Gerada!",
      description: `Senha ${number} gerada com sucesso`,
    });

    // Impressão térmica via RawBT (Android) com ESC/POS
    try {
      await printThermalTicket({
        number,
        employeeBadge: badgeToSave,
        employeeName: nameToSave,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Erro ao imprimir senha:', err);
      toast({
        title: "Erro na Impressão",
        description: "Falha ao imprimir a senha. Verifique a impressora térmica.",
        variant: "destructive",
      });
    }

    // Reset do fluxo
    setEmployeeBadge('');
    setEmployeeName('');
    setVisitorName('');
    setBadgeValid(null);
    setPersonType(null);
    setStep(1);
  };

  return (
    <div className="h-screen bg-gradient-subtle p-1.5 font-inter animate-fade-in overflow-hidden">
      <div className="max-w-full mx-auto h-full flex flex-col">
        {/* Ultra Compact Header - Optimized for 800x460 */}
        <div className="text-center mb-1.5 animate-scale-in">
          <div className="flex items-center justify-center">
            <img
              src="/farmace.png"
              alt="Farmace"
              className="h-8 mr-2"
            />
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Ambulatório - Senha de Atendimento
            </h1>
          </div>
        </div>

        {/* Wizard: Indicador de Progresso */}
        <div className="px-3 mb-1">
          <div className="flex items-center justify-between text-xs text-foreground/80 mb-1">
            <span>Etapa {step} de 3</span>
            <span>{step === 1 ? 'Tipo de Pessoa' : step === 2 ? 'Identificação' : 'Tipo de Senha'}</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        {/* Etapas do Wizard */}
        <Card className="mb-1.5 shadow-elegant-lg border-0 bg-surface-elevated backdrop-blur-sm">
          <CardContent className="p-3">
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-20 text-base font-bold"
                  variant={personType === 'visitante' ? 'default' : 'secondary'}
                  onClick={() => {
                    setPersonType('visitante');
                    setEmployeeBadge('');
                    setEmployeeName('');
                    setVisitorName('');
                    setBadgeValid(null);
                    setStep(2);
                  }}
                >
                  <User className="w-5 h-5 mr-2" />
                  Visitante
                </Button>
                <Button
                  className="h-20 text-base font-bold"
                  variant={personType === 'colaborador' ? 'default' : 'secondary'}
                  onClick={() => {
                    setPersonType('colaborador');
                    setVisitorName('');
                    setStep(2);
                  }}
                >
                  <IdCard className="w-5 h-5 mr-2" />
                  Colaborador
                </Button>
              </div>
            )}

            {step === 2 && personType === 'colaborador' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="cracha" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5" />
                    Matrícula
                  </label>
                  <div className="flex gap-1.5">
                    <Input
                      type="number"
                      id="cracha"
                      name="cracha"
                      value={employeeBadge}
                      onChange={(e) => {
                        setEmployeeBadge(e.target.value);
                        setBadgeValid(null);
                        setEmployeeName('');
                      }}
                      placeholder="Digite a matrícula"
                      className="flex-1 h-9 text-sm"
                      required
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSearchBadge}
                      className="h-9 px-3"
                      disabled={loadingBadge}
                      title="Validar matrícula"
                    >
                      <Search className={`w-4 h-4 ${loadingBadge ? 'animate-pulse' : ''}`} />
                    </Button>
                  </div>
                  {badgeValid === true && (
                    <p className="text-xs text-green-600">Matrícula válida</p>
                  )}
                  {badgeValid === false && (
                    <p className="text-xs text-destructive">Matrícula inválida</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="nome-colab" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Nome do Colaborador
                  </label>
                  <Input
                    type="text"
                    id="nome-colab"
                    name="nome-colab"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Preenchido automaticamente"
                    className="h-9 text-sm"
                    disabled={badgeValid !== true}
                  />
                </div>

                <div className="col-span-full flex justify-between pt-2">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!(employeeBadge.trim() && badgeValid === true && employeeName.trim())}
                  >
                    Avançar
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && personType === 'visitante' && (
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="nome-visitante" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Nome do Visitante
                  </label>
                  <Input
                    type="text"
                    id="nome-visitante"
                    name="nome-visitante"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Digite o nome completo"
                    className="h-9 text-sm"
                    required
                  />
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!visitorName.trim()}>
                    Avançar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Etapa 3 - Tipo de Senha */}
        {step === 3 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-center gap-3 mb-1.5 flex-1 items-center px-4">
              {/* Normal Password Card */}
              <Card
                className="shadow-elegant-xl hover:shadow-glow border-0 bg-surface-elevated transition-all duration-300 cursor-pointer group flex flex-col w-[200px] hover:scale-105"
                onClick={() => generatePassword('normal')}
              >
                <CardContent className="p-3 text-center flex flex-col justify-between h-full">
                  <div className="mb-2">
                    <div className="p-2 bg-gradient-to-br from-success/10 to-success/5 rounded-lg w-fit mx-auto mb-2">
                      <UserCheck className="w-8 h-8 text-success mx-auto" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-1.5">NORMAL</h2>
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 border border-success/30 text-success bg-success/5">
                      Fila: {state.stats.normalQueue}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    className="w-full text-sm py-2.5 h-9 bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success text-white font-bold rounded-lg shadow-elegant-lg transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      generatePassword('normal');
                    }}
                  >
                    Gerar Senha
                  </Button>
                </CardContent>
              </Card>

              {/* Priority Password Card */}
              <Card
                className="shadow-elegant-xl hover:shadow-glow border-0 bg-surface-elevated transition-all duration-300 cursor-pointer group flex flex-col w-[200px] hover:scale-105"
                onClick={() => generatePassword('priority')}
              >
                <CardContent className="p-3 text-center flex flex-col justify-between h-full">
                  <div className="mb-2">
                    <div className="p-2 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-lg w-fit mx-auto mb-2">
                      <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-1.5">PRIORITÁRIA</h2>
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 border border-destructive/30 text-destructive bg-destructive/5">
                      Fila: {state.stats.priorityQueue}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    className="w-full text-sm py-2.5 h-9 bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-white font-bold rounded-lg shadow-elegant-lg transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      generatePassword('priority');
                    }}
                  >
                    Gerar Senha
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="px-4 pb-3 flex justify-start">
              <Button variant="secondary" onClick={() => setStep(2)}>Voltar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tablet;

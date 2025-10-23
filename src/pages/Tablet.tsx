
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueue } from '@/context/QueueContext';
import { Patient } from '@/types/queue';
import { UserCheck, AlertTriangle, IdCard, Search, User, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { printThermalTicket } from '@/utils/thermalPrinter';
import { cn } from '@/lib/utils';

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

  // Refs para controle de scroll quando teclado abre
  const employeeBadgeInputRef = useRef<HTMLInputElement>(null);
  const visitorNameInputRef = useRef<HTMLInputElement>(null);

  const { state, dispatch } = useQueue();

  // Mock simples de colaboradores - substituir por integração com Supabase
  const MOCK_COLABS: Record<string, string> = {
    '1001': 'Maria Souza',
    '1002': 'João Santos',
    '2001': 'Ana Lima',
  };

  // Função para scroll suave até o elemento quando o teclado abre
  // Especialmente útil para Android 7 onde o teclado cobre o campo
  // Usa múltiplas tentativas de scroll para garantir que funcione no primeiro toque
  const scrollToInput = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (!inputRef.current) return;

    // Primeira tentativa: scroll imediato usando requestAnimationFrame
    // Isso garante que o scroll aconteça após o próximo repaint do navegador
    requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    });

    // Segunda tentativa: após 350ms (tempo para o teclado começar a abrir no Android 7)
    setTimeout(() => {
      inputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 350);

    // Terceira tentativa: após 600ms (garantia para teclados mais lentos)
    setTimeout(() => {
      inputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 600);
  };

  // Auto-foco removido: deixamos o usuário decidir quando tocar no campo
  // O mecanismo de onFocus + scrollToInput nos inputs já resolve o problema de visibilidade do teclado

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
    <div className="h-screen bg-gradient-subtle p-1.5 lg:p-3 xl:p-6 font-inter animate-fade-in overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {/* Header - Ultra Compacto para 1000x500 */}
        <div className="text-center mb-1 lg:mb-3 xl:mb-6 animate-scale-in flex-shrink-0">
          <div className="flex flex-col items-center justify-center gap-2 lg:gap-4 xl:gap-6 pt-8 lg:pt-16 xl:pt-20">
            <img
              src="/farmace.png"
              alt="Farmace"
              className="h-12 lg:h-24 xl:h-32 drop-shadow-lg"
            />
            <h1 className="text-base lg:text-2xl xl:text-4xl font-bold text-primary leading-tight">
              Atendimento Ambulatorial
            </h1>
          </div>
        </div>

        {/* Wizard: Indicador de Progresso - Ultra Compacto para 1000x500 */}
        <div className="px-2 lg:px-6 pt-6 lg:pt-8 xl:pt-10 pb-1 lg:pb-3 xl:pb-4 mb-1 lg:mb-3 xl:mb-6 flex-shrink-0">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {/* Etapa 1 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 lg:w-14 lg:h-14 xl:w-20 xl:h-20 rounded-full flex items-center justify-center font-bold text-base lg:text-xl xl:text-2xl transition-all duration-200 mb-0.5 lg:mb-2",
                  step >= 1
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground border-2 border-muted"
                )}
              >
                {step > 1 ? <Check className="w-5 h-5 lg:w-7 lg:h-7 xl:w-10 xl:h-10" /> : "1"}
              </div>
              <span className="text-[10px] lg:text-sm xl:text-lg font-medium text-center text-foreground/80 leading-tight">
                Tipo de<br />Pessoa
              </span>
            </div>

            {/* Linha conectora 1-2 */}
            <div className="flex-1 h-0.5 lg:h-1 bg-muted mx-1.5 lg:mx-3 mb-4 lg:mb-8 xl:mb-12 rounded-full">
              <div
                className={cn(
                  "h-full transition-all duration-200 rounded-full",
                  step >= 2 ? "bg-primary" : "bg-muted"
                )}
                style={{ width: step >= 2 ? '100%' : '0%' }}
              />
            </div>

            {/* Etapa 2 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 lg:w-14 lg:h-14 xl:w-20 xl:h-20 rounded-full flex items-center justify-center font-bold text-base lg:text-xl xl:text-2xl transition-all duration-200 mb-0.5 lg:mb-2",
                  step >= 2
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground border-2 border-muted"
                )}
              >
                {step > 2 ? <Check className="w-5 h-5 lg:w-7 lg:h-7 xl:w-10 xl:h-10" /> : "2"}
              </div>
              <span className="text-[10px] lg:text-sm xl:text-lg font-medium text-center text-foreground/80 leading-tight">
                Identificação
              </span>
            </div>

            {/* Linha conectora 2-3 */}
            <div className="flex-1 h-0.5 lg:h-1 bg-muted mx-1.5 lg:mx-3 mb-4 lg:mb-8 xl:mb-12 rounded-full">
              <div
                className={cn(
                  "h-full transition-all duration-200 rounded-full",
                  step >= 3 ? "bg-primary" : "bg-muted"
                )}
                style={{ width: step >= 3 ? '100%' : '0%' }}
              />
            </div>

            {/* Etapa 3 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 lg:w-14 lg:h-14 xl:w-20 xl:h-20 rounded-full flex items-center justify-center font-bold text-base lg:text-xl xl:text-2xl transition-all duration-200 mb-0.5 lg:mb-2",
                  step >= 3
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground border-2 border-muted"
                )}
              >
                {step > 3 ? <Check className="w-5 h-5 lg:w-7 lg:h-7 xl:w-10 xl:h-10" /> : "3"}
              </div>
              <span className="text-[10px] lg:text-sm xl:text-lg font-medium text-center text-foreground/80 leading-tight">
                Tipo de<br />Senha
              </span>
            </div>
          </div>
        </div>

        {/* Etapas do Wizard */}
        <div className="flex-1 flex items-center justify-center px-2 lg:px-6 xl:px-8 overflow-y-auto min-h-0">
          {step === 1 && (
            <div className="w-[400px] space-y-2 lg:space-y-4 xl:space-y-8 py-1">
              {/* Botão Visitante - Ultra Compacto para 1000x500, mantém touch 44x44px */}
              <Card
                className="cursor-pointer transition-all duration-200 active:scale-95 bg-primary border-0 shadow-xl"
                onClick={() => {
                  setPersonType('visitante');
                  setEmployeeBadge('');
                  setEmployeeName('');
                  setVisitorName('');
                  setBadgeValid(null);
                  setStep(2);
                }}
              >
                <CardContent className="p-2.5 lg:p-6 xl:p-10 min-h-[60px] lg:min-h-[88px]">
                  <div className="flex items-center gap-2 lg:gap-4 xl:gap-8">
                    <div className="p-2 lg:p-4 xl:p-6 rounded-xl lg:rounded-2xl bg-white flex-shrink-0">
                      <User className="w-8 h-8 lg:w-12 lg:h-12 xl:w-16 xl:h-16 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg lg:text-2xl xl:text-4xl font-bold mb-0.5 lg:mb-2 text-white leading-tight">Visitante</h3>
                      <p className="text-xs lg:text-base xl:text-xl text-white/90 leading-tight">
                        Para pessoas sem matrícula de colaborador
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botão Colaborador - Ultra Compacto para 1000x500, mantém touch 44x44px */}
              <Card
                className="cursor-pointer transition-all duration-200 active:scale-95 bg-primary border-0 shadow-xl"
                onClick={() => {
                  setPersonType('colaborador');
                  setVisitorName('');
                  setStep(2);
                }}
              >
                <CardContent className="p-2.5 lg:p-6 xl:p-10 min-h-[60px] lg:min-h-[88px]">
                  <div className="flex items-center gap-2 lg:gap-4 xl:gap-8">
                    <div className="p-2 lg:p-4 xl:p-6 rounded-xl lg:rounded-2xl bg-white flex-shrink-0">
                      <IdCard className="w-8 h-8 lg:w-12 lg:h-12 xl:w-16 xl:h-16 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg lg:text-2xl xl:text-4xl font-bold mb-0.5 lg:mb-2 text-white leading-tight">Colaborador</h3>
                      <p className="text-xs lg:text-base xl:text-xl text-white/90 leading-tight">
                        Para funcionários com matrícula cadastrada
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Etapa 2 - Otimizada para Tablet */}
        {step !== 1 && (
          <Card className="mb-4 sm:mb-6 shadow-xl border-0 bg-surface-elevated max-w-3xl mx-auto w-full">
            <CardContent className="p-4 sm:p-6 md:p-8">

            {step === 2 && personType === 'colaborador' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2">
                <div className="space-y-1">
                  <label htmlFor="cracha" className="text-base sm:text-lg md:text-xl font-medium text-foreground flex items-center gap-2 sm:gap-3">
                    <IdCard className="w-5 h-5 sm:w-6 sm:h-6" />
                    Matrícula
                  </label>
                  <div className="flex gap-3">
                    <Input
                      ref={employeeBadgeInputRef}
                      type="number"
                      id="cracha"
                      name="cracha"
                      value={employeeBadge}
                      onChange={(e) => {
                        setEmployeeBadge(e.target.value);
                        setBadgeValid(null);
                        setEmployeeName('');
                      }}
                      onFocus={() => scrollToInput(employeeBadgeInputRef)}
                      placeholder="Digite a matrícula"
                      className="flex-1 h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl px-4 sm:px-5"
                      required
                    />
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      onClick={handleSearchBadge}
                      className="h-12 sm:h-14 md:h-16 px-4 sm:px-6 min-w-[48px]"
                      disabled={loadingBadge}
                      title="Validar matrícula"
                    >
                      <Search className={`w-6 h-6 sm:w-7 sm:h-7 ${loadingBadge ? 'animate-pulse' : ''}`} />
                    </Button>
                  </div>
                  {badgeValid === true && (
                    <p className="text-sm sm:text-base text-green-600 font-medium">✓ Matrícula válida</p>
                  )}
                  {badgeValid === false && (
                    <p className="text-sm sm:text-base text-destructive font-medium">✗ Matrícula inválida</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="nome-colab" className="text-base sm:text-lg md:text-xl font-medium text-foreground flex items-center gap-2 sm:gap-3">
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    Nome do Colaborador
                  </label>
                  <Input
                    type="text"
                    id="nome-colab"
                    name="nome-colab"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Preenchido automaticamente"
                    className="h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl px-4 sm:px-5"
                    disabled={badgeValid !== true}
                  />
                </div>

                <div className="col-span-full flex justify-between gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 text-base sm:text-lg md:text-xl min-w-[120px]"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!(employeeBadge.trim() && badgeValid === true && employeeName.trim())}
                    className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 text-base sm:text-lg md:text-xl min-w-[120px]"
                  >
                    Avançar
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && personType === 'visitante' && (
              <div className="grid grid-cols-1 gap-6 sm:gap-8">
                <div className="space-y-3 sm:space-y-4">
                  <label htmlFor="nome-visitante" className="text-base sm:text-lg md:text-xl font-medium text-foreground flex items-center gap-2 sm:gap-3">
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    Nome do Visitante
                  </label>
                  <Input
                    ref={visitorNameInputRef}
                    type="text"
                    id="nome-visitante"
                    name="nome-visitante"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    onFocus={() => scrollToInput(visitorNameInputRef)}
                    placeholder="Digite o nome completo"
                    className="h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl px-4 sm:px-5"
                    required
                  />
                </div>
                <div className="flex justify-between gap-4 pt-4 sm:pt-6">
                  <Button
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 text-base sm:text-lg md:text-xl min-w-[120px]"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!visitorName.trim()}
                    className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 text-base sm:text-lg md:text-xl min-w-[120px]"
                  >
                    Avançar
                  </Button>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        )}

        {/* Etapa 3 - Tipo de Senha - Otimizada para Tablet */}
        {step === 3 && (
          <div className="flex flex-col flex-1 px-4 sm:px-6 md:px-8">
            <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 md:gap-10 mb-6 sm:mb-8 flex-1 items-center max-w-4xl mx-auto w-full">
              {/* Normal Password Card - Otimizado para Touch */}
              <Card
                className="shadow-xl border-0 bg-surface-elevated transition-all duration-200 cursor-pointer active:scale-95 flex flex-col w-full sm:w-[280px] md:w-[320px] lg:w-[360px]"
                onClick={() => generatePassword('normal')}
              >
                <CardContent className="p-6 sm:p-8 md:p-10 text-center flex flex-col justify-between min-h-[200px] sm:min-h-[240px]">
                  <div className="mb-4 sm:mb-6">
                    <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-success/10 to-success/5 rounded-2xl w-fit mx-auto mb-4 sm:mb-5">
                      <UserCheck className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-success mx-auto" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">NORMAL</h2>
                    <Badge variant="outline" className="text-sm sm:text-base md:text-lg px-4 py-2 border-2 border-success/30 text-success bg-success/5">
                      Fila: {state.stats.normalQueue}
                    </Badge>
                  </div>
                  <Button
                    size="lg"
                    className="w-full text-base sm:text-lg md:text-xl py-4 sm:py-5 md:py-6 h-auto bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success text-white font-bold rounded-xl shadow-xl transition-all duration-200 min-h-[48px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      generatePassword('normal');
                    }}
                  >
                    Gerar Senha
                  </Button>
                </CardContent>
              </Card>

              {/* Priority Password Card - Otimizado para Touch */}
              <Card
                className="shadow-xl border-0 bg-surface-elevated transition-all duration-200 cursor-pointer active:scale-95 flex flex-col w-full sm:w-[280px] md:w-[320px] lg:w-[360px]"
                onClick={() => generatePassword('priority')}
              >
                <CardContent className="p-6 sm:p-8 md:p-10 text-center flex flex-col justify-between min-h-[200px] sm:min-h-[240px]">
                  <div className="mb-4 sm:mb-6">
                    <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-2xl w-fit mx-auto mb-4 sm:mb-5">
                      <AlertTriangle className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-destructive mx-auto" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">PRIORITÁRIA</h2>
                    <Badge variant="outline" className="text-sm sm:text-base md:text-lg px-4 py-2 border-2 border-destructive/30 text-destructive bg-destructive/5">
                      Fila: {state.stats.priorityQueue}
                    </Badge>
                  </div>
                  <Button
                    size="lg"
                    className="w-full text-base sm:text-lg md:text-xl py-4 sm:py-5 md:py-6 h-auto bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-white font-bold rounded-xl shadow-xl transition-all duration-200 min-h-[48px]"
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
            <div className="pb-6 sm:pb-8 flex justify-start max-w-4xl mx-auto w-full">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
                className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 text-base sm:text-lg md:text-xl min-w-[120px]"
              >
                Voltar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tablet;

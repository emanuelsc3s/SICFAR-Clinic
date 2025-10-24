
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useQueue } from '@/context/QueueContext';
import { Patient } from '@/types/queue';
import { UserCheck, AlertTriangle, IdCard, Search, User, Check } from 'lucide-react';
import { printThermalTicket, isAndroid, isRealAndroidDevice, TicketData } from '@/utils/thermalPrinter';
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
  const [showBadgeNotFoundDialog, setShowBadgeNotFoundDialog] = useState(false);

  // Estados para preview do ticket térmico (browser não-Android)
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  // Estado para controle do prompt de fullscreen
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [showAutoActivating, setShowAutoActivating] = useState(false);

  // Ajustes específicos para Android 7 com teclado virtual
  const [isLegacyAndroid, setIsLegacyAndroid] = useState(false);
  const [isLegacyKeyboardVisible, setIsLegacyKeyboardVisible] = useState(false);
  const [legacyKeyboardPadding, setLegacyKeyboardPadding] = useState(280);

  // Refs para controle de scroll quando teclado abre
  const layoutRootRef = useRef<HTMLDivElement>(null);
  const keyboardVisibilityTimeout = useRef<number | null>(null);
  const initialViewportHeight = useRef<number | null>(null);
  const employeeBadgeInputRef = useRef<HTMLInputElement>(null);
  const visitorNameInputRef = useRef<HTMLInputElement>(null);
  const stepTwoContainerRef = useRef<HTMLDivElement>(null);
  const gestureRecoveryRef = useRef<{ cleanup: () => void } | null>(null);

  const isLegacyKeyboardMode = isLegacyAndroid && isLegacyKeyboardVisible;

  const { state, dispatch } = useQueue();
  // -- Controle automático de tela cheia no Android/Opera Mini --
  // Tentamos restaurar a tela cheia quando a página volta ao foco após imprimir no RawBT
  const getFullscreenElement = () => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    };
    return document.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement || null;
  };

  const requestFullscreen = useCallback(async (el: HTMLElement): Promise<boolean> => {
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      mozRequestFullScreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    const maybeAwait = async (value: Promise<void> | void) => {
      if (value && typeof (value as Promise<void>).then === 'function') {
        await value;
      }
    };

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        return true;
      }
      if (anyEl.webkitRequestFullscreen) {
        await maybeAwait(anyEl.webkitRequestFullscreen());
        return true;
      }
      if (anyEl.mozRequestFullScreen) {
        await maybeAwait(anyEl.mozRequestFullScreen());
        return true;
      }
      if (anyEl.msRequestFullscreen) {
        await maybeAwait(anyEl.msRequestFullscreen());
        return true;
      }
    } catch (e) {
      console.warn('[SICFAR] Falha ao requisitar fullscreen:', e);
      throw e;
    }

    return false;
  }, []);

  const tryHideAddressBar = useCallback(() => {
    // Hack antigo para esconder a barra de endereço em navegadores antigos
    setTimeout(() => {
      try { window.scrollTo(0, 1); } catch (e) { void e; }
    }, 200);
  }, []);

  const ensureFullscreen = useCallback(
    async ({ allowPromptOnFail = false, reason = 'generic' }: { allowPromptOnFail?: boolean; reason?: string } = {}) => {
      if (!isAndroid()) return true;

      const already = !!getFullscreenElement();
      if (already) {
        setShowFullscreenPrompt(false);
        return true;
      }

      const candidates = [
        document.documentElement,
        document.body,
        document.getElementById('root'),
        document.getElementById('app'),
      ].filter((el): el is HTMLElement => !!el);

      let lastError: unknown = null;
      for (const candidate of candidates) {
        try {
          const invoked = await requestFullscreen(candidate);
          if (!invoked) {
            continue;
          }

          // Aguarda o navegador efetivar a transição para fullscreen
          await new Promise((resolve) => setTimeout(resolve, 30));

          if (getFullscreenElement()) {
            tryHideAddressBar();
            setShowFullscreenPrompt(false);
            console.log(`[SICFAR] Fullscreen ativado (motivo: ${reason})`);
            return true;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (lastError) {
        console.warn(`[SICFAR] Fullscreen bloqueado (${reason}):`, lastError);
      } else {
        console.warn(`[SICFAR] Fullscreen não pôde ser ativado (${reason})`);
      }

      tryHideAddressBar();

      if (allowPromptOnFail) {
        console.log('[SICFAR] Exibindo prompt de fullscreen após falha');
        setShowFullscreenPrompt(true);
      }

      return false;
    },
    [requestFullscreen, tryHideAddressBar]
  );

  const detachGestureRecovery = useCallback(() => {
    if (!gestureRecoveryRef.current) return;
    try {
      gestureRecoveryRef.current.cleanup();
    } finally {
      gestureRecoveryRef.current = null;
    }
  }, []);

  const scheduleGestureRecovery = useCallback(
    (
      reason: string,
      {
        maxAttempts = 2,
        showPromptOnFail = true,
      }: { maxAttempts?: number; showPromptOnFail?: boolean } = {},
      attempt = 0
    ) => {
      if (!isAndroid()) return;

      detachGestureRecovery();
      setShowFullscreenPrompt(false);

      const handler = async () => {
        detachGestureRecovery();
        const nextAttempt = attempt + 1;
        const success = await ensureFullscreen({ reason: `${reason}-gesture-${nextAttempt}` });
        if (success) {
          setShowAutoActivating(false);
          return;
        }

        if (nextAttempt >= maxAttempts) {
          if (showPromptOnFail) {
            setShowFullscreenPrompt(true);
          }
          return;
        }

        scheduleGestureRecovery(reason, { maxAttempts, showPromptOnFail }, nextAttempt);
      };

      const cleanup = () => {
        document.removeEventListener('pointerdown', handler, true);
        document.removeEventListener('touchstart', handler, true);
        document.removeEventListener('keydown', handler, true);
      };

      gestureRecoveryRef.current = { cleanup };
      document.addEventListener('pointerdown', handler, true);
      document.addEventListener('touchstart', handler, true);
      document.addEventListener('keydown', handler, true);
    },
    [detachGestureRecovery, ensureFullscreen]
  );

  const handleUserGestureForFullscreen = useCallback(() => {
    if (!isAndroid()) return;
    detachGestureRecovery();
    if (!getFullscreenElement()) {
      void ensureFullscreen({ reason: 'gesture-capture' });
    }
  }, [detachGestureRecovery, ensureFullscreen]);

  // Handler para ativar fullscreen via prompt inicial
  const handleActivateFullscreen = useCallback(async () => {
    console.log('[SICFAR] Usuário tocou para ativar fullscreen');
    detachGestureRecovery();
    const success = await ensureFullscreen({ reason: 'prompt-tap' });
    if (!success) {
      console.warn('[SICFAR] Ainda sem fullscreen após gesto do usuário');
    }
  }, [detachGestureRecovery, ensureFullscreen]);

  // Effect principal: gerencia fullscreen e exibe prompt se necessário
  useEffect(() => {
    if (!isAndroid()) return;

    const key = 'SICFAR_FS_RESTORE';

    const scheduledTimeouts: number[] = [];

    const clearScheduledTimeouts = () => {
      scheduledTimeouts.forEach((id) => window.clearTimeout(id));
      scheduledTimeouts.length = 0;
    };

    const runFullscreenRecovery = (
      reason: string,
      {
        allowPromptAtEnd = true,
        showIndicator = false,
        delays = [120, 600, 1400, 2600],
        preferGestureFallback = false,
      }: {
        allowPromptAtEnd?: boolean;
        showIndicator?: boolean;
        delays?: number[];
        preferGestureFallback?: boolean;
      } = {}
    ) => {
      clearScheduledTimeouts();
      detachGestureRecovery();

      if (showIndicator) {
        setShowAutoActivating(true);
      }

      // Oculta o prompt enquanto novas tentativas automáticas são realizadas
      setShowFullscreenPrompt(false);

      let resolved = false;

      delays.forEach((delay, index) => {
        const timeoutId = window.setTimeout(async () => {
          if (resolved) return;

          const isLastAttempt = index === delays.length - 1;
          const success = await ensureFullscreen({
            allowPromptOnFail: allowPromptAtEnd && isLastAttempt && !preferGestureFallback,
            reason: `${reason}-tentativa-${index + 1}`,
          });

          if (success) {
            resolved = true;
            setShowAutoActivating(false);
            clearScheduledTimeouts();
            detachGestureRecovery();
            return;
          }

          if (isLastAttempt) {
            setShowAutoActivating(false);
            if (allowPromptAtEnd) {
              if (preferGestureFallback) {
                scheduleGestureRecovery(reason, { maxAttempts: 2, showPromptOnFail: true });
              } else {
                setShowFullscreenPrompt(true);
              }
            }
          }
        }, delay);

        scheduledTimeouts.push(timeoutId);
      });
    };

    const onRestore = () => {
      if (document.visibilityState !== 'visible') return;

      const alreadyInFullscreen = !!getFullscreenElement();
      const shouldRestore = (() => {
        try { return sessionStorage.getItem(key); } catch (e) { return null; }
      })();

      if (shouldRestore === '1') {
        console.log('[SICFAR] Retornou do RawBT, revalidando fullscreen...');
        try { sessionStorage.removeItem(key); } catch (e) { void e; }

        if (!alreadyInFullscreen) {
          runFullscreenRecovery('rawbt-retorno', {
            allowPromptAtEnd: true,
            showIndicator: true,
            preferGestureFallback: true,
          });
        } else {
          console.log('[SICFAR] Fullscreen mantido após retorno do RawBT');
        }
        return;
      }

      if (!alreadyInFullscreen) {
        console.log('[SICFAR] Página voltou ao foco sem fullscreen, tentando novamente...');
        runFullscreenRecovery('retorno-foreground', { allowPromptAtEnd: true });
      }
    };

    document.addEventListener('visibilitychange', onRestore);
    window.addEventListener('focus', onRestore);
    window.addEventListener('pageshow', onRestore);

    if (!getFullscreenElement()) {
      const initialTimeout = window.setTimeout(() => {
        if (!getFullscreenElement()) {
          console.log('[SICFAR] Tentativa inicial de fullscreen no carregamento');
          runFullscreenRecovery('montagem-inicial', { allowPromptAtEnd: true });
        }
      }, 300);
      scheduledTimeouts.push(initialTimeout);
    }

    return () => {
      clearScheduledTimeouts();
      document.removeEventListener('visibilitychange', onRestore);
      window.removeEventListener('focus', onRestore);
      window.removeEventListener('pageshow', onRestore);
    };
  }, [ensureFullscreen, scheduleGestureRecovery, detachGestureRecovery]);

  useEffect(() => {
    if (!showFullscreenPrompt || !isAndroid()) return;
    const vibrate = navigator.vibrate?.bind(navigator);
    try {
      vibrate?.([120, 80, 180]);
    } catch (err) {
      console.debug('[SICFAR] Vibração indisponível:', err);
    }
  }, [showFullscreenPrompt]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isAndroid()) return;

    const handleFullscreenChange = () => {
      if (getFullscreenElement()) {
        setShowFullscreenPrompt(false);
        setShowAutoActivating(false);
      }
      detachGestureRecovery();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange as EventListener);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange as EventListener);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange as EventListener);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange as EventListener);
    };
  }, [detachGestureRecovery]);


  // Lista hardcoded de colaboradores para testes
  // Formato: matrícula (6 dígitos) + nome completo (ignorando data no final)
  const MOCK_COLABS: Record<string, string> = {
    '000406': 'CICERO ROGÉRIO DOS SANTOS MAIA',
    '002085': 'LUIS FERNANDO DOS SANTOS SOUZA',
    '002913': 'GERVALDO DOS SANTOS DA SILVA JUNIOR',
    '002866': 'ALISON JOSE DE MELO SILVA',
    '000648': 'CICERO EMANUEL DA SILVA',
    '002846': 'PAULO VINICIUS FERREIRA FRANCELINO',
    '003899': 'SAMUEL YAN GOMES MARQUES',
    '004230': 'ANDERSON FILIPE LEITE ROCHA',
    '002082': 'ANDERSON ROBERTO SANTOS BEZERRA',
    '004211': 'RENATO BARBOSA DA SILVA',
    '003166': 'ALISSON NAVDE DOS SANTOS',
    '004151': 'LUIZ HENRIQUE TEIXEIRA SAMPAIO',
    '003694': 'ALEX SILVA SANTOS',
    '004029': 'ROGERIO CARLOS LOIOLA JUNIOR',
    '004231': 'BRUNO SOARES DE LIMA',
    '002349': 'THIAGO PAIXAO SARAIVA',
    '003194': 'EDUARDO LUIZ ARAGÃO BARIVIERA MOREIRA',
    '004511': 'PAULO GUILHERME DE SOUSA DA SILVA',
  };

  // Função para scroll suave até o elemento quando o teclado abre
  // Especialmente útil para Android 7 onde o teclado cobre o campo
  // Usa múltiplas tentativas de scroll para garantir que funcione no primeiro toque
  const scrollToInput = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (!inputRef.current) return;

    const ensureVisible = () => {
      inputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      if (isLegacyAndroid && typeof window !== 'undefined') {
        const target = inputRef.current;
        const rect = target.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        if (!initialViewportHeight.current || viewportHeight > initialViewportHeight.current) {
          initialViewportHeight.current = viewportHeight;
        }

        const baselineHeight = initialViewportHeight.current ?? viewportHeight;
        const keyboardHeight = Math.max(0, baselineHeight - viewportHeight);
        const fallbackSafeSpace = rect.height + 240;
        const computedSafeSpace = keyboardHeight > 0
          ? keyboardHeight + rect.height + 120
          : fallbackSafeSpace;
        const keyboardSafeSpace = Math.max(fallbackSafeSpace, computedSafeSpace);
        const bottomGap = viewportHeight - rect.bottom;

        const desiredPadding = Math.min(
          520,
          Math.max(280, Math.round(keyboardHeight + rect.height + 160))
        );
        setLegacyKeyboardPadding((prev) => (prev === desiredPadding ? prev : desiredPadding));

        if (bottomGap < keyboardSafeSpace) {
          const offset = keyboardSafeSpace - bottomGap;
          const container = layoutRootRef.current;

          if (container) {
            container.scrollTop += offset;
          } else {
            window.scrollBy(0, offset);
          }
        }
      }
    };

    // Primeira tentativa: scroll imediato usando requestAnimationFrame
    requestAnimationFrame(ensureVisible);

    // Segunda tentativa: após 350ms (tempo para o teclado começar a abrir no Android 7)
    setTimeout(ensureVisible, 350);

    // Terceira tentativa: após 600ms (garantia para teclados mais lentos)
    setTimeout(ensureVisible, 600);
  };

  // Auto-foco removido: deixamos o usuário decidir quando tocar no campo
  // O handler de foco chama scrollToInput para manter o campo visível mesmo com o teclado aberto

  const ensureLegacyStepVisible = useCallback(() => {
    if (!isLegacyAndroid || step !== 2) return;
    if (typeof window === 'undefined') return;

    const root = layoutRootRef.current;
    const target = stepTwoContainerRef.current;
    if (!root || !target) return;

    const align = () => {
      const rootRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offset = targetRect.top - rootRect.top;
      const desiredTop = Math.max(root.scrollTop + offset - 12, 0);

      root.scrollTo({
        top: desiredTop,
        behavior: 'smooth',
      });
    };

    const tryAlign = (delay: number) => {
      window.setTimeout(() => {
        window.requestAnimationFrame(align);
      }, delay);
    };

    tryAlign(0);
    tryAlign(240);
    tryAlign(520);
  }, [isLegacyAndroid, step]);

  const handleInputFocus = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (keyboardVisibilityTimeout.current) {
      window.clearTimeout(keyboardVisibilityTimeout.current);
      keyboardVisibilityTimeout.current = null;
    }

    if (isLegacyAndroid) {
      setIsLegacyKeyboardVisible(true);
      const root = layoutRootRef.current;
      if (root) {
        window.requestAnimationFrame(() => {
          root.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }

    scrollToInput(inputRef);

    if (isLegacyAndroid) {
      ensureLegacyStepVisible();
    }
  };

  const handleInputBlur = () => {
    if (!isLegacyAndroid) return;

    if (keyboardVisibilityTimeout.current) {
      window.clearTimeout(keyboardVisibilityTimeout.current);
    }

    keyboardVisibilityTimeout.current = window.setTimeout(() => {
      setIsLegacyKeyboardVisible(false);
    }, 200);
  };

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (!isAndroid()) return;
    if (/Android 7/i.test(navigator.userAgent)) {
      setIsLegacyAndroid(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateBaseline = () => {
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      if (!initialViewportHeight.current || viewport > initialViewportHeight.current) {
        initialViewportHeight.current = viewport;
      }
    };

    updateBaseline();
    window.addEventListener('resize', updateBaseline);

    return () => {
      window.removeEventListener('resize', updateBaseline);
    };
  }, []);

  useEffect(() => {
    if (!isLegacyAndroid && isLegacyKeyboardVisible) {
      setIsLegacyKeyboardVisible(false);
    }
  }, [isLegacyAndroid, isLegacyKeyboardVisible]);

  useEffect(() => {
    if (!isLegacyAndroid) return;
    if (step !== 2) {
      setIsLegacyKeyboardVisible(false);
    }
  }, [isLegacyAndroid, step]);

  useEffect(() => {
    if (!isLegacyKeyboardVisible && legacyKeyboardPadding !== 280) {
      setLegacyKeyboardPadding(280);
    }
  }, [isLegacyKeyboardVisible, legacyKeyboardPadding]);

  useEffect(() => {
    if (isLegacyKeyboardMode) {
      ensureLegacyStepVisible();
    }
  }, [isLegacyKeyboardMode, ensureLegacyStepVisible]);

  useEffect(() => {
    return () => {
      if (keyboardVisibilityTimeout.current) {
        window.clearTimeout(keyboardVisibilityTimeout.current);
      }
      detachGestureRecovery();
    };
  }, [detachGestureRecovery]);

  const lookupEmployeeByBadge = async (badge: string): Promise<string | null> => {
    await new Promise((res) => setTimeout(res, 400));
    const name = MOCK_COLABS[badge.trim()];
    return name ?? null;
  };

  const handleSearchBadge = async () => {
    employeeBadgeInputRef.current?.blur();

    if (!employeeBadge.trim()) {
      setBadgeValid(false);
      return;
    }
    setLoadingBadge(true);
    try {
      // Normaliza a matrícula: adiciona zeros à esquerda para completar 6 dígitos
      // Exemplos: "406" → "000406", "2085" → "002085", "4230" → "004230"
      const normalizedBadge = employeeBadge.trim().padStart(6, '0');

      const name = await lookupEmployeeByBadge(normalizedBadge);
      if (name) {
        setEmployeeName(name);
        setBadgeValid(true);
        // Matrícula encontrada: não exibir notificação (removido toast de sucesso)
      } else {
        setEmployeeName('');
        setBadgeValid(false);
        // Matrícula não encontrada: exibir AlertDialog
        setShowBadgeNotFoundDialog(true);
      }
    } finally {
      setLoadingBadge(false);
    }
  };

  const generatePassword = async (queueType: 'normal' | 'priority') => {
    // Validações por tipo de pessoa
    if (personType === 'colaborador') {
      if (!employeeBadge.trim()) {
        return;
      }
      if (badgeValid !== true || !employeeName.trim()) {
        return;
      }
    } else if (personType === 'visitante') {
      if (!visitorName.trim()) {
        return;
      }
    } else {
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

    // Prepara dados do ticket
    const ticket: TicketData = {
      number,
      employeeBadge: badgeToSave,
      employeeName: nameToSave,
      timestamp: new Date(),
    };

    // Detecção de plataforma: Android imprime via RawBT, outros browsers exibem preview
    const isRealDevice = isRealAndroidDevice();
    console.log('[SICFAR] isAndroid():', isAndroid(), '| isRealDevice:', isRealDevice, '| hostname:', window.location.hostname);
    if (isRealDevice) {
      // Impressão térmica via RawBT (Android) com ESC/POS
      try {
        // Marca que devemos restaurar fullscreen ao retornar do RawBT
        // O listener de visibilitychange detectará o retorno e exibirá o prompt se necessário
        try { sessionStorage.setItem('SICFAR_FS_RESTORE', '1'); } catch (e) { void e; }
        console.log('[SICFAR] Iniciando impressão via RawBT...');
        await printThermalTicket(ticket);
      } catch (err) {
        console.error('Erro ao imprimir senha:', err);
      }

      // Reset do fluxo para Android (após impressão)
      setEmployeeBadge('');
      setEmployeeName('');
      setVisitorName('');
      setBadgeValid(null);
      setPersonType(null);
      setStep(1);
    } else {
      // Browser não-Android: exibe modal com preview do ticket térmico
      // O reset será feito quando o modal for fechado
      setTicketData(ticket);
      setShowTicketPreview(true);
    }
  };

  return (
    <div
      ref={layoutRootRef}
      className={cn(
        "min-h-screen bg-gradient-subtle p-1.5 lg:p-3 xl:p-6 font-inter animate-fade-in",
        isLegacyKeyboardMode
          ? "overflow-y-auto"
          : "h-screen overflow-hidden"
      )}
      style={
        isLegacyKeyboardMode
          ? { paddingBottom: legacyKeyboardPadding, scrollPaddingBottom: legacyKeyboardPadding }
          : undefined
      }
      onClickCapture={handleUserGestureForFullscreen}
      onTouchStartCapture={handleUserGestureForFullscreen}
      onPointerDownCapture={handleUserGestureForFullscreen}
    >
      <div
        className={cn(
          "max-w-6xl mx-auto flex flex-col",
          isLegacyKeyboardMode ? "min-h-full" : "h-full"
        )}
      >
        {/* Header - Ultra Compacto para 1000x500 */}
        <div
          className={cn(
            "text-center mb-1 lg:mb-3 xl:mb-6 animate-scale-in flex-shrink-0",
            isLegacyKeyboardMode && "hidden"
          )}
        >
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
        <div
          className={cn(
            "px-2 lg:px-6 pt-6 lg:pt-8 xl:pt-10 pb-1 lg:pb-3 xl:pb-4 mb-1 lg:mb-3 xl:mb-6 flex-shrink-0",
            isLegacyKeyboardMode && "hidden"
          )}
        >
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
        <div
          className={cn(
            "flex-1 flex items-center justify-center px-2 lg:px-6 xl:px-8 min-h-0",
            isLegacyKeyboardMode && "hidden"
          )}
        >
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

          {/* Etapa 3 - Tipo de Senha - Ajustada para caber sem scroll */}
          {step === 3 && (
            <div className="flex flex-col w-full px-2 sm:px-4 md:px-6 lg:px-8 py-1 sm:py-2">
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-2 sm:mb-3 md:mb-4 lg:mb-6 items-center max-w-4xl mx-auto w-full">
                {/* Normal Password Card - Otimizado para Touch */}
                <Card
                  className="shadow-xl border-0 bg-surface-elevated transition-all duration-200 cursor-pointer active:scale-95 flex flex-col w-full sm:w-[240px] md:w-[280px] lg:w-[320px]"
                  onClick={() => generatePassword('normal')}
                >
                  <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6 text-center flex flex-col justify-between min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[200px]">
                    <div className="mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                      <div className="p-1.5 sm:p-2 md:p-3 lg:p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-xl sm:rounded-2xl w-fit mx-auto mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                        <UserCheck className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-12 lg:h-12 text-success mx-auto" />
                      </div>
                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground">NORMAL</h2>
                    </div>
                    <Button
                      size="lg"
                      className="w-full text-xs sm:text-sm md:text-base lg:text-lg py-1.5 sm:py-2 md:py-2.5 lg:py-3 h-auto bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success text-white font-bold rounded-lg sm:rounded-xl shadow-xl transition-all duration-200 min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
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
                  className="shadow-xl border-0 bg-surface-elevated transition-all duration-200 cursor-pointer active:scale-95 flex flex-col w-full sm:w-[240px] md:w-[280px] lg:w-[320px]"
                  onClick={() => generatePassword('priority')}
                >
                  <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6 text-center flex flex-col justify-between min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[200px]">
                    <div className="mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                      <div className="p-1.5 sm:p-2 md:p-3 lg:p-4 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl sm:rounded-2xl w-fit mx-auto mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                        <AlertTriangle className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-12 lg:h-12 text-destructive mx-auto" />
                      </div>
                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground">PRIORITÁRIA</h2>
                    </div>
                    <Button
                      size="lg"
                      className="w-full text-xs sm:text-sm md:text-base lg:text-lg py-1.5 sm:py-2 md:py-2.5 lg:py-3 h-auto bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-white font-bold rounded-lg sm:rounded-xl shadow-xl transition-all duration-200 min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
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
              <div className="pb-1 sm:pb-2 md:pb-3 lg:pb-4 flex justify-start max-w-4xl mx-auto w-full">
                <Button
                  variant="secondary"
                  onClick={() => setStep(2)}
                  className="h-10 sm:h-11 md:h-12 lg:h-14 px-4 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base lg:text-lg min-w-[100px] sm:min-w-[120px]"
                >
                  Voltar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Etapa 2 - Otimizada para Tablet e Android 7 */}
        {step !== 1 && (
          <Card
            ref={stepTwoContainerRef}
            className={cn(
              "mb-4 sm:mb-6 shadow-xl border-0 bg-surface-elevated max-w-3xl mx-auto w-full",
              isLegacyKeyboardMode && "mt-0"
            )}
          >
            {step === 2 && personType === 'colaborador' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2 p-4 sm:p-6">
                <div className="space-y-1">
                  <label htmlFor="cracha" className="text-base sm:text-lg md:text-xl font-medium text-foreground flex items-center gap-2 sm:gap-3">
                    <IdCard className="w-5 h-5 sm:w-6 sm:h-6" />
                    Matrícula
                  </label>
                  <div className="flex gap-3">
                    <Input
                      ref={employeeBadgeInputRef}
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="cracha"
                      name="cracha"
                      value={employeeBadge}
                      onChange={(e) => {
                        setEmployeeBadge(e.target.value);
                        setBadgeValid(null);
                        setEmployeeName('');
                      }}
                      onFocus={() => handleInputFocus(employeeBadgeInputRef)}
                      onBlur={handleInputBlur}
                      placeholder="Digite a matrícula"
                      className="flex-1 h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl px-4 sm:px-5"
                      required
                      autoComplete="off"
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
              <div className="grid grid-cols-1 gap-6 sm:gap-8 p-4 sm:p-6">
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
                    onFocus={() => handleInputFocus(visitorNameInputRef)}
                    onBlur={handleInputBlur}
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
          </Card>
        )}
      </div>

      {/* AlertDialog para matrícula não encontrada */}
      <AlertDialog open={showBadgeNotFoundDialog} onOpenChange={setShowBadgeNotFoundDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-destructive">
              Matrícula não encontrada
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              A matrícula <strong>{employeeBadge}</strong> não foi localizada no sistema.
              <br />
              <br />
              Por favor, verifique o número digitado e tente novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowBadgeNotFoundDialog(false)}
              className="h-12 px-6 text-base"
            >
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para preview do ticket térmico (apenas browser não-Android) */}
      <Dialog open={showTicketPreview} onOpenChange={setShowTicketPreview}>
        <DialogContent className="max-w-xs p-0 bg-transparent border-none shadow-2xl">
          <div className="bg-[#F5F1E8] rounded-lg shadow-2xl overflow-hidden">
            {/* Simulação de papel térmico - Otimizado para 1000x500 */}
            <div className="p-4 space-y-2 font-mono text-black">
              {/* Logo */}
              <div className="flex justify-center mb-2">
                <img
                  src="/farmace.png"
                  alt="Farmace"
                  className="h-10 object-contain"
                />
              </div>

              {/* Cabeçalho */}
              <div className="text-center">
                <h2 className="text-xs font-bold leading-tight">
                  ATENDIMENTO AMBULATORIAL
                </h2>
              </div>

              {/* Separador */}
              <div className="border-t-2 border-dashed border-black/20 my-2"></div>

              {/* Número da senha (destaque) */}
              <div className="text-center py-3">
                <div className="text-3xl font-bold tracking-wider">
                  {ticketData?.number}
                </div>
              </div>

              {/* Separador */}
              <div className="border-t-2 border-dashed border-black/20 my-2"></div>

              {/* Dados do paciente */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold">Matrícula:</span>
                  <span>{ticketData?.employeeBadge}</span>
                </div>
                {ticketData?.employeeName && (
                  <div className="flex flex-col">
                    <span className="font-semibold">Paciente:</span>
                    <span className="text-[10px] break-words leading-tight">{ticketData.employeeName}</span>
                  </div>
                )}
              </div>

              {/* Separador */}
              <div className="border-t-2 border-dashed border-black/20 my-2"></div>

              {/* Data/Hora */}
              <div className="text-center text-[10px]">
                {ticketData?.timestamp && new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(ticketData.timestamp)}
              </div>

              {/* Rodapé */}
              <div className="text-center text-[10px] pt-2 pb-1">
                <div className="font-semibold">SICFAR Clinic - FARMACE</div>
              </div>
            </div>

            {/* Botão Fechar */}
            <div className="p-2 bg-[#F5F1E8] border-t border-black/10">
              <Button
                onClick={async () => {
                  setShowTicketPreview(false);
                  setTicketData(null);

                  // Reset do fluxo após fechar o preview
                  setEmployeeBadge('');
                  setEmployeeName('');
                  setVisitorName('');
                  setBadgeValid(null);
                  setPersonType(null);
                  setStep(1);

                  // Tenta reativar fullscreen após fechar o preview
                  // Se falhar, exibe o prompt para o usuário
                  console.log('[SICFAR] Verificando fullscreen após fechar preview');
                  setTimeout(async () => {
                    if (!getFullscreenElement()) {
                      const success = await ensureFullscreen({ reason: 'fechar-preview' });
                      if (!success) {
                        console.log('[SICFAR] Fullscreen bloqueado após fechar preview, exibindo prompt');
                        setShowFullscreenPrompt(true);
                      }
                    }
                  }, 100);
                }}
                className="w-full h-8 text-xs"
                size="sm"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Indicador de Ativação Automática - informa que o sistema está tentando restaurar fullscreen */}
      {showAutoActivating && isAndroid() && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 animate-fade-in pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-10 h-10 text-primary animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">
                Tentando restaurar o modo tela cheia
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Isso pode levar alguns segundos após retornar da impressão.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prompt de Fullscreen - Aparece apenas em Android quando fullscreen não está ativo */}
      {showFullscreenPrompt && isAndroid() && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 animate-fade-in"
          role="button"
          tabIndex={0}
          aria-label="Ativar modo tela cheia"
          onClick={handleActivateFullscreen}
          onTouchStart={handleActivateFullscreen}
          onPointerDown={handleActivateFullscreen}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              void handleActivateFullscreen();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">
                Ativar modo tela cheia
              </h2>
              <p className="text-base text-gray-600 leading-relaxed">
                O Chrome exige um toque manual após voltar da impressão. Toque em qualquer lugar para continuar a experiência.
              </p>
            </div>

            <div className="pt-2 flex flex-col items-center gap-4">
              <Button
                size="lg"
                className="px-10 text-lg"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleActivateFullscreen();
                }}
              >
                Ativar agora
              </Button>
              <div className="inline-flex items-center gap-2 text-primary font-semibold animate-pulse">
                <span className="text-lg">👆</span>
                <span>Qualquer toque ativa o modo tela cheia</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tablet;

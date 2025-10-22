// ========================================
// SISTEMA DE EMISSÃO DE SENHAS
// ========================================

/**
 * Classe principal para gerenciar o sistema de senhas
 */
class SistemaSenhas {
    constructor() {
        // Elementos do DOM
        this.form = document.getElementById('senhaForm');
        this.inputCracha = document.getElementById('cracha');
        this.inputNome = document.getElementById('nome');
        this.btnNormal = document.getElementById('btnNormal');
        this.btnPrioritario = document.getElementById('btnPrioritario');
        this.btnLocalizarCracha = document.getElementById('btnLocalizarCracha');
        this.senhaDisplay = document.getElementById('senhaGerada');
        this.senhaNumero = document.getElementById('senhaNumero');
        this.senhaTipo = document.getElementById('senhaTipo');
        this.historicoLista = document.getElementById('historicoLista');
        this.btnLimparHistorico = document.getElementById('btnLimparHistorico');

        // Mensagens de erro
        this.crachaError = document.getElementById('crachaError');
        this.nomeError = document.getElementById('nomeError');

        // Contadores de senhas
        this.contadorNormal = this.getContador('normal');
        this.contadorPrioritario = this.getContador('prioritario');

        // Histórico de senhas
        this.historico = this.getHistorico();

        // Inicializar aplicação
        this.init();
    }

    /**
     * Inicializa a aplicação e configura event listeners
     */
    init() {
        // Inicializar ícones do Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Event listeners para botões
        this.btnNormal.addEventListener('click', () => this.emitirSenha('normal'));
        this.btnPrioritario.addEventListener('click', () => this.emitirSenha('prioritario'));
        this.btnLimparHistorico.addEventListener('click', () => this.limparHistorico());
        this.btnLocalizarCracha.addEventListener('click', () => this.localizarCracha());

        // Event listeners para validação em tempo real
        this.inputCracha.addEventListener('input', () => this.limparErro(this.inputCracha, this.crachaError));
        this.inputNome.addEventListener('input', () => this.limparErro(this.inputNome, this.nomeError));

        // Validação ao perder o foco
        this.inputCracha.addEventListener('blur', () => this.validarCampo(this.inputCracha, this.crachaError, 'Número do crachá'));
        this.inputNome.addEventListener('blur', () => this.validarCampo(this.inputNome, this.nomeError, 'Nome'));

        // Prevenir submit do formulário
        this.form.addEventListener('submit', (e) => e.preventDefault());

        // Renderizar histórico inicial
        this.renderizarHistorico();
    }

    /**
     * Obtém o contador do localStorage
     * @param {string} tipo - Tipo da senha (normal ou prioritario)
     * @returns {number} - Contador atual
     */
    getContador(tipo) {
        const contador = localStorage.getItem(`contador_${tipo}`);
        return contador ? parseInt(contador, 10) : 0;
    }

    /**
     * Salva o contador no localStorage
     * @param {string} tipo - Tipo da senha
     * @param {number} valor - Novo valor do contador
     */
    setContador(tipo, valor) {
        localStorage.setItem(`contador_${tipo}`, valor.toString());
    }

    /**
     * Obtém o histórico do localStorage
     * @returns {Array} - Array com histórico de senhas
     */
    getHistorico() {
        const historico = localStorage.getItem('historico_senhas');
        return historico ? JSON.parse(historico) : [];
    }

    /**
     * Salva o histórico no localStorage
     * @param {Array} historico - Array com histórico de senhas
     */
    setHistorico(historico) {
        localStorage.setItem('historico_senhas', JSON.stringify(historico));
    }

    /**
     * Valida um campo do formulário
     * @param {HTMLElement} input - Elemento de input
     * @param {HTMLElement} errorElement - Elemento para exibir erro
     * @param {string} nomeCampo - Nome do campo para mensagem de erro
     * @returns {boolean} - true se válido, false se inválido
     */
    validarCampo(input, errorElement, nomeCampo) {
        const valor = input.value.trim();

        if (!valor) {
            this.mostrarErro(input, errorElement, `${nomeCampo} é obrigatório`);
            return false;
        }

        // Validação específica para crachá (deve ser número positivo)
        if (input === this.inputCracha) {
            const numero = parseInt(valor, 10);
            if (numero <= 0 || isNaN(numero)) {
                this.mostrarErro(input, errorElement, 'Digite um número válido');
                return false;
            }
        }

        // Validação específica para nome (mínimo 3 caracteres)
        if (input === this.inputNome && valor.length < 3) {
            this.mostrarErro(input, errorElement, 'Nome deve ter no mínimo 3 caracteres');
            return false;
        }

        this.limparErro(input, errorElement);
        return true;
    }

    /**
     * Exibe mensagem de erro
     * @param {HTMLElement} input - Elemento de input
     * @param {HTMLElement} errorElement - Elemento para exibir erro
     * @param {string} mensagem - Mensagem de erro
     */
    mostrarErro(input, errorElement, mensagem) {
        input.classList.add('error');
        input.classList.add('shake');
        errorElement.textContent = `⚠ ${mensagem}`;

        // Remove animação de shake após completar
        setTimeout(() => {
            input.classList.remove('shake');
        }, 500);
    }

    /**
     * Limpa mensagem de erro
     * @param {HTMLElement} input - Elemento de input
     * @param {HTMLElement} errorElement - Elemento para exibir erro
     */
    limparErro(input, errorElement) {
        input.classList.remove('error');
        errorElement.textContent = '';
    }

    /**
     * Valida todos os campos do formulário
     * @returns {boolean} - true se todos os campos são válidos
     */
    validarFormulario() {
        const crachaValido = this.validarCampo(this.inputCracha, this.crachaError, 'Número do crachá');
        const nomeValido = this.validarCampo(this.inputNome, this.nomeError, 'Nome');

        return crachaValido && nomeValido;
    }

    /**
     * Gera o número da senha formatado
     * @param {string} tipo - Tipo da senha (normal ou prioritario)
     * @returns {string} - Número da senha formatado (ex: N001, P001)
     */
    gerarNumeroSenha(tipo) {
        // Incrementa o contador
        if (tipo === 'normal') {
            this.contadorNormal++;
            this.setContador('normal', this.contadorNormal);
            // Formata com prefixo N e 3 dígitos
            return `N${this.contadorNormal.toString().padStart(3, '0')}`;
        } else {
            this.contadorPrioritario++;
            this.setContador('prioritario', this.contadorPrioritario);
            // Formata com prefixo P e 3 dígitos
            return `P${this.contadorPrioritario.toString().padStart(3, '0')}`;
        }
    }

    /**
     * Emite uma nova senha
     * @param {string} tipo - Tipo da senha (normal ou prioritario)
     */
    emitirSenha(tipo) {
        // Validar formulário
        if (!this.validarFormulario()) {
            return;
        }

        // Desabilitar botões durante processamento
        this.btnNormal.disabled = true;
        this.btnPrioritario.disabled = true;

        // Coletar dados
        const cracha = this.inputCracha.value.trim();
        const nome = this.inputNome.value.trim();

        // Gerar número da senha
        const numeroSenha = this.gerarNumeroSenha(tipo);

        // Criar objeto de senha
        const senha = {
            numero: numeroSenha,
            tipo: tipo,
            tipoTexto: tipo === 'normal' ? 'Atendimento Normal' : 'Atendimento Prioritário',
            cracha: cracha,
            nome: nome,
            timestamp: new Date().toISOString(),
            dataHora: this.formatarDataHora(new Date())
        };

        // Adicionar ao histórico
        this.historico.unshift(senha);

        // Limitar histórico a 50 senhas
        if (this.historico.length > 50) {
            this.historico = this.historico.slice(0, 50);
        }

        // Salvar no localStorage
        this.setHistorico(this.historico);

        // Exibir senha gerada
        this.exibirSenhaGerada(senha);

        // Adicionar ao histórico visual
        this.renderizarHistorico();

        // Limpar formulário
        setTimeout(() => {
            this.limparFormulario();
            this.btnNormal.disabled = false;
            this.btnPrioritario.disabled = false;
        }, 1000);
    }

    /**
     * Exibe a senha gerada na tela
     * @param {Object} senha - Objeto com dados da senha
     */
    exibirSenhaGerada(senha) {
        // Atualizar conteúdo
        this.senhaNumero.textContent = senha.numero;
        this.senhaTipo.textContent = senha.tipoTexto;

        // Remover classe hidden e forçar reflow para animação
        this.senhaDisplay.classList.remove('hidden');
        void this.senhaDisplay.offsetWidth;

        // Scroll suave até a senha gerada
        setTimeout(() => {
            this.senhaDisplay.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 100);
    }

    /**
     * Formata data e hora
     * @param {Date} data - Objeto Date
     * @returns {string} - Data formatada (ex: "21/10/2025 às 14:30")
     */
    formatarDataHora(data) {
        const dia = data.getDate().toString().padStart(2, '0');
        const mes = (data.getMonth() + 1).toString().padStart(2, '0');
        const ano = data.getFullYear();
        const horas = data.getHours().toString().padStart(2, '0');
        const minutos = data.getMinutes().toString().padStart(2, '0');

        return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
    }

    /**
     * Formata tempo relativo (ex: "há 2 minutos")
     * @param {string} timestamp - Timestamp ISO
     * @returns {string} - Tempo relativo formatado
     */
    formatarTempoRelativo(timestamp) {
        const agora = new Date();
        const data = new Date(timestamp);
        const diferencaMs = agora - data;
        const diferencaMinutos = Math.floor(diferencaMs / 60000);

        if (diferencaMinutos < 1) return 'Agora mesmo';
        if (diferencaMinutos === 1) return 'Há 1 minuto';
        if (diferencaMinutos < 60) return `Há ${diferencaMinutos} minutos`;

        const diferencaHoras = Math.floor(diferencaMinutos / 60);
        if (diferencaHoras === 1) return 'Há 1 hora';
        if (diferencaHoras < 24) return `Há ${diferencaHoras} horas`;

        const diferencaDias = Math.floor(diferencaHoras / 24);
        if (diferencaDias === 1) return 'Há 1 dia';
        return `Há ${diferencaDias} dias`;
    }

    /**
     * Renderiza o histórico de senhas
     */
    renderizarHistorico() {
        // Limpar lista
        this.historicoLista.innerHTML = '';

        // Verificar se há histórico
        if (this.historico.length === 0) {
            this.historicoLista.innerHTML = '<p class="empty-state">Nenhuma senha emitida ainda</p>';
            return;
        }

        // Renderizar cada item
        this.historico.forEach((senha, index) => {
            const item = this.criarItemHistorico(senha);
            this.historicoLista.appendChild(item);
        });

        // Reinicializar ícones do Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Cria um elemento de item do histórico
     * @param {Object} senha - Objeto com dados da senha
     * @returns {HTMLElement} - Elemento div do item
     */
    criarItemHistorico(senha) {
        const item = document.createElement('div');
        item.className = 'history-item';

        const isPrioritario = senha.tipo === 'prioritario';
        const iconClass = isPrioritario ? 'priority' : '';

        item.innerHTML = `
            <div class="history-item-icon ${iconClass}">
                ${senha.numero.charAt(0)}
            </div>
            <div class="history-item-content">
                <div class="history-item-senha">${senha.numero}</div>
                <div class="history-item-info">${senha.nome} • Crachá ${senha.cracha}</div>
            </div>
            <div class="history-item-time">${this.formatarTempoRelativo(senha.timestamp)}</div>
        `;

        return item;
    }

    /**
     * Limpa o formulário
     */
    limparFormulario() {
        this.inputCracha.value = '';
        this.inputNome.value = '';
        this.limparErro(this.inputCracha, this.crachaError);
        this.limparErro(this.inputNome, this.nomeError);
        this.inputCracha.focus();
    }

    /**
     * Limpa o histórico de senhas
     */
    limparHistorico() {
        // Confirmação
        if (!confirm('Deseja realmente limpar todo o histórico de senhas?')) {
            return;
        }

        // Limpar dados
        this.historico = [];
        this.setHistorico([]);

        // Renderizar lista vazia
        this.renderizarHistorico();

        // Feedback visual
        this.historicoLista.classList.add('shake');
        setTimeout(() => {
            this.historicoLista.classList.remove('shake');
        }, 500);
    }

    /**
     * Localiza um crachá e preenche automaticamente os dados do funcionário
     */
    localizarCracha() {
        // Obter número do crachá
        const numeroCracha = this.inputCracha.value.trim();

        // Validar se o campo foi preenchido
        if (!numeroCracha) {
            this.mostrarErro(this.inputCracha, this.crachaError, 'Digite o número do crachá para localizar');
            this.inputCracha.focus();
            return;
        }

        // Validar se é um número válido
        const numero = parseInt(numeroCracha, 10);
        if (numero <= 0 || isNaN(numero)) {
            this.mostrarErro(this.inputCracha, this.crachaError, 'Digite um número válido');
            this.inputCracha.focus();
            return;
        }

        // Desabilitar botão durante a busca
        this.btnLocalizarCracha.disabled = true;

        // Simular busca no banco de dados (aqui você pode integrar com uma API real)
        // Por enquanto, vamos usar dados mockados
        setTimeout(() => {
            const funcionarioEncontrado = this.buscarFuncionarioPorCracha(numero);

            if (funcionarioEncontrado) {
                // Preencher campo nome
                this.inputNome.value = funcionarioEncontrado.nome;
                this.limparErro(this.inputNome, this.nomeError);

                // Feedback visual de sucesso
                this.inputNome.classList.add('success-highlight');
                setTimeout(() => {
                    this.inputNome.classList.remove('success-highlight');
                }, 1000);

                // Focar no próximo campo (ou no botão)
                this.btnNormal.focus();

                // Mostrar notificação de sucesso (opcional)
                console.log('✅ Funcionário encontrado:', funcionarioEncontrado.nome);
            } else {
                // Funcionário não encontrado
                this.mostrarErro(this.inputCracha, this.crachaError, 'Crachá não encontrado no sistema');
                this.inputNome.value = '';
            }

            // Reabilitar botão
            this.btnLocalizarCracha.disabled = false;
        }, 500); // Simular delay de busca
    }

    /**
     * Busca funcionário por número do crachá (mock)
     * Em produção, isso deve ser substituído por uma chamada real à API/banco de dados
     * @param {number} numeroCracha - Número do crachá
     * @returns {Object|null} - Dados do funcionário ou null se não encontrado
     */
    buscarFuncionarioPorCracha(numeroCracha) {
        // Base de dados mockada (exemplo)
        const funcionarios = [
            { cracha: 1001, nome: 'João Silva' },
            { cracha: 1002, nome: 'Maria Santos' },
            { cracha: 1003, nome: 'Pedro Oliveira' },
            { cracha: 1004, nome: 'Ana Costa' },
            { cracha: 1005, nome: 'Carlos Souza' },
            { cracha: 1006, nome: 'Juliana Ferreira' },
            { cracha: 1007, nome: 'Roberto Alves' },
            { cracha: 1008, nome: 'Fernanda Lima' },
            { cracha: 1009, nome: 'Ricardo Pereira' },
            { cracha: 1010, nome: 'Patricia Rodrigues' }
        ];

        // Buscar funcionário pelo número do crachá
        return funcionarios.find(func => func.cracha === numeroCracha) || null;
    }
}

// ========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ========================================

/**
 * Inicializa a aplicação quando o DOM estiver pronto
 */
document.addEventListener('DOMContentLoaded', () => {
    // Criar instância do sistema de senhas
    const sistema = new SistemaSenhas();

    // Atualizar tempos relativos a cada minuto
    setInterval(() => {
        sistema.renderizarHistorico();
    }, 60000); // 60 segundos

    // Log de inicialização (pode ser removido em produção)
    console.log('✅ Sistema de Senhas inicializado com sucesso!');
    console.log('📊 Senhas Normais emitidas:', sistema.contadorNormal);
    console.log('⭐ Senhas Prioritárias emitidas:', sistema.contadorPrioritario);
    console.log('📝 Histórico:', sistema.historico.length, 'senhas');
});

/**
 * Tratamento de erros globais
 */
window.addEventListener('error', (event) => {
    console.error('❌ Erro capturado:', event.error);
});

/**
 * Prevenir perda de dados ao sair da página (opcional)
 */
window.addEventListener('beforeunload', (event) => {
    // Pode ser usado para avisar sobre dados não salvos
    // event.preventDefault();
    // event.returnValue = '';
});

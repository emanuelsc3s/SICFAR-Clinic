# Documentação Completa: Sistema de Impressão Térmica de Senhas

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Protocolo ESC/POS](#protocolo-escpos)
4. [Referência de Comandos](#referência-de-comandos)
5. [Funções do Sistema](#funções-do-sistema)
6. [Customização de Impressão](#customização-de-impressão)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Troubleshooting](#troubleshooting)
9. [Referências Técnicas](#referências-técnicas)

---

## Visão Geral

O SICFAR-Clinic implementa impressão térmica de senhas diretamente do navegador Android usando o protocolo **ESC/POS** (Epson Standard Code for Point of Sale). O sistema não depende de drivers ou apps desktop, funcionando através de Intents do Android.

### Inspiração e Base

A implementação foi **baseada e inspirada** no projeto [Github react-thermal-printer](https://github.com/seokju-na/react-thermal-printer), que forneceu referências valiosas sobre:
- Geração de bytes ESC/POS em ambiente JavaScript/TypeScript
- Estrutura de comandos para impressoras térmicas
- Abordagens para formatação de tickets

A solução do SICFAR-Clinic foi adaptada para funcionar especificamente com Android via Intents (RawBT), eliminando dependências de bibliotecas externas e otimizando para a impressora **Mini PDV M10 da Elgin**.

### Características Principais

- ✅ **100% Browser-based**: Sem necessidade de software desktop
- ✅ **ESC/POS Nativo**: Gera bytes binários diretamente em JavaScript
- ✅ **Android-First**: Usa Intents para comunicação com app RawBT
- ✅ **Zero Dependências**: Não usa bibliotecas Node.js ou npm para ESC/POS
- ✅ **Compatível**: Funciona com impressoras térmicas padrão (58mm e 80mm)

### Hardware Testado

- **Impressora**: Mini PDV M10 Elgin (ou similar com ESC/POS)
- **App Android**: RawBT Printer (https://rawbt.ru/start.html)
- **Conexão**: Bluetooth ou USB

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (Android)                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  src/utils/thermalPrinter.tsx                      │    │
│  │                                                     │    │
│  │  1. Recebe TicketData                              │    │
│  │  2. Gera bytes ESC/POS (buildTicketESCPOSEncoded)  │    │
│  │  3. Converte para Base64                           │    │
│  │  4. Cria Intent URL                                │    │
│  │  5. Dispara window.location.href                   │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│              Intent: rawbt://base64,...                      │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    APP RAWBT PRINTER                         │
│                                                              │
│  1. Recebe Intent com dados Base64                          │
│  2. Decodifica Base64 → bytes ESC/POS                       │
│  3. Envia bytes via Bluetooth/USB                           │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              IMPRESSORA TÉRMICA (ESC/POS)                    │
│                                                              │
│  Interpreta comandos e imprime                              │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```typescript
TicketData (objeto JS)
    ↓
buildTicketESCPOSEncoded()
    ↓
Uint8Array (bytes ESC/POS)
    ↓
uint8ToBase64()
    ↓
String Base64
    ↓
Intent URL
    ↓
RawBT → Impressora
```

---

## Protocolo ESC/POS

### O que é ESC/POS?

ESC/POS (Epson Standard Code for Point of Sale) é um protocolo de controle de impressoras térmicas criado pela Epson. É o padrão da indústria para impressoras de PDV, recibos e tickets.

### Estrutura de Comandos

Comandos ESC/POS são sequências de bytes que controlam formatação, corte, gaveta, etc.

#### Formato Geral:
```
[PREFIXO] [COMANDO] [PARÂMETROS...]
```

#### Prefixos Principais:

| Byte | Nome | Hex | Decimal | Uso |
|------|------|-----|---------|-----|
| ESC  | Escape | 0x1B | 27 | Comandos de texto, alinhamento |
| GS   | Group Separator | 0x1D | 29 | Tamanho, gráficos, código de barras |
| LF   | Line Feed | 0x0A | 10 | Quebra de linha |

### Como Funciona em Bytes

Exemplo: Imprimir "OLÁ" em negrito centralizado

```
1. ESC @ → Inicializar
   Bytes: [0x1B, 0x40]

2. ESC a 1 → Centralizar
   Bytes: [0x1B, 0x61, 0x01]

3. ESC E 1 → Ativar negrito
   Bytes: [0x1B, 0x45, 0x01]

4. Texto "OLÁ"
   Bytes: [0x4F, 0x4C, 0xC3, 0x81] (UTF-8)

5. LF → Quebrar linha
   Bytes: [0x0A]

6. ESC E 0 → Desativar negrito
   Bytes: [0x1B, 0x45, 0x00]
```

**Resultado final em bytes:**
```
[0x1B, 0x40, 0x1B, 0x61, 0x01, 0x1B, 0x45, 0x01,
 0x4F, 0x4C, 0xC3, 0x81, 0x0A, 0x1B, 0x45, 0x00]
```

---

## Referência de Comandos

### 1. Inicialização

#### ESC @ - Inicializar Impressora
```typescript
function init(): Uint8Array {
  return new Uint8Array([0x1B, 0x40]);
}
```
**Efeito**: Reseta todas as configurações para padrão (alinhamento, tamanho, negrito, etc.)

---

### 2. Alinhamento de Texto

#### ESC a n - Definir Alinhamento
```typescript
function alignLeft(): Uint8Array {
  return new Uint8Array([0x1B, 0x61, 0x00]);
}

function alignCenter(): Uint8Array {
  return new Uint8Array([0x1B, 0x61, 0x01]);
}

function alignRight(): Uint8Array {
  return new Uint8Array([0x1B, 0x61, 0x02]);
}
```

| Parâmetro n | Alinhamento |
|-------------|-------------|
| 0x00 | Esquerda |
| 0x01 | Centro |
| 0x02 | Direita |

---

### 3. Estilo de Texto

#### ESC E n - Negrito
```typescript
function bold(on: boolean): Uint8Array {
  return new Uint8Array([0x1B, 0x45, on ? 0x01 : 0x00]);
}
```

#### ESC - n - Sublinhado
```typescript
function underline(mode: number): Uint8Array {
  return new Uint8Array([0x1B, 0x2D, mode]);
}
// mode: 0=off, 1=1dot, 2=2dots
```

#### ESC { n - Invertido (branco no preto)
```typescript
function inverse(on: boolean): Uint8Array {
  return new Uint8Array([0x1B, 0x7B, on ? 0x01 : 0x00]);
}
```

---

### 4. Tamanho de Texto (IMPORTANTE!)

#### GS ! n - Tamanho de Caractere

Este é o comando mais usado para controlar tamanho. O byte `n` é dividido em duas partes:

```
Formato: 0xWH

W (high nibble) = Largura (0-7)
H (low nibble)  = Altura (0-7)

Onde:
  0 = 1x (normal)
  1 = 2x
  2 = 3x
  3 = 4x
  4 = 5x
  5 = 6x
  6 = 7x
  7 = 8x
```

**Tabela de Valores Comuns:**

| Byte (Hex) | Largura | Altura | Função |
|------------|---------|--------|---------|
| 0x00 | 1x | 1x | Normal |
| 0x10 | 2x | 1x | Largo |
| 0x01 | 1x | 2x | Alto |
| 0x11 | 2x | 2x | Duplo (mais comum) |
| 0x22 | 3x | 3x | Triplo |
| 0x33 | 4x | 4x | Quádruplo |
| 0x44 | 5x | 5x | 5x |
| 0x55 | 6x | 6x | 6x |
| 0x77 | 8x | 8x | Máximo |
| 0x20 | 3x | 1x | Largo triplo |
| 0x02 | 1x | 3x | Alto triplo |

**Implementação em TypeScript:**

```typescript
// Tamanhos pré-definidos
function sizeNormal(): Uint8Array {
  return new Uint8Array([0x1D, 0x21, 0x00]); // 1x1
}

function sizeDoubleWH(): Uint8Array {
  return new Uint8Array([0x1D, 0x21, 0x11]); // 2x2
}

function sizeTriple(): Uint8Array {
  return new Uint8Array([0x1D, 0x21, 0x22]); // 3x3
}

function sizeQuadruple(): Uint8Array {
  return new Uint8Array([0x1D, 0x21, 0x33]); // 4x4
}

// Tamanho customizado
function sizeCustom(width: number, height: number): Uint8Array {
  // width e height: 0-7 (onde 0=1x, 1=2x, 2=3x, etc.)
  const w = Math.min(7, Math.max(0, width));
  const h = Math.min(7, Math.max(0, height));
  const byte = (w << 4) | h;
  return new Uint8Array([0x1D, 0x21, byte]);
}

// Exemplos de uso:
// sizeCustom(0, 0) → 0x00 = 1x1
// sizeCustom(1, 1) → 0x11 = 2x2
// sizeCustom(2, 1) → 0x21 = 3x largura, 2x altura
// sizeCustom(7, 7) → 0x77 = 8x8 (máximo)
```

---

### 5. Fontes

#### ESC M n - Selecionar Fonte

```typescript
function fontA(): Uint8Array {
  return new Uint8Array([0x1B, 0x4D, 0x00]);
}

function fontB(): Uint8Array {
  return new Uint8Array([0x1B, 0x4D, 0x01]);
}

function fontC(): Uint8Array {
  return new Uint8Array([0x1B, 0x4D, 0x02]);
}
```

| Fonte | Largura (chars/linha) | Uso Típico |
|-------|----------------------|------------|
| A (padrão) | ~42 chars (80mm) | Texto normal |
| B (compacta) | ~56 chars (80mm) | Mais texto, menor |
| C (especial) | Varia | Nem todas impressoras suportam |

---

### 6. Espaçamento de Linhas

#### ESC 3 n - Definir Espaçamento (1/203 polegadas)

```typescript
function lineSpacing(dots: number): Uint8Array {
  // dots: 0-255 (altura em pontos)
  return new Uint8Array([0x1B, 0x33, dots]);
}
```

**Valores Comuns:**

| Dots | Milímetros | Uso |
|------|------------|-----|
| 20 | ~2.5mm | Compacto |
| 30 | ~3.8mm | Normal (padrão) |
| 40 | ~5.0mm | Espaçado |
| 60 | ~7.6mm | Muito espaçado |

**Fórmula de Conversão:**
```
mm = dots × 25.4 / 203
dots = mm × 203 / 25.4
```

#### ESC 2 - Resetar Espaçamento Padrão (1/6")

```typescript
function lineSpacingDefault(): Uint8Array {
  return new Uint8Array([0x1B, 0x32]);
}
```

---

### 7. Quebra de Linha

#### LF (Line Feed)

```typescript
function lf(lines: number = 1): Uint8Array {
  return new Uint8Array(Array(lines).fill(0x0A));
}
```

**Uso:**
- `lf()` ou `lf(1)` → 1 linha
- `lf(2)` → 2 linhas
- `lf(10)` → 10 linhas (espaçamento vertical)

---

### 8. Corte de Papel

#### GS V n - Cortar Papel

```typescript
function cutFull(): Uint8Array {
  return new Uint8Array([0x1D, 0x56, 0x00]); // Corte total
}

function cutPartial(): Uint8Array {
  return new Uint8Array([0x1D, 0x56, 0x01]); // Corte parcial (deixa aba)
}

function cut(): Uint8Array {
  return cutPartial(); // Mais comum
}
```

**⚠️ Importante:**
- Nem todas impressoras suportam corte
- Se não houver guilhotina, comando é ignorado
- Adicionar `lf(5)` antes do corte para garantir que papel saia

---

### 9. Código de Barras (Bonus)

#### GS k m d1...dk NUL - Imprimir Código de Barras

```typescript
function printBarcode(data: string, type: number = 73): Uint8Array {
  // type 73 = CODE128
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  return new Uint8Array([
    0x1D, 0x6B, type,  // GS k m
    ...dataBytes,
    0x00               // NUL terminator
  ]);
}

// Configurar altura do código de barras
function barcodeHeight(dots: number): Uint8Array {
  return new Uint8Array([0x1D, 0x68, dots]); // 1-255
}

// Configurar largura
function barcodeWidth(width: number): Uint8Array {
  return new Uint8Array([0x1D, 0x77, width]); // 2-6
}
```

**Tipos de Código de Barras:**

| Tipo | Valor m | Formato |
|------|---------|---------|
| UPC-A | 65 | 0x41 |
| UPC-E | 66 | 0x42 |
| EAN13 | 67 | 0x43 |
| EAN8 | 68 | 0x44 |
| CODE39 | 69 | 0x45 |
| ITF | 70 | 0x46 |
| CODABAR | 71 | 0x47 |
| CODE93 | 72 | 0x48 |
| CODE128 | 73 | 0x49 |

---

### 10. QR Code (Bonus)

#### GS ( k - Imprimir QR Code

```typescript
function printQRCode(data: string, size: number = 6): Uint8Array {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const len = dataBytes.length + 3;

  const chunks: Uint8Array[] = [];

  // Modelo QR (Model 2)
  chunks.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));

  // Tamanho do módulo (1-16)
  chunks.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]));

  // Nível de correção de erro (L=0x30, M=0x31, Q=0x32, H=0x33)
  chunks.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]));

  // Armazenar dados
  const pL = len & 0xFF;
  const pH = (len >> 8) & 0xFF;
  chunks.push(new Uint8Array([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...dataBytes]));

  // Imprimir
  chunks.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]));

  return concatBytes(chunks);
}
```

---

## Funções do Sistema

### Interface TicketData

```typescript
export interface TicketData {
  number: string;           // Número da senha (ex: "N001", "P005")
  employeeBadge: string;    // Matrícula do colaborador
  employeeName?: string;    // Nome do paciente (opcional)
  timestamp: Date;          // Data/hora da geração
}
```

---

### Função Principal: buildTicketESCPOSEncoded()

**Localização:** `src/utils/thermalPrinter.tsx:57`

```typescript
export async function buildTicketESCPOSEncoded(
  data: TicketData
): Promise<Uint8Array>
```

#### Estrutura Atual do Ticket

```
┌─────────────────────────────────────┐
│                                     │  ← 3 linhas em branco (lf(3))
│   ATENDIMENTO AMBULATORIAL          │  ← 2x2, negrito
│                                     │
│          N001                       │  ← Senha: 2x2, negrito
│                                     │
│   Matrícula: 12345                  │  ← Normal
│   Paciente: João da Silva           │  ← Normal
│   01/01/25, 14:30                   │  ← Normal
│                                     │
│                                     │  ← 60 linhas em branco (lf(60))
│                                     │
└─────────────────────────────────────┘
        ✂️ (corte)
```

#### Fluxo de Construção (Linha por Linha)

```typescript
// Linha 64: Inicializar
chunks.push(init());

// Linha 65: Centralizar tudo
chunks.push(alignCenter());

// Linhas 67-68: Espaçamento superior
chunks.push(lf(3));

// Linhas 70-76: Cabeçalho
chunks.push(sizeDoubleWH());           // Tamanho 2x2
chunks.push(bold(true));               // Ativar negrito
chunks.push(text('ATENDIMENTO AMBULATORIAL'));
chunks.push(bold(false));              // Desativar negrito
chunks.push(sizeNormal());             // Voltar tamanho normal
chunks.push(lf());                     // Quebrar linha

// Linhas 78-84: Número da senha (DESTAQUE)
chunks.push(sizeDoubleWH());           // Tamanho 2x2
chunks.push(bold(true));               // Ativar negrito
chunks.push(text(data.number));        // Ex: "N001"
chunks.push(bold(false));              // Desativar negrito
chunks.push(sizeNormal());             // Voltar tamanho normal
chunks.push(lf());                     // Quebrar linha

// Linhas 86-94: Dados do paciente
chunks.push(text(`Matrícula: ${data.employeeBadge}`));
chunks.push(lf());
if (data.employeeName) {
  chunks.push(text(`Paciente: ${data.employeeName}`));
  chunks.push(lf());
}
chunks.push(text(dateTime));           // Data/hora formatada
chunks.push(lf(2));                    // 2 linhas em branco

// Linhas 96-97: Espaçamento inferior (dobrar altura)
chunks.push(lf(60));

// Linhas 99-100: Corte
chunks.push(cut());
```

---

### Funções Auxiliares

#### concatBytes()
**Localização:** `src/utils/thermalPrinter.tsx:30`

```typescript
function concatBytes(chunks: Uint8Array[]): Uint8Array
```

Concatena múltiplos `Uint8Array` em um único array.

**Exemplo:**
```typescript
const a = new Uint8Array([1, 2]);
const b = new Uint8Array([3, 4]);
const result = concatBytes([a, b]);
// result = Uint8Array([1, 2, 3, 4])
```

---

#### text()
**Localização:** `src/utils/thermalPrinter.tsx:41`

```typescript
function text(str: string): Uint8Array
```

Converte string UTF-8 para bytes usando `TextEncoder`.

**Exemplo:**
```typescript
text("Olá")
// Retorna: Uint8Array([0x4F, 0x6C, 0xC3, 0xA1])
```

---

#### uint8ToBase64()
**Localização:** `src/utils/thermalPrinter.tsx:19`

```typescript
function uint8ToBase64(u8: Uint8Array): string
```

Converte `Uint8Array` para string Base64 em chunks de 32KB.

**Por que chunks?**
- Evita erro `Maximum call stack size exceeded` com arrays grandes
- Suporta tickets com muitos dados (códigos de barras, logos, etc.)

---

#### isAndroid()
**Localização:** `src/utils/thermalPrinter.tsx:15`

```typescript
function isAndroid(): boolean
```

Detecta se está rodando em Android via `navigator.userAgent`.

---

### Função de Impressão: printThermalTicket()

**Localização:** `src/utils/thermalPrinter.tsx:105`

```typescript
export async function printThermalTicket(data: TicketData): Promise<void>
```

#### Fluxo Completo:

```typescript
// 1. Verificar se é Android
if (!isAndroid()) {
  throw new Error('Impressão térmica via Intent disponível apenas no Android.');
}

// 2. Gerar bytes ESC/POS
const bytes = await buildTicketESCPOSEncoded(data);

// 3. Converter para Base64
const b64 = uint8ToBase64(bytes);

// 4. Criar Intent URL
const intentUrl = `intent:base64,${b64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

// 5. Disparar Intent
window.location.href = intentUrl;
```

#### Formato do Intent

```
intent:base64,<BASE64_DATA>#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;
```

**Partes:**
- `intent:` - Protocolo do Android
- `base64,<DATA>` - Dados codificados em Base64
- `#Intent;` - Início de extras
- `scheme=rawbt` - Esquema do app RawBT
- `package=ru.a402d.rawbtprinter` - Package name do RawBT
- `end;` - Fim do Intent

---

## Customização de Impressão

### Exemplo 1: Aumentar Tamanho da Senha (3x)

**Antes (linha 78-84):**
```typescript
chunks.push(sizeDoubleWH());
chunks.push(bold(true));
chunks.push(text(data.number));
chunks.push(bold(false));
chunks.push(sizeNormal());
chunks.push(lf());
```

**Depois (3x largura e altura):**
```typescript
// Adicionar função nova:
function sizeTriple(): Uint8Array {
  return new Uint8Array([GS, 0x21, 0x22]); // 3x3
}

// Usar na senha:
chunks.push(sizeTriple());
chunks.push(bold(true));
chunks.push(text(data.number));
chunks.push(bold(false));
chunks.push(sizeNormal());
chunks.push(lf());
```

---

### Exemplo 2: Senha Gigante com Fonte Diferente

```typescript
// Adicionar funções:
function sizeQuadruple(): Uint8Array {
  return new Uint8Array([GS, 0x21, 0x33]); // 4x4
}

function fontB(): Uint8Array {
  return new Uint8Array([ESC, 0x4D, 0x01]);
}

function fontA(): Uint8Array {
  return new Uint8Array([ESC, 0x4D, 0x00]);
}

// Modificar senha:
chunks.push(fontB());           // Fonte compacta
chunks.push(sizeQuadruple());   // 4x4
chunks.push(bold(true));
chunks.push(text(data.number));
chunks.push(bold(false));
chunks.push(sizeNormal());
chunks.push(fontA());           // Volta fonte padrão
chunks.push(lf());
```

---

### Exemplo 3: Customizar Espaçamento Entre Linhas

```typescript
// Adicionar funções:
function lineSpacing(dots: number): Uint8Array {
  return new Uint8Array([ESC, 0x33, dots]);
}

function lineSpacingDefault(): Uint8Array {
  return new Uint8Array([ESC, 0x32]);
}

// Usar no ticket:
chunks.push(init());
chunks.push(alignCenter());
chunks.push(lineSpacing(50));    // Espaçamento maior (5mm)

// ... resto do ticket ...

chunks.push(text(dateTime));
chunks.push(lineSpacingDefault()); // Volta ao padrão
chunks.push(lf(2));
```

---

### Exemplo 4: Ticket com QR Code

```typescript
// Adicionar ao final, antes do corte:
function printQRCode(data: string, size: number = 6): Uint8Array {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const len = dataBytes.length + 3;

  const chunks: Uint8Array[] = [];

  // Modelo
  chunks.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));

  // Tamanho
  chunks.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]));

  // Correção de erro
  chunks.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]));

  // Dados
  const pL = len & 0xFF;
  const pH = (len >> 8) & 0xFF;
  chunks.push(new Uint8Array([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...dataBytes]));

  // Imprimir
  chunks.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]));

  return concatBytes(chunks);
}

// No buildTicketESCPOSEncoded(), antes do corte:
chunks.push(lf(2));
chunks.push(printQRCode(`SENHA:${data.number}|MATRICULA:${data.employeeBadge}`, 6));
chunks.push(lf(3));
chunks.push(cut());
```

---

### Exemplo 5: Ticket com Código de Barras CODE128

```typescript
// Adicionar funções:
function barcodeHeight(dots: number): Uint8Array {
  return new Uint8Array([GS, 0x68, dots]);
}

function barcodeWidth(width: number): Uint8Array {
  return new Uint8Array([GS, 0x77, width]);
}

function printBarcodeCODE128(data: string): Uint8Array {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  return new Uint8Array([
    GS, 0x6B, 73,  // CODE128
    ...dataBytes,
    0x00           // NUL
  ]);
}

// No buildTicketESCPOSEncoded():
chunks.push(lf(2));
chunks.push(barcodeHeight(50));           // Altura 50 dots
chunks.push(barcodeWidth(3));             // Largura 3
chunks.push(printBarcodeCODE128(data.number)); // Ex: "N001"
chunks.push(lf(3));
chunks.push(cut());
```

---

### Exemplo 6: Ticket Multi-Língua com Alinhamentos

```typescript
// Cabeçalho à esquerda
chunks.push(alignLeft());
chunks.push(bold(true));
chunks.push(text('HOSPITAL XYZ'));
chunks.push(bold(false));
chunks.push(lf());

// Senha centralizada
chunks.push(alignCenter());
chunks.push(sizeTriple());
chunks.push(text(data.number));
chunks.push(sizeNormal());
chunks.push(lf(2));

// Dados à esquerda
chunks.push(alignLeft());
chunks.push(text(`Matrícula: ${data.employeeBadge}`));
chunks.push(lf());

// Data/hora à direita
chunks.push(alignRight());
chunks.push(text(dateTime));
chunks.push(lf(3));
```

---

### Exemplo 7: Ticket com Logo (Bitmap)

Para imprimir logos, use o comando `GS v 0`:

```typescript
function printBitmap(imageBytes: Uint8Array, width: number, height: number): Uint8Array {
  const widthL = width & 0xFF;
  const widthH = (width >> 8) & 0xFF;
  const heightL = height & 0xFF;
  const heightH = (height >> 8) & 0xFF;

  return new Uint8Array([
    GS, 0x76, 0x30, 0x00,  // GS v 0 (modo normal)
    widthL, widthH,
    heightL, heightH,
    ...imageBytes
  ]);
}

// Nota: imageBytes deve ser bitmap monocromático (1 bit por pixel)
// Use bibliotecas como 'image-to-bitmap' ou converta manualmente
```

---

## Exemplos Práticos

### Ticket Completo Customizado

```typescript
export async function buildCustomTicket(data: TicketData): Promise<Uint8Array> {
  const dateTime = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data.timestamp);

  const chunks: Uint8Array[] = [];

  // === INICIALIZAÇÃO ===
  chunks.push(init());
  chunks.push(alignCenter());
  chunks.push(lineSpacing(40)); // Espaçamento 5mm

  // === LOGO (simulado com texto) ===
  chunks.push(bold(true));
  chunks.push(text('★ HOSPITAL SICFAR ★'));
  chunks.push(bold(false));
  chunks.push(lf(2));

  // === CABEÇALHO ===
  chunks.push(sizeTriple());
  chunks.push(text('AMBULATÓRIO'));
  chunks.push(sizeNormal());
  chunks.push(lf(2));

  // === SENHA GIGANTE ===
  chunks.push(new Uint8Array([ESC, 0x7B, 0x01])); // Inverter (branco no preto)
  chunks.push(sizeQuadruple());
  chunks.push(bold(true));
  chunks.push(text(data.number));
  chunks.push(bold(false));
  chunks.push(sizeNormal());
  chunks.push(new Uint8Array([ESC, 0x7B, 0x00])); // Desinverter
  chunks.push(lf(3));

  // === DADOS ALINHADOS À ESQUERDA ===
  chunks.push(alignLeft());
  chunks.push(text('─'.repeat(32))); // Linha separadora
  chunks.push(lf());
  chunks.push(text(`Matrícula: ${data.employeeBadge}`));
  chunks.push(lf());
  if (data.employeeName) {
    chunks.push(text(`Paciente: ${data.employeeName}`));
    chunks.push(lf());
  }
  chunks.push(text(`Data/Hora: ${dateTime}`));
  chunks.push(lf());
  chunks.push(text('─'.repeat(32)));
  chunks.push(lf(2));

  // === QR CODE ===
  chunks.push(alignCenter());
  const qrData = JSON.stringify({
    senha: data.number,
    matricula: data.employeeBadge,
    timestamp: data.timestamp.toISOString(),
  });
  chunks.push(printQRCode(qrData, 6));
  chunks.push(lf(2));

  // === RODAPÉ ===
  chunks.push(fontB());
  chunks.push(text('Aguarde ser chamado'));
  chunks.push(lf());
  chunks.push(text('Obrigado!'));
  chunks.push(fontA());

  // === ESPAÇAMENTO E CORTE ===
  chunks.push(lineSpacingDefault());
  chunks.push(lf(5));
  chunks.push(cut());

  return concatBytes(chunks);
}
```

**Resultado Visual:**
```
        ★ HOSPITAL SICFAR ★

          AMBULATÓRIO

┌───────────────────────────────────┐
│                                   │
│            N001                   │ (4x4, invertido)
│                                   │
└───────────────────────────────────┘

────────────────────────────────────
Matrícula: 12345
Paciente: João da Silva
Data/Hora: 22/10/25, 14:30
────────────────────────────────────

          ███████████
          ██ ▄▄▄ ██    (QR Code)
          ██ ███ ██
          ███████████

     Aguarde ser chamado
          Obrigado!

        ✂️ (corte)
```

---

## Troubleshooting

### Problema 1: "Impressão não funciona"

**Sintomas:**
- Intent dispara, mas nada imprime
- App RawBT não abre

**Soluções:**

1. **Verificar se RawBT está instalado:**
   ```bash
   # Via adb
   adb shell pm list packages | grep rawbt
   # Deve retornar: package:ru.a402d.rawbtprinter
   ```

2. **Verificar conexão Bluetooth:**
   - Abrir app RawBT
   - Conectar manualmente à impressora
   - Testar impressão de teste no app

3. **Verificar Intent URL:**
   ```typescript
   // Log para debug
   console.log('Intent URL:', intentUrl);
   console.log('Base64 length:', b64.length);
   ```

4. **Testar com dados mínimos:**
   ```typescript
   const testBytes = new Uint8Array([
     ESC, 0x40,           // Init
     ...text("TESTE"),
     0x0A,                // LF
     GS, 0x56, 0x01      // Cut
   ]);
   ```

---

### Problema 2: "Caracteres estranhos/corrompidos"

**Sintomas:**
- Acentos aparecem como `?` ou símbolos estranhos
- Texto cortado

**Soluções:**

1. **Verificar encoding UTF-8:**
   ```typescript
   // Garantir TextEncoder (UTF-8)
   function text(str: string): Uint8Array {
     return new TextEncoder().encode(str);
   }
   ```

2. **Verificar configuração da impressora:**
   - Algumas impressoras precisam de `ESC t` para definir code page
   ```typescript
   function setCodePageUTF8(): Uint8Array {
     return new Uint8Array([ESC, 0x74, 0x10]); // CP865 ou similar
   }
   ```

3. **Testar sem acentos:**
   ```typescript
   const testText = "TESTE SEM ACENTO";
   ```

---

### Problema 3: "Tamanho não muda"

**Sintomas:**
- Comandos de tamanho não têm efeito
- Tudo imprime em tamanho normal

**Soluções:**

1. **Verificar ordem dos comandos:**
   ```typescript
   // ERRADO:
   chunks.push(text("TESTE"));
   chunks.push(sizeDoubleWH()); // Tarde demais!

   // CERTO:
   chunks.push(sizeDoubleWH()); // Antes do texto
   chunks.push(text("TESTE"));
   chunks.push(sizeNormal());   // Resetar depois
   ```

2. **Verificar se impressora suporta GS !:**
   - Algumas impressoras antigas usam comandos diferentes
   - Testar com `ESC !` (alternativo):
   ```typescript
   function sizeDoubleAlt(): Uint8Array {
     return new Uint8Array([ESC, 0x21, 0x30]); // ESC ! (alternativo)
   }
   ```

---

### Problema 4: "Corte não funciona"

**Sintomas:**
- Papel não corta automaticamente
- Comando ignorado

**Soluções:**

1. **Verificar se impressora tem guilhotina:**
   - Nem todas têm
   - Comando é ignorado se não houver

2. **Adicionar feed antes do corte:**
   ```typescript
   chunks.push(lf(5));  // Garantir que papel saiu
   chunks.push(cut());
   ```

3. **Testar corte total vs parcial:**
   ```typescript
   // Parcial (padrão)
   chunks.push(new Uint8Array([GS, 0x56, 0x01]));

   // Total (pode travar em algumas impressoras)
   chunks.push(new Uint8Array([GS, 0x56, 0x00]));
   ```

---

### Problema 5: "Espaçamento muito pequeno"

**Sintomas:**
- Linhas muito juntas
- Texto sobreposto

**Soluções:**

1. **Aumentar espaçamento de linha:**
   ```typescript
   chunks.push(init());
   chunks.push(lineSpacing(50)); // 6.3mm
   ```

2. **Adicionar linhas em branco:**
   ```typescript
   chunks.push(lf(3)); // 3 linhas em branco
   ```

3. **Usar tamanho maior:**
   ```typescript
   // Tamanho maior naturalmente cria mais espaço vertical
   chunks.push(sizeDoubleWH());
   ```

---

### Problema 6: "Base64 muito grande / crash"

**Sintomas:**
- Intent falha com dados grandes
- Browser trava ao converter Base64

**Soluções:**

1. **Já implementado: conversão em chunks**
   ```typescript
   // uint8ToBase64() usa chunks de 32KB
   const chunkSize = 0x8000;
   ```

2. **Reduzir dados:**
   - Evitar logos/imagens grandes
   - Reduzir `lf(60)` para `lf(20)`
   - Usar fonte compacta (fontB)

3. **Comprimir dados (avançado):**
   ```typescript
   // Usar pako.js para gzip
   import pako from 'pako';
   const compressed = pako.deflate(bytes);
   ```

---

## Referências Técnicas

### Documentação Oficial ESC/POS

1. **Epson ESC/POS Command Manual**
   - https://reference.epson-biz.com/modules/ref_escpos/index.php
   - Referência completa de todos os comandos

2. **RawBT Documentation**
   - https://rawbt.ru/start.html
   - https://rawbt.ru/intents.html
   - Formatos de Intent aceitos

3. **ESC/POS Wikipedia**
   - https://en.wikipedia.org/wiki/ESC/P
   - História e overview do protocolo

### Ferramentas Úteis

1. **Hex Editor**
   - Para analisar bytes gerados
   - Recomendado: HxD (Windows), hexdump (Linux)

2. **Conversor Hex/Decimal**
   - https://www.rapidtables.com/convert/number/hex-to-decimal.html

3. **Calculadora de Code Page**
   - https://www.charset.org/utf-8

### Bibliotecas JavaScript (Alternativas)

1. **react-thermal-printer** ⭐ (BASE DESTE PROJETO)
   - **https://github.com/seokju-na/react-thermal-printer**
   - **Repositório utilizado como base e inspiração para o SICFAR-Clinic**
   - Fornece API declarativa React para impressão térmica
   - Excelente referência para comandos ESC/POS
   - Demonstra implementação de QR Code, códigos de barras, formatação
   - **Diferença**: SICFAR usa Intents Android (RawBT), não necessita da biblioteca instalada
   - **Crédito**: Muito obrigado ao autor [@seokju-na](https://github.com/seokju-na) pela documentação e exemplos!

2. **escpos** (Node.js)
   - https://github.com/song940/node-escpos
   - Biblioteca completa (não usada no SICFAR por ser Node-only)
   - Alternativa server-side para impressão ESC/POS

3. **react-thermal-printer** (outro fork)
   - https://github.com/lcsouzamenezes/react-thermal-printer
   - Componente React (não compatível com Intent Android)
   - Fork brasileiro com algumas melhorias

### Hardware Recomendado

1. **Impressoras Térmicas Compatíveis:**
   - Elgin i7/i8/i9/M10 (testado)
   - Bematech MP-4200
   - Daruma DR-800
   - Epson TM-T20/T88
   - Qualquer impressora com protocolo ESC/POS

2. **Papel Térmico:**
   - 58mm (pequeno)
   - 80mm (padrão, recomendado)
   - Qualidade: 48g/m² ou 55g/m²

### Apps Android Alternativos ao RawBT

1. **Print Hand**
   - https://play.google.com/store/apps/details?id=com.dynamixsoftware.printhand

2. **Bluetooth Printer**
   - https://play.google.com/store/apps/details?id=com.bluetoothprinter

3. **StarPRNT**
   - Para impressoras Star Micronics
   - https://www.starmicronics.com/pages/mobile-apps

---

## Apêndice: Tabela ASCII/ESC/POS Completa

### Caracteres de Controle

| Dec | Hex | Char | Nome | Uso |
|-----|-----|------|------|-----|
| 0 | 0x00 | NUL | Null | Terminador de string |
| 9 | 0x09 | HT | Tab | Tabulação horizontal |
| 10 | 0x0A | LF | Line Feed | Quebra de linha |
| 12 | 0x0C | FF | Form Feed | Ejetar página |
| 13 | 0x0D | CR | Carriage Return | Retorno de carro |
| 27 | 0x1B | ESC | Escape | Prefixo de comando |
| 29 | 0x1D | GS | Group Separator | Prefixo de comando |
| 16 | 0x10 | DLE | Data Link Escape | Comandos de status |

### Comandos ESC

| Comando | Hex | Descrição |
|---------|-----|-----------|
| ESC @ | 1B 40 | Inicializar impressora |
| ESC ! n | 1B 21 n | Selecionar modo de impressão |
| ESC E n | 1B 45 n | Negrito on/off |
| ESC M n | 1B 4D n | Selecionar fonte |
| ESC a n | 1B 61 n | Alinhamento |
| ESC d n | 1B 64 n | Imprimir e alimentar n linhas |
| ESC 2 | 1B 32 | Espaçamento padrão (1/6") |
| ESC 3 n | 1B 33 n | Espaçamento customizado |
| ESC - n | 1B 2D n | Sublinhado |
| ESC { n | 1B 7B n | Invertido |
| ESC V n | 1B 56 n | Rotacionar 90° |
| ESC t n | 1B 74 n | Selecionar code page |

### Comandos GS

| Comando | Hex | Descrição |
|---------|-----|-----------|
| GS ! n | 1D 21 n | Tamanho de caractere |
| GS V n | 1D 56 n | Cortar papel |
| GS h n | 1D 68 n | Altura de código de barras |
| GS w n | 1D 77 n | Largura de código de barras |
| GS k m d...dk NUL | 1D 6B ... | Imprimir código de barras |
| GS ( k | 1D 28 6B | Comandos QR Code |
| GS v 0 | 1D 76 30 | Imprimir bitmap |

---

## Changelog

### Versão Atual (buildTicketESCPOSEncoded)

- ✅ Inicialização (ESC @)
- ✅ Centralização
- ✅ Cabeçalho 2x2 negrito
- ✅ Senha 2x2 negrito
- ✅ Dados do paciente (matrícula, nome, data/hora)
- ✅ Espaçamento vertical (lf(60))
- ✅ Corte parcial

### Melhorias Futuras Sugeridas

- [ ] Adicionar QR Code com dados da senha
- [ ] Adicionar código de barras CODE128
- [ ] Implementar logo bitmap
- [ ] Adicionar linha separadora (─)
- [ ] Fonte alternativa (fontB) para economia de papel
- [ ] Modo de impressão "econômico" vs "padrão"
- [ ] Configuração de altura do ticket (curto/médio/longo)
- [ ] Suporte a impressoras 58mm (papel menor)
- [ ] Rodapé customizável
- [ ] Múltiplos idiomas

---

## Licença e Créditos

### Desenvolvido para
**SICFAR-Clinic** - Sistema de gerenciamento de senhas ambulatoriais

### Tecnologias Principais
- **Protocolo:** ESC/POS (Epson Standard)
- **App Android:** RawBT Printer (ru.a402d.rawbtprinter)
- **Linguagem:** TypeScript
- **Hardware:** Mini PDV M10 Elgin

### Inspiração e Agradecimentos

Este sistema foi desenvolvido com base e inspiração do projeto:

**[react-thermal-printer](https://github.com/seokju-na/react-thermal-printer)**
Autor: [@seokju-na](https://github.com/seokju-na)

Agradecimentos especiais pela excelente documentação e exemplos de implementação ESC/POS que serviram como referência fundamental para o desenvolvimento desta solução. O repositório forneceu insights valiosos sobre:
- Comandos ESC/POS e suas aplicações
- Estruturação de dados para impressão térmica
- Implementação de QR Codes e códigos de barras
- Boas práticas de formatação de tickets

### Adaptações Realizadas

A implementação do SICFAR-Clinic foi **customizada e adaptada** para:
- ✅ Funcionar via Intents do Android (sem dependências npm)
- ✅ Integração direta com app RawBT
- ✅ Otimização para impressora Elgin M10
- ✅ Formato específico de senhas ambulatoriais
- ✅ Suporte a caracteres UTF-8 (português brasileiro)
- ✅ Geração browser-side de bytes ESC/POS

---

**Última atualização:** 22/10/2025
**Versão:** 1.0.0

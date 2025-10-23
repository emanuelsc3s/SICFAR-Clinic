/*
 * Impressão térmica via navegador (Android) usando ESC/POS
 * - Gera bytes ESC/POS manualmente (sem dependências Node)
 * - Envia para o app RawBT por Intent (sem app desktop)
 * Observação: funciona em Android; em outros ambientes lança erro
 */

export interface TicketData {
  number: string;
  employeeBadge: string;
  employeeName?: string;
  timestamp: Date;
}

export function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

// Verifica se é realmente um dispositivo Android físico (não emulação ou browser desktop)
// Retorna true apenas se for Android E não estiver rodando em localhost (desenvolvimento)
export function isRealAndroidDevice(): boolean {
  const isAndroidUA = isAndroid();
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.startsWith('192.168.') ||
     window.location.hostname.startsWith('10.') ||
     window.location.hostname.startsWith('172.'));

  // Se é Android mas está em localhost, provavelmente é emulação/dev
  // Retorna true apenas se for Android E NÃO for localhost
  return isAndroidUA && !isLocalhost;
}

function uint8ToBase64(u8: Uint8Array): string {
  // Converte Uint8Array para base64 em chunks (apenas browser)
  let binary = '';
  const chunkSize = 0x8000; // 32 KB
  for (let i = 0; i < u8.length; i += chunkSize) {
    const sub = u8.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...sub);
  }
  return btoa(binary);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function text(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Comandos ESC/POS úteis
const ESC = 0x1b; // escape
const GS = 0x1d;  // group separator

function init(): Uint8Array { return new Uint8Array([ESC, 0x40]); } // ESC @
function alignCenter(): Uint8Array { return new Uint8Array([ESC, 0x61, 0x01]); } // ESC a 1
function alignLeft(): Uint8Array { return new Uint8Array([ESC, 0x61, 0x00]); } // ESC a 0

function bold(on: boolean): Uint8Array { return new Uint8Array([ESC, 0x45, on ? 1 : 0]); } // ESC E n
function sizeNormal(): Uint8Array { return new Uint8Array([GS, 0x21, 0x00]); } // GS ! 0
function sizeDoubleWH(): Uint8Array { return new Uint8Array([GS, 0x21, 0x11]); } // 2x largura e altura
function lf(lines = 1): Uint8Array { return new Uint8Array(Array(lines).fill(0x0a)); }
function cut(): Uint8Array { return new Uint8Array([GS, 0x56, 0x01]); } // GS V 1 (partial cut; ignorado se não houver)

// Seleciona página de código para caracteres (ESC t n)
// OBS: Muitos modelos aceitam n=65 para UTF-8. Alternativas comuns para PT-BR:
//  - 3  = PC860 (Português)
//  - 19 = PC858 (Europa Ocidental com €)
//  - 16 = Windows-1252
function selectCodePage(n: number): Uint8Array { return new Uint8Array([ESC, 0x74, n]); } // ESC t n


// Largura máxima típica (58mm): 384 pontos
const PRINTER_MAX_WIDTH_DOTS = 384;

// Carrega imagem e retorna ImageData redimensionado para caber na largura da impressora
async function loadImageData(url: string, maxWidthDots = PRINTER_MAX_WIDTH_DOTS): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidthDots / img.width);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas 2D não suportado'));
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        resolve(imageData);
      };
      img.onerror = () => reject(new Error('Falha ao carregar imagem: ' + url));
      // Em Vite, arquivos em /public ficam disponíveis em "/<nome>"
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

// Converte ImageData para comando ESC/POS Raster Bit Image (GS v 0)
function imageDataToEscPosRaster(imageData: ImageData, threshold = 128): Uint8Array {
  const { width, height, data } = imageData;
  const bytesPerRow = Math.ceil(width / 8);
  const raster = new Uint8Array(bytesPerRow * height);

  // Converte RGBA -> 1 bit por pixel (1 = preto, 0 = branco)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const isBlack = lum < threshold; // simples limiarização
      const byteIndex = y * bytesPerRow + (x >> 3);
      const bit = 7 - (x & 7); // MSB primeiro
      if (isBlack) raster[byteIndex] |= (1 << bit);
    }
  }

  // Monta cabeçalho GS v 0 m xL xH yL yH
  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;
  const header = new Uint8Array([GS, 0x76, 0x30, 0x00, xL, xH, yL, yH]); // m=0 (normal)

  return concatBytes([header, raster]);
}

// Gera bytes ESC/POS para imprimir o logotipo (centralizado via ESC a 1 já aplicado acima)
async function buildLogoRaster(url = '/farmace.png'): Promise<Uint8Array | null> {
  try {
    const imageData = await loadImageData(url, PRINTER_MAX_WIDTH_DOTS);
    const rasterCmd = imageDataToEscPosRaster(imageData);
    return rasterCmd;
  } catch (err) {
    console.warn('[SICFAR] Logo não impresso:', err);
    return null;
  }
}

export async function buildTicketESCPOSEncoded(data: TicketData): Promise<Uint8Array> {
  const dateTime = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data.timestamp);

  const chunks: Uint8Array[] = [];
  chunks.push(init());
  // Define pagina de codigo para UTF-8 (ESC t 65). Caso sua impressora nao suporte UTF-8,
  // ajuste o valor (ex.: 3=PC860, 19=PC858, 16=Windows-1252).
  chunks.push(selectCodePage(65));
  chunks.push(alignCenter());

  // Logotipo no topo (raster GS v 0)
  try {
    const logo = await buildLogoRaster('/farmace.png');
    if (logo) {
      chunks.push(logo);
      chunks.push(lf());
    }
  } catch (e) {
    console.warn('[SICFAR] Falha ao gerar/imprimir logo:', e);
  }

  // Espaçamento extra no topo para aumentar a altura total do ticket (após logo)
  chunks.push(lf(3));

  // Cabeçalho (duplo e negrito)
  chunks.push(sizeDoubleWH());
  chunks.push(bold(true));
  chunks.push(text('ATENDIMENTO AMBULATORIAL'));
  chunks.push(bold(false));
  chunks.push(sizeNormal());
  chunks.push(lf(10));

  // Número da senha em destaque (2x) + negrito
  chunks.push(sizeDoubleWH());
  chunks.push(bold(true));
  chunks.push(text(data.number));
  chunks.push(bold(false));
  chunks.push(sizeNormal());
  chunks.push(lf(10));

  // Demais linhas
  chunks.push(alignLeft());
  chunks.push(sizeNormal());
  chunks.push(text(`Matricula: ${data.employeeBadge}`));
  chunks.push(lf());
  if (data.employeeName) {
    chunks.push(text(`Paciente: ${data.employeeName}`));
    chunks.push(lf());
  }
  
  chunks.push(lf(10)); // Espaço após o Paciente

  chunks.push(alignCenter()); // restaura alinhamento central para as próximas linhas
  chunks.push(text(dateTime));
  chunks.push(lf(2));

  // Espaçamento extra no final para dobrar a altura total
  chunks.push(lf(40));

  chunks.push(text(`SICFAR Clinic - FARMACE`));
  chunks.push(lf(10));

  // Corte
  chunks.push(cut());

  return concatBytes(chunks);
}

export async function printThermalTicket(data: TicketData): Promise<void> {
  if (!isAndroid()) {
    throw new Error('Impressão térmica via Intent disponível apenas no Android.');
  }

  console.info('[SICFAR] Impressão térmica via RawBT (ESC/POS)');

  const bytes = await buildTicketESCPOSEncoded(data);
  const b64 = uint8ToBase64(bytes);

  // Formato de Intent aceito pelo RawBT (https://rawbt.ru/start.html / intents)
  const intentUrl = `intent:base64,${b64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

  // Tenta abrir o RawBT; se falhar, a chamada do caller deve fazer fallback
  window.location.href = intentUrl;
}


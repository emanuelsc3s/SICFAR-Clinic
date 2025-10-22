/*
 * Impressão térmica via navegador (Android) usando ESC/POS
 * - Gera bytes ESC/POS manualmente (sem dependências Node)
 * - Envia para o app RawBT por Intent (sem app desktop)
 * Observação: funciona em Android; em outros ambientes lança erro para permitir fallback
 */

import type { TicketData } from '@/utils/printTicket';

function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
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
function alignLeft(): Uint8Array { return new Uint8Array([ESC, 0x61, 0x00]); }   // ESC a 0
function bold(on: boolean): Uint8Array { return new Uint8Array([ESC, 0x45, on ? 1 : 0]); } // ESC E n
function sizeNormal(): Uint8Array { return new Uint8Array([GS, 0x21, 0x00]); } // GS ! 0
function sizeDoubleWH(): Uint8Array { return new Uint8Array([GS, 0x21, 0x11]); } // 2x largura e altura
function lf(lines = 1): Uint8Array { return new Uint8Array(Array(lines).fill(0x0a)); }
function cut(): Uint8Array { return new Uint8Array([GS, 0x56, 0x01]); } // GS V 1 (partial cut; ignorado se não houver)

export async function buildTicketESCPOSEncoded(data: TicketData): Promise<Uint8Array> {
  const dateTime = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data.timestamp);

  const chunks: Uint8Array[] = [];
  chunks.push(init());
  chunks.push(alignCenter());

  // Cabeçalho
  chunks.push(bold(true));
  chunks.push(text('Atendimento Ambulatorial'));
  chunks.push(bold(false));
  chunks.push(lf());

  // Número da senha em destaque (2x)
  chunks.push(sizeDoubleWH());
  chunks.push(text(data.number));
  chunks.push(sizeNormal());
  chunks.push(lf());

  // Demais linhas
  chunks.push(text(`Mat.: ${data.employeeBadge}`));
  chunks.push(lf());
  if (data.employeeName) {
    chunks.push(text(`Nome: ${data.employeeName}`));
    chunks.push(lf());
  }
  chunks.push(text(dateTime));
  chunks.push(lf(2));

  // Corte
  chunks.push(cut());

  return concatBytes(chunks);
}

export async function printThermalTicket(data: TicketData): Promise<void> {
  if (!isAndroid()) {
    throw new Error('Impressão térmica via Intent disponível apenas no Android.');
  }

  const bytes = await buildTicketESCPOSEncoded(data);
  const b64 = uint8ToBase64(bytes);

  // Formato de Intent aceito pelo RawBT (https://rawbt.ru/start.html / intents)
  const intentUrl = `intent:base64,${b64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

  // Tenta abrir o RawBT; se falhar, a chamada do caller deve fazer fallback
  window.location.href = intentUrl;
}


/*
 * Impressão térmica via navegador (Android) usando ESC/POS
 * - Gera bytes ESC/POS com react-thermal-printer
 * - Envia para o app RawBT por Intent (sem app desktop)
 * Observação: funciona em Android; em outros ambientes lança erro para permitir fallback
 */

import React from 'react';
import { Printer, Text, Br, Cut, render } from 'react-thermal-printer';
import type { TicketData } from '@/utils/printTicket';

function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

function uint8ToBase64(u8: Uint8Array): string {
  // Converte Uint8Array para base64 de forma segura em chunks
  let binary = '';
  const chunkSize = 0x8000; // 32 KB
  for (let i = 0; i < u8.length; i += chunkSize) {
    const sub = u8.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...sub);
  }
  return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
}

export async function buildTicketESCPOSEncoded(data: TicketData): Promise<Uint8Array> {
  const dateTime = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data.timestamp);

  const receipt = (
    <Printer type="epson" width={32} encoder={(t) => new TextEncoder().encode(t)}>
      <Text align="center">Atendimento Ambulatorial</Text>
      <Br />
      <Text align="center" size={{ width: 2, height: 2 }} bold>
        {data.number}
      </Text>
      <Br />
      <Text align="center">Mat.: {data.employeeBadge}</Text>
      {data.employeeName ? (
        <Text align="center">Nome: {data.employeeName}</Text>
      ) : null}
      <Text align="center">{dateTime}</Text>
      <Br />
      <Cut />
    </Printer>
  );

  return await render(receipt);
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


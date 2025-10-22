/**
 * Utility for printing queue tickets
 */

export interface TicketData {
  number: string;
  employeeBadge: string;
  employeeName?: string;
  timestamp: Date;
}

/**
 * Generates the HTML content for the ticket
 */
const generateTicketHTML = (data: TicketData): string => {
  const formattedDate = data.timestamp.toLocaleDateString('pt-BR');
  const formattedTime = data.timestamp.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const dateTimeString = `${formattedDate} ${formattedTime}`;

  const employeeName = data.employeeName || 'Colaborador';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Senha - ${data.number}</title>
    <style>
      @media print {
        @page {
          /* Tamanho personalizado: 88mm (largura) x 124mm (altura) */
          size: 88mm 124mm;
          margin: 0;
        }
        html, body {
          margin: 0;
          padding: 0;
          /* Garante a área de impressão no iframe/nova janela */
          width: 88mm;
          height: 124mm;
        }
      }
      html, body {
        margin: 0;
        padding: 0;
      }
      .ticket {
        width: 88mm;
        height: 124mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center; /* centraliza verticalmente o conteúdo */
        line-height: 1.1;
        text-align: center;
      }
    </style>
</head>
<body>
<div class="ticket">
    <img src="https://farmace.com.br/images/farmace50.png" style="align: center; width:50px" />
    <p style="font-family: Arial Black; font-size: 10px"> Atendimento Ambulatorial</p>
    <p style="font-family: Arial Black; font-size: 40px;"> ${data.number}</p>
    <p style="font-family: Arial Black; font-size: 10px"> Mat.: ${data.employeeBadge}</p>
    <p style="font-family: Arial Black; font-size: 10px"> Nome: ${employeeName}</p>
    <p style="font-family: Arial Black; font-size: 8px"> ${dateTimeString}</p>
</div>
</body>
</html>`;
};

/**
 * Prints a queue ticket
 * Note: Due to browser security restrictions, this will open the print dialog.
 * True silent printing requires a backend service or browser extension.
 */
export const printTicket = (data: TicketData): void => {
  const html = generateTicketHTML(data);

  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Could not access iframe document');
    document.body.removeChild(iframe);
    return;
  }

  // Write the HTML content to the iframe
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to load, then print
  iframe.contentWindow?.focus();

  // Use a small delay to ensure content is fully loaded
  setTimeout(() => {
    iframe.contentWindow?.print();

    // Remove iframe after printing (or if user cancels)
    // We use a longer timeout to ensure print dialog has appeared
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
};

/**
 * Alternative implementation using window.open
 * This opens a new window/tab for printing
 */
export const printTicketNewWindow = (data: TicketData): void => {
  const html = generateTicketHTML(data);

  const printWindow = window.open('', '_blank', 'width=300,height=400');
  if (!printWindow) {
    console.error('Could not open print window. Please check popup blocker settings.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.focus();

  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();

    // Close window after printing
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  }, 250);
};

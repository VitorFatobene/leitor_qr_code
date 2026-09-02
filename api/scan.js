import { google } from 'googleapis';
import { config } from 'dotenv';
import { extrairNumeroIngresso } from '../src/services/tickets.js';

config({ path: '.env.local', quiet: true });

const TIME_ZONE = 'America/Sao_Paulo';

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function formatDateTime() {
  const now = new Date();

  const date = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now);

  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  return { date, time };
}

function getSheetRange(sheetName) {
  const safeSheetName = sheetName.replace(/'/g, "''");
  return `'${safeSheetName}'!A:E`;
}

function getCredentials() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    return null;
  }

  return { clientEmail, privateKey };
}

function getSpreadsheetConfig() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID?.trim();
  const sheetName = process.env.GOOGLE_SHEET_NAME?.trim();

  if (!spreadsheetId || !sheetName) {
    return null;
  }

  return { spreadsheetId, sheetName };
}

function sendError(response, status, message) {
  return response.status(status).json({
    success: false,
    message,
  });
}

function getGoogleErrorResponse(error) {
  const status = error?.code || error?.response?.status;
  const message = String(error?.message || '');

  if (status === 400 && /Unable to parse range|Range/i.test(message)) {
    return {
      status: 400,
      message: 'Aba da planilha não encontrada ou nome da aba inválido.',
    };
  }

  if (status === 401 || /invalid_grant|Invalid JWT|invalid key/i.test(message)) {
    return {
      status: 401,
      message: 'Erro de autenticação com o Google Sheets.',
    };
  }

  if (status === 403) {
    return {
      status: 403,
      message: 'Service Account sem permissão para editar a planilha.',
    };
  }

  if (status === 404) {
    return {
      status: 404,
      message: 'Planilha não encontrada.',
    };
  }

  if (status === 429 || status >= 500) {
    return {
      status: 503,
      message: 'Google Sheets API indisponível no momento.',
    };
  }

  return {
    status: 500,
    message: 'Erro ao salvar na planilha.',
  };
}

export default async function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  if (request.method !== 'POST') {
    return sendError(response, 405, 'Método não permitido.');
  }

  const {
    nome,
    quantidadeKg,
    qrValue,
  } = request.body || {};

  const cleanNome = String(nome || '').trim().slice(0, 150);
  const parsedQuantidadeKg = Number(quantidadeKg);
  const cleanQrValue = String(qrValue || '').trim();
  const ticketNumber = cleanQrValue.includes('/check-in/')
    ? extrairNumeroIngresso(cleanQrValue)
    : cleanQrValue;

  if (!ticketNumber) {
    return sendError(response, 400, 'Requisição inválida.');
  }

  if (!cleanNome || !Number.isFinite(parsedQuantidadeKg) || parsedQuantidadeKg <= 0) {
    return sendError(response, 400, 'Preencha corretamente nome e quantidade doada.');
  }

  try {
    const credentials = getCredentials();

    if (!credentials) {
      return sendError(response, 500, 'Configuração do Google Sheets ausente no servidor.');
    }

    const spreadsheetConfig = getSpreadsheetConfig();

    if (!spreadsheetConfig) {
      return sendError(response, 500, 'Planilha não configurada no servidor.');
    }

    const auth = new google.auth.JWT({
      email: credentials.clientEmail,
      key: credentials.privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const { date, time } = formatDateTime();

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetConfig.spreadsheetId,
      range: getSheetRange(spreadsheetConfig.sheetName),
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[date, time, cleanNome, parsedQuantidadeKg, ticketNumber]],
      },
    });

    return response.status(200).json({
      success: true,
      message: 'Salvo na planilha com sucesso.',
      saved: {
        date,
        time,
        nome: cleanNome,
        quantidadeKg: parsedQuantidadeKg,
        qrValue: ticketNumber,
      },
    });
  } catch (error) {
    console.error('Erro ao gravar no Google Sheets:', {
      code: error?.code || error?.response?.status,
      message: error?.message,
    });

    const errorResponse = getGoogleErrorResponse(error);
    return sendError(response, errorResponse.status, errorResponse.message);
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { google } from 'googleapis';
import handler, {
  buildSheetRow,
  findTicketOwnerInRows,
  getManualRegistration,
  isValidTicketNumber,
} from '../api/scan.js';

const rows = [
  ['nome', 'matricula', 'curso_ou_area', 'codigo_ingresso', 'situacao'],
  ['Pessoa Encontrada', '000123', 'Engenharia', 'ABC1-DEF2-GHI3', 'ativo'],
];

test('mantém o fluxo atual quando o ingresso é encontrado', () => {
  assert.deepEqual(findTicketOwnerInRows(rows, 'ABC1-DEF2-GHI3'), {
    found: true,
    nome: 'Pessoa Encontrada',
    matricula: '000123',
    curso: 'Engenharia',
  });
});

test('solicita dados manuais sem criar nome ou matrícula automáticos', () => {
  assert.deepEqual(findTicketOwnerInRows(rows, 'NAO-EXISTE'), { found: false });
});

test('valida e limpa nome e matrícula manuais', () => {
  assert.deepEqual(getManualRegistration({
    nome: '  João da Silva  ',
    matricula: '  123456789  ',
  }), {
    wasProvided: true,
    nome: 'João da Silva',
    matricula: '123456789',
    curso: '',
  });

  assert.equal(getManualRegistration({ nome: '   ', matricula: '' }).error,
    'Preencha nome e matrícula para salvar o registro.');
});

test('monta a linha manual preservando quantidade, ingresso e curso vazio', () => {
  const row = buildSheetRow({
    date: '24/09/2026',
    time: '10:30:00',
    owner: {
      nome: 'João da Silva',
      matricula: '123456789',
      curso: '',
      isManual: true,
    },
    quantidadeKg: 12.5,
    ticketNumber: 'ABC1-DEF2-GHI3',
  });

  assert.deepEqual(row, [
    '24/09/2026',
    '10:30:00',
    'João da Silva',
    12.5,
    'ABC1-DEF2-GHI3',
    "'123456789",
    '',
  ]);
});

test('aceita somente o número do ingresso no backend', () => {
  assert.equal(isValidTicketNumber('30T3-HN5C-CQ51P'), true);
  assert.equal(isValidTicketNumber('https://www.wixevents.com/check-in/30T3,uuid'), false);
  assert.equal(isValidTicketNumber(''), false);
});

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('não grava antes do formulário e grava uma única linha após o envio manual', async () => {
  const originalJwt = google.auth.JWT;
  const originalSheets = google.sheets;
  const originalEnv = {
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID,
    GOOGLE_SHEET_NAME: process.env.GOOGLE_SHEET_NAME,
    GOOGLE_DATA_SHEET_NAME: process.env.GOOGLE_DATA_SHEET_NAME,
  };
  const appendedRequests = [];

  process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com';
  process.env.GOOGLE_PRIVATE_KEY = 'test-key';
  process.env.GOOGLE_SPREADSHEET_ID = 'spreadsheet-id';
  process.env.GOOGLE_SHEET_NAME = 'Página1';
  process.env.GOOGLE_DATA_SHEET_NAME = 'dados';

  google.auth.JWT = class FakeJwt {};
  google.sheets = () => ({
    spreadsheets: {
      values: {
        get: async () => ({ data: { values: rows } }),
        append: async (request) => {
          appendedRequests.push(request);
          return { data: {} };
        },
      },
    },
  });

  try {
    const firstResponse = createResponse();
    await handler({
      method: 'POST',
      body: {
        quantidadeKg: 12.5,
        qrValue: 'NAO-EXISTE',
      },
    }, firstResponse);

    assert.equal(firstResponse.statusCode, 200);
    assert.equal(firstResponse.body.requiresManualData, true);
    assert.equal(firstResponse.body.ingresso, 'NAO-EXISTE');
    assert.equal(appendedRequests.length, 0);

    const manualResponse = createResponse();
    await handler({
      method: 'POST',
      body: {
        quantidadeKg: 12.5,
        qrValue: 'NAO-EXISTE',
        nome: '  João da Silva  ',
        matricula: '  123456789  ',
      },
    }, manualResponse);

    assert.equal(manualResponse.statusCode, 200);
    assert.equal(manualResponse.body.success, true);
    assert.equal(appendedRequests.length, 1);
    assert.deepEqual(appendedRequests[0].requestBody.values[0].slice(2), [
      'João da Silva',
      12.5,
      'NAO-EXISTE',
      "'123456789",
      '',
    ]);
  } finally {
    google.auth.JWT = originalJwt;
    google.sheets = originalSheets;

    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});

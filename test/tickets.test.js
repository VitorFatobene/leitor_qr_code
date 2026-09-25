import test from 'node:test';
import assert from 'node:assert/strict';
import { extrairNumeroIngresso } from '../src/services/tickets.js';

test('extrai o ingresso de URLs válidas do Wix Events', () => {
  const cases = [
    [
      'https://www.wixevents.com/check-in/30T3-HN5C-CQ51P,ba13bc97-06fc-4584-bec0-2274a1db5abb',
      '30T3-HN5C-CQ51P',
    ],
    [
      'https://www.wixevents.com/check-in/ABC1-DEF2-GHI3,12345678-abcd-1234-abcd-123456789abc',
      'ABC1-DEF2-GHI3',
    ],
    [
      '  https://www.wixevents.com/check-in/ ZX90-YW12-VU34 ,abcd  ',
      'ZX90-YW12-VU34',
    ],
  ];

  for (const [qrValue, expected] of cases) {
    assert.equal(extrairNumeroIngresso(qrValue), expected);
  }
});

test('rejeita QR Code fora do formato esperado', () => {
  assert.equal(extrairNumeroIngresso('https://example.com/event/ABC123'), '');
  assert.equal(extrairNumeroIngresso('https://www.wixevents.com/check-in/ABC123'), '');
  assert.equal(extrairNumeroIngresso(null), '');
});

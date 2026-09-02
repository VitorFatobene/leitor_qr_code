import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const keyPath = process.argv[2];

if (!keyPath) {
  console.error('Uso: npm run setup-env -- caminho/para/service-account.json');
  process.exit(1);
}

const absolutePath = resolve(process.cwd(), keyPath);
const credentials = JSON.parse(readFileSync(absolutePath, 'utf8'));

if (!credentials.client_email || !credentials.private_key) {
  console.error('JSON inválido: client_email ou private_key não encontrado.');
  process.exit(1);
}

const envContent = [
  `GOOGLE_CLIENT_EMAIL=${credentials.client_email}`,
  `GOOGLE_PRIVATE_KEY="${credentials.private_key.replace(/\n/g, '\\n')}"`,
  'GOOGLE_SPREADSHEET_ID=',
  'GOOGLE_SHEET_NAME=',
  'GOOGLE_DATA_SHEET_NAME=dados',
  '',
].join('\n');

writeFileSync(resolve(process.cwd(), '.env.local'), envContent, { mode: 0o600 });

console.log('.env.local criado com sucesso.');
console.log(`Compartilhe a planilha com este e-mail: ${credentials.client_email}`);

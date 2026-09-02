# QR Scanner

Projeto web simples e responsivo para ler QR Codes pelo celular e salvar cada leitura em uma planilha do Google Sheets.

## Como rodar

```bash
npm install
npm run dev
```

Para usar a função serverless localmente como na Vercel, rode:

```bash
npm run vercel-dev
```

## Variáveis de ambiente

Crie as variáveis abaixo na Vercel ou em um arquivo local `.env.local`:

```bash
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SPREADSHEET_ID=
GOOGLE_SHEET_NAME=
GOOGLE_DATA_SHEET_NAME=
```

Na Vercel, configure as cinco variáveis acima em Project Settings > Environment Variables. A planilha do Google Sheets precisa ser compartilhada com o e-mail da service account usando permissão de editor.

## Dados gravados

Cada QR Code lido adiciona uma linha na aba configurada no servidor:

```text
Data | Hora | Nome | Quantidade doada (kg) | Ingresso
```

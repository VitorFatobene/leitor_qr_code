export function normalizeNome(value) {
  return String(value || '').trim().slice(0, 150);
}

export function parseQuantidadeKg(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalizedValue = String(value || '').trim().replace(',', '.');

  if (!/^\d+(\.\d+)?$/.test(normalizedValue)) {
    return null;
  }

  const quantidadeKg = Number(normalizedValue);
  return Number.isFinite(quantidadeKg) ? quantidadeKg : null;
}

export function validateDonationFields({ nome, quantidadeKgInput }) {
  const cleanNome = normalizeNome(nome);
  const quantidadeKg = parseQuantidadeKg(quantidadeKgInput);
  const errors = {};

  if (!cleanNome) {
    errors.nome = 'Informe o nome.';
  }

  if (quantidadeKg === null || quantidadeKg <= 0) {
    errors.quantidadeKg = 'Informe uma quantidade maior que zero.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: {
      nome: cleanNome,
      quantidadeKg,
    },
  };
}

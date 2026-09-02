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

export function validateDonationFields({ quantidadeKgInput }) {
  const quantidadeKg = parseQuantidadeKg(quantidadeKgInput);
  const errors = {};

  if (quantidadeKg === null || quantidadeKg <= 0) {
    errors.quantidadeKg = 'Informe uma quantidade maior que zero.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: {
      quantidadeKg,
    },
  };
}

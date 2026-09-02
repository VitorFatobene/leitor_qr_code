import { forwardRef } from 'react';

const DonationForm = forwardRef(function DonationForm(
  { nome, quantidadeKgInput, errors, onNomeChange, onQuantidadeChange },
  nomeInputRef,
) {
  return (
    <div className="donation-form">
      <label>
        <span>Nome</span>
        <input
          type="text"
          value={nome}
          onChange={(event) => onNomeChange(event.target.value)}
          placeholder="João da Silva"
          maxLength={150}
          autoComplete="name"
          ref={nomeInputRef}
        />
        {errors.nome && <small className="field-error">{errors.nome}</small>}
      </label>

      <label>
        <span>Quantidade doada (kg)</span>
        <input
          type="text"
          value={quantidadeKgInput}
          onChange={(event) => onQuantidadeChange(event.target.value)}
          placeholder="12,5"
          inputMode="decimal"
        />
        {errors.quantidadeKg && <small className="field-error">{errors.quantidadeKg}</small>}
      </label>
    </div>
  );
});

export default DonationForm;

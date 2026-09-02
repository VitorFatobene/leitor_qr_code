import { forwardRef } from 'react';

const DonationForm = forwardRef(function DonationForm(
  { quantidadeKgInput, errors, onQuantidadeChange },
  quantidadeInputRef,
) {
  return (
    <div className="donation-form">
      <label>
        <span>Quantidade doada (kg)</span>
        <input
          type="text"
          value={quantidadeKgInput}
          onChange={(event) => onQuantidadeChange(event.target.value)}
          placeholder="12,5"
          inputMode="decimal"
          ref={quantidadeInputRef}
        />
        {errors.quantidadeKg && <small className="field-error">{errors.quantidadeKg}</small>}
      </label>
    </div>
  );
});

export default DonationForm;

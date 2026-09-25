function ManualRegistrationForm({
  errors,
  isSaving,
  matricula,
  nome,
  onCancel,
  onMatriculaChange,
  onNomeChange,
  onSubmit,
}) {
  return (
    <form className="manual-registration" onSubmit={onSubmit}>
      <h3>Usuário não encontrado digite o nome e matricula manualmente</h3>

      <label>
        <span>Nome</span>
        <input
          type="text"
          value={nome}
          onChange={(event) => onNomeChange(event.target.value)}
          disabled={isSaving}
          maxLength={150}
          required
          autoFocus
        />
        {errors.nome && <small className="field-error">{errors.nome}</small>}
      </label>

      <label>
        <span>Matrícula</span>
        <input
          type="text"
          value={matricula}
          onChange={(event) => onMatriculaChange(event.target.value)}
          disabled={isSaving}
          maxLength={150}
          required
        />
        {errors.matricula && <small className="field-error">{errors.matricula}</small>}
      </label>

      <div className="manual-registration-actions">
        <button type="submit" className="primary-button" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar registro'}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default ManualRegistrationForm;

function ScanResult({ result }) {
  const formattedQuantidade = result.quantidadeKg
    ? new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: 3,
      }).format(result.quantidadeKg)
    : '';

  return (
    <section className={`scan-result scan-result-${result.type}`}>
      <h3>Última leitura</h3>

      <div className="result-row">
        <span>Nome:</span>
        <strong>{result.nome || '-'}</strong>
      </div>

      <div className="result-row">
        <span>Quantidade:</span>
        <strong>{formattedQuantidade ? `${formattedQuantidade} kg` : '-'}</strong>
      </div>

      <div className="result-row">
        <span>Ingresso lido:</span>
        <strong>{result.qrValue || '-'}</strong>
      </div>

      <div className="result-row">
        <span>Status:</span>
        <strong>{result.status}</strong>
      </div>
    </section>
  );
}

export default ScanResult;

import { useState } from 'react';
import Scanner from './components/Scanner.jsx';
import ScanResult from './components/ScanResult.jsx';
import DonationForm from './components/DonationForm.jsx';
import { saveScan } from './services/api.js';
import { validateDonationFields } from './services/donation.js';

const initialResult = {
  qrValue: '',
  nome: '',
  quantidadeKg: null,
  status: 'Aguardando leitura.',
  type: 'idle',
};

function App() {
  const [scanResult, setScanResult] = useState(initialResult);
  const [isSaving, setIsSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [quantidadeKgInput, setQuantidadeKgInput] = useState('');
  const donationValidation = validateDonationFields({ nome, quantidadeKgInput });
  const canStartScanner = donationValidation.isValid;

  async function handleScan(ticketNumber) {
    const currentDonation = validateDonationFields({ nome, quantidadeKgInput });

    if (isSaving || !currentDonation.isValid) {
      setScanResult({
        qrValue: '',
        nome: currentDonation.values.nome,
        quantidadeKg: currentDonation.values.quantidadeKg,
        status: 'Preencha corretamente nome e quantidade doada.',
        type: 'error',
      });
      return false;
    }

    setIsSaving(true);
    setScanResult({
      qrValue: ticketNumber,
      nome: currentDonation.values.nome,
      quantidadeKg: currentDonation.values.quantidadeKg,
      status: 'Enviando para a planilha...',
      type: 'loading',
    });

    try {
      await saveScan({
        nome: currentDonation.values.nome,
        quantidadeKg: currentDonation.values.quantidadeKg,
        qrValue: ticketNumber,
      });

      setScanResult({
        qrValue: ticketNumber,
        nome: currentDonation.values.nome,
        quantidadeKg: currentDonation.values.quantidadeKg,
        status: 'Registro salvo com sucesso.',
        type: 'success',
      });
      return true;
    } catch (error) {
      setScanResult({
        qrValue: ticketNumber,
        nome: currentDonation.values.nome,
        quantidadeKg: currentDonation.values.quantidadeKg,
        status: error.message || 'Erro ao salvar na planilha.',
        type: 'error',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="header-band">
        <div className="content">
          <p className="eyebrow">Leitura mobile-first</p>
          <h1>QR Scanner</h1>
        </div>
      </section>

      <section className="content workflow">
        <section className="panel">
          <div className="section-heading">
            <h2>Scanner</h2>
            <span className={canStartScanner ? 'badge badge-ready' : 'badge'}>
              {canStartScanner ? 'Pronto para leitura' : 'Preencha os dados'}
            </span>
          </div>

          <DonationForm
            nome={nome}
            quantidadeKgInput={quantidadeKgInput}
            errors={donationValidation.errors}
            onNomeChange={setNome}
            onQuantidadeChange={setQuantidadeKgInput}
          />

          <Scanner
            disabled={!canStartScanner || isSaving}
            isSaving={isSaving}
            onInvalidScan={() =>
              setScanResult({
                qrValue: '',
                nome: donationValidation.values.nome,
                quantidadeKg: donationValidation.values.quantidadeKg,
                status: 'QR Code inválido ou não reconhecido.',
                type: 'error',
              })
            }
            onScan={handleScan}
            onPermissionError={() =>
              setScanResult({
                qrValue: scanResult.qrValue,
                nome: scanResult.nome,
                quantidadeKg: scanResult.quantidadeKg,
                status: 'Câmera sem permissão. Libere o acesso e tente novamente.',
                type: 'error',
              })
            }
          />

          <ScanResult result={scanResult} />
        </section>
      </section>
    </main>
  );
}

export default App;

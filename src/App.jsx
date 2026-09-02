import { useCallback, useEffect, useRef, useState } from 'react';
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
  const nomeInputRef = useRef(null);
  const donationFieldsRef = useRef({ nome: '', quantidadeKgInput: '' });
  const isSavingRef = useRef(false);
  const [scanResult, setScanResult] = useState(initialResult);
  const [isSaving, setIsSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [quantidadeKgInput, setQuantidadeKgInput] = useState('');
  const donationValidation = validateDonationFields({ nome, quantidadeKgInput });
  const canStartScanner = donationValidation.isValid;

  useEffect(() => {
    donationFieldsRef.current = { nome, quantidadeKgInput };
  }, [nome, quantidadeKgInput]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const handleScan = useCallback(async (ticketNumber) => {
    const currentDonation = validateDonationFields(donationFieldsRef.current);

    if (isSavingRef.current || !currentDonation.isValid) {
      setScanResult({
        qrValue: '',
        nome: currentDonation.values.nome,
        quantidadeKg: currentDonation.values.quantidadeKg,
        status: 'Preencha nome e quantidade antes de registrar o ingresso.',
        type: 'error',
      });
      return false;
    }

    isSavingRef.current = true;
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
      setNome('');
      setQuantidadeKgInput('');
      donationFieldsRef.current = { nome: '', quantidadeKgInput: '' };
      window.setTimeout(() => nomeInputRef.current?.focus(), 0);
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
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, []);

  const handleInvalidScan = useCallback(() => {
    const currentDonation = validateDonationFields(donationFieldsRef.current);

    setScanResult({
      qrValue: '',
      nome: currentDonation.values.nome,
      quantidadeKg: currentDonation.values.quantidadeKg,
      status: 'QR Code inválido ou não reconhecido.',
      type: 'error',
    });
  }, []);

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
            ref={nomeInputRef}
          />

          <Scanner
            disabled={!canStartScanner || isSaving}
            isSaving={isSaving}
            onInvalidScan={handleInvalidScan}
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

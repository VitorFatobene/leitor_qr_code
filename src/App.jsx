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
  const quantidadeInputRef = useRef(null);
  const donationFieldsRef = useRef({ quantidadeKgInput: '' });
  const isSavingRef = useRef(false);
  const [scanResult, setScanResult] = useState(initialResult);
  const [isSaving, setIsSaving] = useState(false);
  const [quantidadeKgInput, setQuantidadeKgInput] = useState('');
  const donationValidation = validateDonationFields({ quantidadeKgInput });
  const canStartScanner = donationValidation.isValid;

  useEffect(() => {
    donationFieldsRef.current = { quantidadeKgInput };
  }, [quantidadeKgInput]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const handleScan = useCallback(async (ticketNumber) => {
    const currentDonation = validateDonationFields(donationFieldsRef.current);

    if (isSavingRef.current || !currentDonation.isValid) {
      setScanResult({
        qrValue: '',
        nome: '',
        quantidadeKg: currentDonation.values.quantidadeKg,
        status: 'Preencha a quantidade antes de registrar o ingresso.',
        type: 'error',
      });
      return false;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setScanResult({
      qrValue: ticketNumber,
      nome: '',
      quantidadeKg: currentDonation.values.quantidadeKg,
      status: 'Enviando para a planilha...',
      type: 'loading',
    });

    try {
      const savedScan = await saveScan({
        quantidadeKg: currentDonation.values.quantidadeKg,
        qrValue: ticketNumber,
      });

      setScanResult({
        qrValue: ticketNumber,
        nome: savedScan.nome || savedScan.saved?.nome || '',
        quantidadeKg: currentDonation.values.quantidadeKg,
        status: 'Registro salvo com sucesso.',
        type: 'success',
      });
      setQuantidadeKgInput('');
      donationFieldsRef.current = { quantidadeKgInput: '' };
      window.setTimeout(() => quantidadeInputRef.current?.focus(), 0);
      return true;
    } catch (error) {
      setScanResult({
        qrValue: ticketNumber,
        nome: '',
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
      nome: '',
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
            quantidadeKgInput={quantidadeKgInput}
            errors={donationValidation.errors}
            onQuantidadeChange={setQuantidadeKgInput}
            ref={quantidadeInputRef}
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

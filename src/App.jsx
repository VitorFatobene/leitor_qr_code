import { useCallback, useEffect, useRef, useState } from 'react';
import Scanner from './components/Scanner.jsx';
import ScanResult from './components/ScanResult.jsx';
import DonationForm from './components/DonationForm.jsx';
import ManualRegistrationForm from './components/ManualRegistrationForm.jsx';
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
  const manualEntryPendingRef = useRef(false);
  const [scanResult, setScanResult] = useState(initialResult);
  const [isSaving, setIsSaving] = useState(false);
  const [quantidadeKgInput, setQuantidadeKgInput] = useState('');
  const [manualEntry, setManualEntry] = useState(null);
  const [manualNome, setManualNome] = useState('');
  const [manualMatricula, setManualMatricula] = useState('');
  const [manualCurso, setManualCurso] = useState('');
  const [manualErrors, setManualErrors] = useState({});
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

    if (isSavingRef.current || manualEntryPendingRef.current) {
      return false;
    }

    if (!currentDonation.isValid) {
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

      if (savedScan.requiresManualData) {
        const pendingEntry = {
          qrValue: ticketNumber,
          quantidadeKg: currentDonation.values.quantidadeKg,
        };

        manualEntryPendingRef.current = true;
        setManualEntry(pendingEntry);
        setManualErrors({});
        setScanResult({
          qrValue: ticketNumber,
          nome: '',
          quantidadeKg: currentDonation.values.quantidadeKg,
          status: 'Usuário não encontrado. Preencha os dados manualmente.',
          type: 'manual',
        });
        return false;
      }

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

  const clearManualEntry = useCallback(() => {
    manualEntryPendingRef.current = false;
    setManualEntry(null);
    setManualNome('');
    setManualMatricula('');
    setManualCurso('');
    setManualErrors({});
  }, []);

  const handleManualSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!manualEntry || isSavingRef.current) {
      return;
    }

    const nome = manualNome.trim();
    const matricula = manualMatricula.trim();
    const curso = manualCurso.trim();
    const errors = {};

    if (!nome) {
      errors.nome = 'Informe o nome.';
    }

    if (!matricula) {
      errors.matricula = 'Informe a matrícula.';
    }

    if (!curso) {
      errors.curso = 'Informe o curso.';
    }

    if (Object.keys(errors).length > 0) {
      setManualErrors(errors);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setManualErrors({});
    setScanResult({
      qrValue: manualEntry.qrValue,
      nome,
      quantidadeKg: manualEntry.quantidadeKg,
      status: 'Enviando para a planilha...',
      type: 'loading',
    });

    try {
      const savedScan = await saveScan({
        quantidadeKg: manualEntry.quantidadeKg,
        qrValue: manualEntry.qrValue,
        nome,
        matricula,
        curso,
      });

      setScanResult({
        qrValue: manualEntry.qrValue,
        nome: savedScan.nome || savedScan.saved?.nome || nome,
        quantidadeKg: manualEntry.quantidadeKg,
        status: 'Registro salvo com sucesso.',
        type: 'success',
      });
      clearManualEntry();
      setQuantidadeKgInput('');
      donationFieldsRef.current = { quantidadeKgInput: '' };
      window.setTimeout(() => quantidadeInputRef.current?.focus(), 0);
    } catch (error) {
      setScanResult({
        qrValue: manualEntry.qrValue,
        nome,
        quantidadeKg: manualEntry.quantidadeKg,
        status: error.message || 'Erro ao salvar na planilha.',
        type: 'error',
      });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [clearManualEntry, manualCurso, manualEntry, manualMatricula, manualNome]);

  const handleManualCancel = useCallback(() => {
    clearManualEntry();
    setScanResult({
      ...initialResult,
      quantidadeKg: validateDonationFields(donationFieldsRef.current).values.quantidadeKg,
      status: 'Registro manual cancelado. Aguardando nova leitura.',
    });
  }, [clearManualEntry]);

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
            <span className={canStartScanner && !manualEntry ? 'badge badge-ready' : 'badge'}>
              {manualEntry
                ? 'Preenchimento pendente'
                : canStartScanner
                  ? 'Pronto para leitura'
                  : 'Preencha os dados'}
            </span>
          </div>

          <DonationForm
            quantidadeKgInput={quantidadeKgInput}
            errors={donationValidation.errors}
            onQuantidadeChange={setQuantidadeKgInput}
            disabled={Boolean(manualEntry) || isSaving}
            ref={quantidadeInputRef}
          />

          <Scanner
            disabled={!canStartScanner || isSaving || Boolean(manualEntry)}
            isManualEntryPending={Boolean(manualEntry)}
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

          {manualEntry && (
            <ManualRegistrationForm
              nome={manualNome}
              matricula={manualMatricula}
              curso={manualCurso}
              errors={manualErrors}
              isSaving={isSaving}
              onNomeChange={setManualNome}
              onMatriculaChange={setManualMatricula}
              onCursoChange={setManualCurso}
              onSubmit={handleManualSubmit}
              onCancel={handleManualCancel}
            />
          )}

          <ScanResult result={scanResult} />
        </section>
      </section>
    </main>
  );
}

export default App;

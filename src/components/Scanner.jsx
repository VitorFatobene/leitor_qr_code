import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { extrairNumeroIngresso } from '../services/tickets.js';

const READER_ID = 'qr-reader';
const DUPLICATE_DELAY_MS = 3000;

function Scanner({ disabled, isSaving, onInvalidScan, onScan, onPermissionError }) {
  const scannerRef = useRef(null);
  const onInvalidScanRef = useRef(onInvalidScan);
  const onPermissionErrorRef = useRef(onPermissionError);
  const onScanRef = useRef(onScan);
  const lastReadRef = useRef({ value: '', time: 0 });
  const scanLockRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('');

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    onInvalidScanRef.current = onInvalidScan;
    onPermissionErrorRef.current = onPermissionError;
    onScanRef.current = onScan;
  }, [onInvalidScan, onPermissionError, onScan]);

  async function stopScanner() {
    if (!scannerRef.current) {
      setIsRunning(false);
      return;
    }

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.clear();
    } catch (error) {
      console.warn('Erro ao parar scanner:', error);
    } finally {
      scannerRef.current = null;
      scanLockRef.current = false;
      setIsRunning(false);
    }
  }

  async function startScanner() {
    if (disabled || isRunning) {
      return;
    }

    setCameraMessage('Abrindo câmera...');

    try {
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        handleDecodedText,
      );

      setIsRunning(true);
      setCameraMessage('Câmera ativa.');
    } catch (error) {
      console.error(error);
      setCameraMessage('Não foi possível acessar a câmera.');
      onPermissionErrorRef.current();
      await stopScanner();
    }
  }

  async function handleDecodedText(decodedText) {
    const ticketNumber = extrairNumeroIngresso(decodedText);

    if (!ticketNumber) {
      if (scanLockRef.current) {
        return;
      }

      scanLockRef.current = true;
      onInvalidScanRef.current();

      if (scannerRef.current?.isScanning) {
        scannerRef.current.pause(true);
      }

      window.setTimeout(() => {
        scanLockRef.current = false;
        if (scannerRef.current?.isScanning) {
          scannerRef.current.resume();
        }
      }, DUPLICATE_DELAY_MS);

      return;
    }

    const now = Date.now();
    const lastRead = lastReadRef.current;

    if (
      scanLockRef.current ||
      (lastRead.value === ticketNumber && now - lastRead.time < DUPLICATE_DELAY_MS)
    ) {
      return;
    }

    scanLockRef.current = true;
    lastReadRef.current = {
      value: ticketNumber,
      time: now,
    };

    if (scannerRef.current?.isScanning) {
      scannerRef.current.pause(true);
    }

    await onScanRef.current(ticketNumber);

    window.setTimeout(() => {
      scanLockRef.current = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.resume();
      }
    }, DUPLICATE_DELAY_MS);
  }

  return (
    <div className="scanner">
      <div className="scanner-actions">
        <button
          type="button"
          className="primary-button large-button"
          onClick={startScanner}
          disabled={disabled || isRunning || isSaving}
        >
          Iniciar Scanner
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={stopScanner}
          disabled={!isRunning}
        >
          Parar Scanner
        </button>
      </div>

      <div className={isRunning ? 'reader reader-active' : 'reader'}>
        <div id={READER_ID} />
      </div>

      {cameraMessage && <p className="camera-message">{cameraMessage}</p>}
    </div>
  );
}

export default Scanner;

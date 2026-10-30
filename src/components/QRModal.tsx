import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Common';

interface QRModalProps {
  open: boolean;
  onClose: () => void;
  qrToken: string;
  passengerDisplayId: string;
  passengerName: string;
}

export function QRModal({ open, onClose, qrToken, passengerDisplayId, passengerName }: QRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !qrToken) return;
    setLoading(true);
    QRCode.toDataURL(qrToken, {
      width: 320,
      margin: 2,
      color: { dark: '#1e3a8a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        setQrDataUrl(url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, qrToken]);

  return (
    <Modal open={open} onClose={onClose} title="My QR Code">
      <div className="flex flex-col items-center py-4">
        <p className="text-sm text-slate-500 mb-4 text-center">
          Show this QR code to the driver to verify your identity
        </p>

        {loading ? (
          <Spinner size="lg" />
        ) : (
          <div className="p-4 bg-white rounded-2xl border-2 border-blue-100 shadow-sm">
            <img src={qrDataUrl ?? ''} alt="Passenger QR Code" className="w-64 h-64" />
          </div>
        )}

        <div className="mt-5 text-center space-y-1">
          <p className="font-bold text-slate-900">{passengerName}</p>
          <p className="text-sm text-slate-500">Passenger ID: {passengerDisplayId}</p>
        </div>

        <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5">
          <p className="text-xs text-blue-600 text-center">
            This QR code contains only your secure passenger token — no personal information is stored in it.
          </p>
        </div>
      </div>
    </Modal>
  );
}

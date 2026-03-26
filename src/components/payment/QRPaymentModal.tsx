import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { paymentService } from '@/services/paymentService';

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  reference: string;
}

export const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  reference,
}) => {
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      generateQR();
    }
  }, [isOpen]);

  const generateQR = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await paymentService.generateQR({
        amount,
        reference,
      });
      
      if (response.success) {
        setQrPayload(response.qrPayload);
      } else {
        setError('Failed to generate QR code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Payment QR</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-3xl font-bold mb-4">₱{amount.toLocaleString()}</p>
          
          {loading && (
            <div className="py-8">
              <p className="text-gray-500">Generating QR Code...</p>
            </div>
          )}
          
          {error && (
            <div className="py-8">
              <p className="text-red-500 mb-2">{error}</p>
              <button onClick={generateQR} className="px-4 py-2 bg-blue-500 text-white rounded">
                Try Again
              </button>
            </div>
          )}
          
          {qrPayload && !loading && (
            <>
              <div className="flex justify-center my-4">
                <QRCodeSVG value={qrPayload} size={200} />
              </div>
              <p className="text-sm text-gray-500 mt-2">Scan to Pay</p>
              <p className="text-xs text-gray-400 mt-1 font-mono">{reference}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

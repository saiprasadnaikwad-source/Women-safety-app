import React, { useState, useRef } from 'react';
import { Camera, CheckCircle, AlertCircle, RefreshCw, Car, X } from 'lucide-react';
import axios from 'axios';
import { getApiBaseUrl } from '../services/apiConfig';

interface VehicleVerificationProps {
  onVerified: (plateNumber: string, vehicleId: string) => void;
  onSkip: () => void;
}

type VerifyStatus = 'idle' | 'capturing' | 'scanning' | 'success' | 'error' | 'offline';

export const VehicleVerificationScreen: React.FC<VehicleVerificationProps> = ({ onVerified, onSkip }) => {
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [plateNumber, setPlateNumber] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualPlate, setManualPlate] = useState('');
  const [showManual, setShowManual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setStatus('scanning');
    setErrorMsg('');
    scanPlate(file);
  };

  const scanPlate = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const baseUrl = getApiBaseUrl();
      const res = await axios.post(`${baseUrl}/api/ocr/verify-plate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20000
      });

      if (res.data.success) {
        setPlateNumber(res.data.plateNumber);
        setConfidence(Math.round((res.data.confidence || 0) * 100));
        setStatus('success');
      } else {
        setErrorMsg(res.data.message || 'Could not detect plate.');
        setStatus('error');
      }
    } catch (err: any) {
      if (err.response?.status === 503) {
        setStatus('offline');
        setErrorMsg('OCR model is not running. Enter plate manually or skip.');
      } else {
        setStatus('error');
        setErrorMsg('Scan failed. Try again or enter plate manually.');
      }
    }
  };

  const handleConfirm = () => {
    const plate = plateNumber.trim().toUpperCase();
    if (!plate) return;
    const vehicleId = `VEH-${plate.replace(/\s/g, '')}`;
    onVerified(plate, vehicleId);
  };

  const handleManualSubmit = () => {
    const plate = manualPlate.trim().toUpperCase();
    if (!plate) return;
    const vehicleId = `VEH-${plate.replace(/\s/g, '')}`;
    onVerified(plate, vehicleId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.5rem', borderRadius: '10px' }}>
            <Car size={22} />
          </div>
          <div>
            <h3 className="card-title" style={{ marginBottom: 0 }}>Vehicle Verification</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Scan number plate for journey safety record</p>
          </div>
        </div>

        {/* Camera Capture Area */}
        <div
          onClick={() => status !== 'scanning' && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${status === 'success' ? '#16a34a' : '#cbd5e1'}`,
            borderRadius: '14px',
            padding: '1.5rem',
            textAlign: 'center',
            cursor: status === 'scanning' ? 'default' : 'pointer',
            backgroundColor: '#f8fafc',
            marginBottom: '1rem',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
        >
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Captured plate"
              style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
            />
          )}

          {status === 'idle' && !previewUrl && (
            <>
              <Camera size={36} color="#94a3b8" />
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Tap to capture number plate</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Uses your phone camera</p>
            </>
          )}

          {status === 'scanning' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Scanning plate...</span>
            </div>
          )}

          {status === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a' }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Plate detected!</span>
            </div>
          )}

          {(status === 'error' || status === 'offline') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
              <AlertCircle size={20} />
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Hidden file input — opens camera on mobile */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          style={{ display: 'none' }}
        />

        {/* Success Result */}
        {status === 'success' && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Detected Plate Number</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
              {plateNumber}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
              Confidence: {confidence}%
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button className="btn-large btn-primary" style={{ flex: 1 }} onClick={handleConfirm}>
                <CheckCircle size={16} /> Confirm & Continue
              </button>
              <button
                onClick={() => { setStatus('idle'); setPreviewUrl(null); setPlateNumber(''); }}
                style={{ padding: '0.6rem', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Manual Entry Toggle */}
        {(status === 'error' || status === 'offline' || status === 'idle') && (
          <button
            onClick={() => setShowManual(!showManual)}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: '0.25rem 0', marginBottom: '0.5rem' }}
          >
            {showManual ? '▲ Hide manual entry' : '▼ Enter plate number manually'}
          </button>
        )}

        {showManual && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={manualPlate}
              onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
              placeholder="e.g. MH12AB1234"
              style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em' }}
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualPlate.trim()}
              className="btn-large btn-primary"
              style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}
            >
              Use This
            </button>
          </div>
        )}

        {/* Skip option */}
        <button
          onClick={onSkip}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Skip — Continue Without Plate Scan
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Smartphone, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

interface UpiFormProps {
  amountUnits: number;
  isLoading: boolean;
  onSubmit: (vpa: string) => void;
}

export const UpiPaymentForm: React.FC<UpiFormProps> = ({
  amountUnits,
  isLoading,
  onSubmit,
}) => {
  const [vpa, setVpa] = useState('customer@okaxis');
  const [mode, setMode] = useState<'vpa' | 'qr'>('vpa');

  const popularHandles = ['@okaxis', '@okhdfcbank', '@oksbi', '@paytm', '@ybl'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(vpa);
  };

  return (
    <div className="space-y-4">
      <div className="flex rounded border border-mantu-border p-1 bg-slate-50 text-xs">
        <button
          type="button"
          onClick={() => setMode('vpa')}
          className={`flex-1 py-1.5 font-medium rounded transition-colors ${
            mode === 'vpa'
              ? 'bg-white text-mantu-text shadow-xs'
              : 'text-mantu-muted hover:text-mantu-text'
          }`}
        >
          UPI ID / VPA
        </button>
        <button
          type="button"
          onClick={() => setMode('qr')}
          className={`flex-1 py-1.5 font-medium rounded transition-colors ${
            mode === 'qr'
              ? 'bg-white text-mantu-text shadow-xs'
              : 'text-mantu-muted hover:text-mantu-text'
          }`}
        >
          Scan Dynamic QR
        </button>
      </div>

      {mode === 'vpa' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mantu-text mb-1">
              Virtual Payment Address (VPA)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="username@okhdfcbank"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
              />
              <Smartphone className="w-4 h-4 text-mantu-muted absolute left-3 top-2.5" />
            </div>
            <p className="text-[10px] text-mantu-muted mt-1">
              You will receive a payment request on your UPI mobile app.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {popularHandles.map((handle) => (
              <button
                key={handle}
                type="button"
                onClick={() => {
                  const prefix = vpa.split('@')[0] || 'customer';
                  setVpa(prefix + handle);
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                {handle}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5"
              leftIcon={<Lock className="w-3.5 h-3.5" />}
            >
              Pay ₹{(amountUnits / 100).toFixed(2)} via UPI
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 space-y-3">
          <div className="w-40 h-40 bg-white border border-mantu-border rounded mx-auto p-2 shadow-xs flex items-center justify-center">
            {/* Dynamic QR SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
              <rect width="100" height="100" fill="white" />
              <path
                d="M10 10h30v30h-30z M15 15h20v20h-20z M20 20h10v10h-10z M60 10h30v30h-30z M65 15h20v20h-20z M70 20h10v10h-10z M10 60h30v30h-30z M15 65h20v20h-20z M20 70h10v10h-10z M45 10h10v20h-10z M45 45h20v10h-20z M70 45h20v20h-20z M55 65h15v10h-15z M75 75h15v15h-15z M45 80h10v10h-10z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-mantu-text">Scan with any UPI App</p>
            <p className="text-[10px] text-mantu-muted">Google Pay, PhonePe, Paytm, BHIM</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSubmit('qr_scanned@okhdfc')}
            isLoading={isLoading}
          >
            Simulate QR Scan Completed
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-mantu-muted text-center pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Instant NPCI UPI Switch Routing</span>
      </div>
    </div>
  );
};

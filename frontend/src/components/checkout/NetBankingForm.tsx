import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

interface NetBankingProps {
  amountUnits: number;
  isLoading: boolean;
  onSubmit: (bankCode: string) => void;
}

export const NetBankingForm: React.FC<NetBankingProps> = ({
  amountUnits,
  isLoading,
  onSubmit,
}) => {
  const [selectedBank, setSelectedBank] = useState('HDFC');

  const popularBanks = [
    { code: 'HDFC', name: 'HDFC Bank', logoText: 'HDFC' },
    { code: 'ICICI', name: 'ICICI Bank', logoText: 'ICICI' },
    { code: 'SBI', name: 'State Bank of India', logoText: 'SBI' },
    { code: 'AXIS', name: 'Axis Bank', logoText: 'AXIS' },
    { code: 'KOTAK', name: 'Kotak Mahindra', logoText: 'KOTAK' },
    { code: 'PNB', name: 'Punjab National Bank', logoText: 'PNB' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedBank);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-mantu-text mb-2">
          Select Bank
        </label>
        <div className="grid grid-cols-2 gap-2">
          {popularBanks.map((b) => (
            <button
              key={b.code}
              type="button"
              onClick={() => setSelectedBank(b.code)}
              className={`p-2.5 rounded border text-left transition-all flex items-center gap-2.5 ${
                selectedBank === b.code
                  ? 'border-mantu-accent bg-blue-50/50 ring-1 ring-mantu-accent'
                  : 'border-mantu-border bg-white hover:bg-slate-50'
              }`}
            >
              <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700 font-mono">
                {b.logoText}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-mantu-text truncate">
                  {b.name}
                </div>
                <div className="text-[10px] text-mantu-muted font-mono">{b.code} Direct</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full py-2.5"
          leftIcon={<Lock className="w-3.5 h-3.5" />}
        >
          Pay ₹{(amountUnits / 100).toFixed(2)} via {selectedBank}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-mantu-muted text-center pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Direct Bank Gateway Integration</span>
      </div>
    </form>
  );
};

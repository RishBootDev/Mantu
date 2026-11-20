import React, { useState } from 'react';
import { CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

interface CardFormProps {
  amountUnits: number;
  isLoading: boolean;
  onSubmit: (cardData: {
    pan: string;
    cvv: string;
    expiryMonth: number;
    expiryYear: number;
    cardHolderName: string;
  }) => void;
}

export const CardPaymentForm: React.FC<CardFormProps> = ({
  amountUnits,
  isLoading,
  onSubmit,
}) => {
  const [pan, setPan] = useState('');
  const [cardHolder, setCardHolder] = useState('Jane Doe');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('');

  const formatCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 16);
    return clean.replace(/(\d{4})/g, '$1 ').trim();
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (clean.startsWith('5')) return 'MASTERCARD';
    if (clean.startsWith('6')) return 'RUPAY';
    if (clean.startsWith('3')) return 'AMEX';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPan = pan.replace(/\s+/g, '');
    const [month, year] = expiry.split('/').map((s) => parseInt(s.trim(), 10));
    onSubmit({
      pan: cleanPan,
      cvv,
      expiryMonth: month || 12,
      expiryYear: 2000 + (year || 28),
      cardHolderName: cardHolder,
    });
  };

  const brand = getCardBrand(pan);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-mantu-text mb-1">
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            required
            maxLength={19}
            placeholder="4111 1111 1111 1111"
            value={pan}
            onChange={(e) => setPan(formatCardNumber(e.target.value))}
            className="w-full pl-9 pr-14 py-2 text-xs font-mono border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
          />
          <CreditCard className="w-4 h-4 text-mantu-muted absolute left-3 top-2.5" />
          {brand && (
            <span className="absolute right-3 top-2 text-[10px] font-bold font-mono text-mantu-accent px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded">
              {brand}
            </span>
          )}
        </div>
        <p className="text-[10px] text-mantu-muted mt-1">
          Card details are vaulted directly with PCI-DSS compliant tokenization.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-mantu-text mb-1">
            Expiry (MM/YY)
          </label>
          <input
            type="text"
            required
            maxLength={5}
            placeholder="12/28"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-mantu-text mb-1">
            CVV / CVC
          </label>
          <input
            type="password"
            required
            maxLength={4}
            placeholder="123"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-2 text-xs font-mono border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-mantu-text mb-1">
          Cardholder Name
        </label>
        <input
          type="text"
          required
          placeholder="Jane Doe"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full py-2.5"
          leftIcon={<Lock className="w-3.5 h-3.5" />}
        >
          Pay ₹{(amountUnits / 100).toFixed(2)}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-mantu-muted text-center pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>256-Bit Encrypted • PCI Vault Tokenized</span>
      </div>
    </form>
  );
};

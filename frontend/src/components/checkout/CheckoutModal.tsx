import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { CardPaymentForm } from './CardPaymentForm';
import { UpiPaymentForm } from './UpiPaymentForm';
import { NetBankingForm } from './NetBankingForm';
import { paymentsApi } from '../../api/payments';
import { PaymentResponse, PaymentMethod } from '../../types/api';
import { Button } from '../common/Button';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  amountUnits?: number;
  merchantName?: string;
  onPaymentSuccess?: (payment: PaymentResponse) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  orderId = 'ord_demo_' + Math.random().toString(36).substring(2, 8),
  amountUnits = 50000,
  merchantName = 'Acme Retail Store',
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentMethod>('CARD');
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCardSubmit = async (cardData: {
    pan: string;
    cvv: string;
    expiryMonth: number;
    expiryYear: number;
    cardHolderName: string;
  }) => {
    try {
      setStatus('PROCESSING');
      setErrorMessage(null);

      // Step 1: Client-Side Vault Tokenization (PCI Compliance)
      const vaultToken = await paymentsApi.tokenizeCard(cardData);

      // Step 2: Payment Initiation with ML Screening
      const payment = await paymentsApi.initiate({
        orderId,
        method: 'CARD',
        methodDetails: {
          token: vaultToken.token,
          brand: vaultToken.brand,
          lastFour: vaultToken.lastFour,
        },
      });

      // Handle Result
      if (payment.status === 'CAPTURED') {
        setPaymentResult(payment);
        setStatus('SUCCESS');
        onPaymentSuccess?.(payment);
      } else {
        setPaymentResult(payment);
        setErrorMessage(
          payment.errorDescription || 'Transaction blocked by gateway risk policies.'
        );
        setStatus('FAILED');
      }
    } catch (err: any) {
      setStatus('FAILED');
      setErrorMessage(err.response?.data?.errorDescription || 'Payment execution failed.');
    }
  };

  const handleUpiSubmit = async (vpa: string) => {
    try {
      setStatus('PROCESSING');
      setErrorMessage(null);

      const payment = await paymentsApi.initiate({
        orderId,
        method: 'UPI',
        methodDetails: { vpa },
      });

      if (payment.status === 'CAPTURED') {
        setPaymentResult(payment);
        setStatus('SUCCESS');
        onPaymentSuccess?.(payment);
      } else {
        setPaymentResult(payment);
        setErrorMessage(
          payment.errorDescription || 'UPI payment declined by risk screening.'
        );
        setStatus('FAILED');
      }
    } catch (err: any) {
      setStatus('FAILED');
      setErrorMessage(err.response?.data?.errorDescription || 'UPI payment failed.');
    }
  };

  const handleNetBankingSubmit = async (bank: string) => {
    try {
      setStatus('PROCESSING');
      setErrorMessage(null);

      const payment = await paymentsApi.initiate({
        orderId,
        method: 'NETBANKING',
        methodDetails: { bank },
      });

      if (payment.status === 'CAPTURED') {
        setPaymentResult(payment);
        setStatus('SUCCESS');
        onPaymentSuccess?.(payment);
      } else {
        setPaymentResult(payment);
        setErrorMessage(payment.errorDescription || 'Bank authorization failed.');
        setStatus('FAILED');
      }
    } catch (err: any) {
      setStatus('FAILED');
      setErrorMessage(err.response?.data?.errorDescription || 'NetBanking transaction failed.');
    }
  };

  const resetModal = () => {
    setStatus('IDLE');
    setPaymentResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => status !== 'PROCESSING' && onClose()}
      />

      {/* Checkout Window */}
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-mantu-border z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-mantu-accent flex items-center justify-center font-bold text-white text-base">
              M
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight">{merchantName}</h3>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">Order: {orderId}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-300 block">
              Amount Due
            </span>
            <span className="text-base font-bold font-mono text-white">
              ₹{(amountUnits / 100).toFixed(2)}
            </span>
          </div>
          {status !== 'PROCESSING' && (
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content body */}
        <div className="p-6">
          {status === 'PROCESSING' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-mantu-accent mx-auto" />
              <div>
                <h4 className="text-sm font-semibold text-mantu-text">
                  Contacting Gateway & ML Smart Switch...
                </h4>
                <p className="text-xs text-mantu-muted mt-1">
                  Evaluating fraud parameters & securing banking session. Do not refresh.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 text-slate-600 text-xs font-mono">
                <Lock className="w-3 h-3 text-emerald-600" />
                End-to-End Encrypted Handshake
              </div>
            </div>
          )}

          {status === 'SUCCESS' && paymentResult && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-950">Payment Successful!</h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Amount ₹{(paymentResult.amount.amountUnits / 100).toFixed(2)} captured successfully.
                </p>
              </div>

              <div className="bg-slate-50 border border-mantu-border rounded p-3 text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-mantu-muted">Payment ID:</span>
                  <span className="font-mono font-medium text-mantu-text">{paymentResult.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mantu-muted">Order ID:</span>
                  <span className="font-mono text-mantu-muted">{paymentResult.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mantu-muted">Gateway Route:</span>
                  <span className="font-mono text-mantu-muted">{paymentResult.selectedRouteId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mantu-muted">Timestamp:</span>
                  <span className="font-mono text-mantu-muted">
                    {new Date(paymentResult.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
                  Done
                </Button>
                <Button variant="primary" size="md" className="flex-1" onClick={resetModal}>
                  Make Another Test
                </Button>
              </div>
            </div>
          )}

          {status === 'FAILED' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-rose-950">Payment Declined</h4>
                <p className="text-xs text-rose-800 mt-1 max-w-sm mx-auto">
                  {errorMessage || 'Payment was declined by the bank or gateway risk policy.'}
                </p>
              </div>

              {paymentResult?.errorCode && (
                <div className="inline-block px-3 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs font-mono font-semibold">
                  Error Code: {paymentResult.errorCode}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={resetModal}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  Try Another Method
                </Button>
              </div>
            </div>
          )}

          {status === 'IDLE' && (
            <div>
              {/* Payment Method Selector Tabs */}
              <div className="flex border-b border-mantu-border mb-5">
                <button
                  onClick={() => setActiveTab('CARD')}
                  className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'CARD'
                      ? 'border-mantu-accent text-mantu-accent font-semibold'
                      : 'border-transparent text-mantu-muted hover:text-mantu-text'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Card (Vault)
                </button>
                <button
                  onClick={() => setActiveTab('UPI')}
                  className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'UPI'
                      ? 'border-mantu-accent text-mantu-accent font-semibold'
                      : 'border-transparent text-mantu-muted hover:text-mantu-text'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  UPI / QR
                </button>
                <button
                  onClick={() => setActiveTab('NETBANKING')}
                  className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'NETBANKING'
                      ? 'border-mantu-accent text-mantu-accent font-semibold'
                      : 'border-transparent text-mantu-muted hover:text-mantu-text'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  NetBanking
                </button>
              </div>

              {/* Tab Form Content */}
              {activeTab === 'CARD' && (
                <CardPaymentForm
                  amountUnits={amountUnits}
                  isLoading={false}
                  onSubmit={handleCardSubmit}
                />
              )}
              {activeTab === 'UPI' && (
                <UpiPaymentForm
                  amountUnits={amountUnits}
                  isLoading={false}
                  onSubmit={handleUpiSubmit}
                />
              )}
              {activeTab === 'NETBANKING' && (
                <NetBankingForm
                  amountUnits={amountUnits}
                  isLoading={false}
                  onSubmit={handleNetBankingSubmit}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

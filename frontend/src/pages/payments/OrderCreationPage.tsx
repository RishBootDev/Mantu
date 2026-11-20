import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CheckoutModal } from '../../components/checkout/CheckoutModal';
import { ordersApi } from '../../api/orders';
import { useToast } from '../../components/common/Toast';

export const OrderCreationPage: React.FC = () => {
  const [amountRupees, setAmountRupees] = useState('499.00');
  const [customerName, setCustomerName] = useState('Alex Mercer');
  const [customerEmail, setCustomerEmail] = useState('alex.mercer@gmail.com');
  const [productNote, setProductNote] = useState('Annual Cloud Hosting Plan');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const [simulateFraud, setSimulateFraud] = useState(false);

  const { showToast } = useToast();

  const handleCreateOrderAndOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const units = Math.round(parseFloat(amountRupees) * 100);
      const order = await ordersApi.create({
        amount: {
          amountUnits: units,
          currency: 'INR',
        },
        receipt: `rcpt_${Date.now()}`,
        notes: {
          product: productNote,
          simulateFraud: simulateFraud ? 'true' : 'false',
        },
        customer: {
          name: customerName,
          email: customerEmail,
        },
      });

      setActiveOrderId(order.id);
      setIsModalOpen(true);
      showToast(`Order created: ${order.id}`, 'info');
    } catch (err: any) {
      showToast('Failed to create order', 'error');
    }
  };

  const amountUnits = Math.round((parseFloat(amountRupees) || 0) * 100);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-mantu-text">Checkout Modal Simulator</h2>
        <p className="text-xs text-mantu-muted mt-0.5">
          Test the embeddable customer payment experience with Card Vault tokenization, UPI switches, and ML fraud screening.
        </p>
      </div>

      <Card title="Initiate New Order" subtitle="Configures POST /v1/orders then launches modal">
        <form onSubmit={handleCreateOrderAndOpen} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mantu-text mb-1">
              Order Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono font-bold text-mantu-muted">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs font-mono font-semibold border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mantu-text mb-1">
                Shopper Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mantu-text mb-1">
                Shopper Email
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-mantu-text mb-1">
              Item / Description Note
            </label>
            <input
              type="text"
              value={productNote}
              onChange={(e) => setProductNote(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
            />
          </div>

          {/* Test Flags */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateFraud}
                onChange={(e) => setSimulateFraud(e.target.checked)}
                className="mt-0.5 rounded text-mantu-accent focus:ring-mantu-accent"
              />
              <div>
                <span className="text-xs font-semibold text-mantu-text block">
                  Simulate High-Risk ML Fraud Alert
                </span>
                <span className="text-[11px] text-mantu-muted leading-relaxed block">
                  Causes the ML inference engine to reject the transaction with <code className="font-mono text-rose-700 bg-rose-50 px-1 py-0.5 rounded">FRAUD_HIGH_RISK</code>.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              leftIcon={<ShoppingCart className="w-4 h-4" />}
            >
              Open Mantu Checkout Modal (₹{parseFloat(amountRupees || '0').toFixed(2)})
            </Button>
          </div>
        </form>
      </Card>

      {/* The Embeddable Checkout Modal */}
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={activeOrderId}
        amountUnits={amountUnits}
        onPaymentSuccess={(p) => {
          showToast(`Payment ${p.id} captured!`, 'success');
        }}
      />
    </div>
  );
};

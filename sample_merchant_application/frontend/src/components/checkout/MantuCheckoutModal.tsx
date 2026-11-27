import React, { useEffect } from "react";
import "./checkout.css";
import type { MantuCheckoutOptions } from "./checkoutTypes";
import { useCheckoutFlow } from "./hooks/useCheckoutFlow";
import { MerchantSummary } from "./MerchantSummary";
import { PaymentMethodNavigation } from "./PaymentMethodNavigation";
import { RecommendedPayment } from "./RecommendedPayment";
import { UpiPayment } from "./UpiPayment";
import { CardPayment } from "./CardPayment";
import { NetBankingPayment } from "./NetBankingPayment";
import { WalletPayment } from "./WalletPayment";
import { EmiPayment } from "./EmiPayment";
import { PaymentProcessing } from "./PaymentProcessing";
import { PaymentSuccess } from "./PaymentSuccess";
import { PaymentFailure } from "./PaymentFailure";
import { PaymentPending } from "./PaymentPending";

export type { MantuCheckoutOptions };

interface Props {
  options: MantuCheckoutOptions;
  isOpen: boolean;
  onClose: () => void;
}

export const MantuCheckoutModal: React.FC<Props> = ({ options, isOpen, onClose }) => {
  const flow = useCheckoutFlow(options, isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        flow.handleDismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, flow.handleDismiss]);

  if (!isOpen) return null;

  const currency = options.currency || "INR";
  const merchantName = options.name || "Deskwell";

  return (
    <div
      className="mc-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Mantu Checkout for ${merchantName}`}
    >
      <div className="mc-modal">
        <MerchantSummary
          options={options}
          onCopyOrderId={(id) => flow.copyText(id, "Order ID")}
        />

        <div className="mc-right">
          <div className="mc-right-header">
            <div>
              <div className="mc-right-title">
                {flow.status === "INPUT"
                  ? "Select a payment method"
                  : flow.status === "PROCESSING"
                    ? "Authorizing payment"
                    : flow.status === "SUCCESS"
                      ? "Payment complete"
                      : flow.status === "PENDING"
                        ? "Confirmation pending"
                        : "Payment unsuccessful"}
              </div>
            </div>

            <button
              type="button"
              className="mc-close-btn"
              onClick={flow.handleDismiss}
              disabled={flow.status === "PROCESSING"}
              aria-label="Close checkout"
            >
              ✕
            </button>
          </div>

          {flow.status === "PROCESSING" ? (
            <PaymentProcessing message={flow.statusMessage} />
          ) : flow.status === "SUCCESS" ? (
            <PaymentSuccess
              merchantName={merchantName}
              amount={options.amount}
              currency={currency}
              paymentId={flow.createdPaymentId}
              orderId={options.order_id}
              methodLabel={flow.lastMethodLabel}
              timestamp={flow.completedAt}
              onReturnToMerchant={flow.finishAndReturn}
            />
          ) : flow.status === "FAILED" ? (
            <PaymentFailure
              amount={options.amount}
              currency={currency}
              orderId={options.order_id}
              reason={flow.errorMessage}
              onRetry={flow.retryPayment}
              onSwitchMethod={flow.switchPaymentMethod}
            />
          ) : flow.status === "PENDING" ? (
            <PaymentPending
              paymentId={flow.createdPaymentId}
              orderId={options.order_id}
              onCheckStatus={flow.checkPendingStatus}
              onViewOrder={flow.finishAndReturn}
            />
          ) : (
            <div className="mc-workspace">
              <PaymentMethodNavigation active={flow.navMethod} onSelect={flow.selectNavMethod} />

              {flow.navMethod === "RECOMMENDED" && (
                <RecommendedPayment
                  amount={options.amount}
                  currency={currency}
                  onPayQuickQr={() => flow.executePayment("UPI", "QR")}
                  onSelectMethod={flow.selectNavMethod}
                  onPayCardPreset={(m) => flow.executePayment(m)}
                />
              )}

              {flow.navMethod === "UPI" && (
                <UpiPayment
                  amount={options.amount}
                  currency={currency}
                  upiMode={flow.upiMode}
                  onChangeMode={flow.setUpiMode}
                  selectedApp={flow.selectedUpiApp}
                  onSelectApp={flow.setSelectedUpiApp}
                  vpa={flow.vpa}
                  onChangeVpa={flow.handleVpaChange}
                  verifyingVpa={flow.verifyingVpa}
                  vpaVerifiedName={flow.vpaVerifiedName}
                  onVerifyVpa={flow.handleVerifyVpa}
                  onCopyVpa={() => flow.copyText(flow.vpa.trim(), "UPI ID")}
                  qrTimer={flow.qrTimer}
                  errorMessage={flow.errorMessage}
                  onPay={() => flow.executePayment("UPI")}
                />
              )}

              {flow.navMethod === "CARD" && (
                <CardPayment
                  amount={options.amount}
                  currency={currency}
                  pan={flow.cardPan}
                  onChangePan={flow.setCardPan}
                  expiry={flow.cardExpiry}
                  onChangeExpiry={flow.setCardExpiry}
                  cvv={flow.cardCvv}
                  onChangeCvv={flow.setCardCvv}
                  holder={flow.cardHolder}
                  onChangeHolder={flow.setCardHolder}
                  saveCard={flow.saveCard}
                  onChangeSaveCard={flow.setSaveCard}
                  errorMessage={flow.errorMessage}
                  onPay={() => flow.executePayment("CARD")}
                />
              )}

              {flow.navMethod === "NETBANKING" && (
                <NetBankingPayment
                  amount={options.amount}
                  currency={currency}
                  selectedBank={flow.selectedBank}
                  onSelectBank={flow.setSelectedBank}
                  bankSearch={flow.bankSearch}
                  onChangeSearch={flow.setBankSearch}
                  errorMessage={flow.errorMessage}
                  onPay={() => flow.executePayment("NETBANKING")}
                />
              )}

              {flow.navMethod === "WALLET" && (
                <WalletPayment
                  amount={options.amount}
                  currency={currency}
                  selectedWallet={flow.selectedWallet}
                  onSelectWallet={flow.setSelectedWallet}
                  errorMessage={flow.errorMessage}
                  onPay={() => flow.executePayment("WALLET")}
                />
              )}

              {flow.navMethod === "EMI" && (
                <EmiPayment
                  amount={options.amount}
                  currency={currency}
                  selectedProvider={flow.selectedEmiProvider}
                  onSelectProvider={flow.setSelectedEmiProvider}
                  selectedTenure={flow.selectedEmiTenure}
                  onSelectTenure={flow.setSelectedEmiTenure}
                  errorMessage={flow.errorMessage}
                  onPay={() => flow.executePayment("EMI")}
                />
              )}
            </div>
          )}
        </div>

        {flow.toast && (
          <div className="mc-toast" role="status" aria-live="polite">
            {flow.toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

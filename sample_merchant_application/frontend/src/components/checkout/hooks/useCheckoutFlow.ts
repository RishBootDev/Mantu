import { useCallback, useEffect, useRef, useState } from "react";
import { isPendingStatus, isSuccessStatus } from "../../../format";
import type { Order, PayRequest } from "../../../types";
import type {
  CheckoutNavMethod,
  CheckoutScreenStatus,
  MantuCheckoutOptions,
  OperationalMethod,
  ToastNotice,
} from "../checkoutTypes";
import {
  formatCardNumber,
  formatExpiryInput,
  generateDemoSignature,
  validateCardForm,
  validateUpiVpa,
} from "../checkoutUtils";

function getOrCreateDeviceId(): string {
  const key = "mantu_device_id";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const generated = `web_${crypto.randomUUID()}`;
    window.localStorage.setItem(key, generated);
    return generated;
  } catch {
    return "web_session_device";
  }
}

export function useCheckoutFlow(options: MantuCheckoutOptions, isOpen: boolean, onClose: () => void) {
  const [navMethod, setNavMethod] = useState<CheckoutNavMethod>("RECOMMENDED");
  const [status, setStatus] = useState<CheckoutScreenStatus>("INPUT");
  const [statusMessage, setStatusMessage] = useState("Connecting to Mantu Gateway…");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdPaymentId, setCreatedPaymentId] = useState("");
  const [lastMethodLabel, setLastMethodLabel] = useState("UPI");
  const [completedAt] = useState(() => new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }));
  const [latestOrder, setLatestOrder] = useState<Order | null>(options.order ?? null);
  const [toast, setToast] = useState<ToastNotice | null>(null);

  const [upiMode, setUpiMode] = useState<"QR" | "VPA">("QR");
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>("gpay");
  const [vpa, setVpa] = useState("asha@upi");
  const [verifyingVpa, setVerifyingVpa] = useState(false);
  const [vpaVerifiedName, setVpaVerifiedName] = useState<string | null>(null);
  const [qrTimer, setQrTimer] = useState(899);

  const [cardPan, setCardPan] = useState("4111 1111 1111 1111");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [cardHolder, setCardHolder] = useState(options.prefill?.name || "Asha Sharma");
  const [saveCard, setSaveCard] = useState(false);

  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [bankSearch, setBankSearch] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("paytm_w");
  const [selectedEmiProvider, setSelectedEmiProvider] = useState("HDFC");
  const [selectedEmiTenure, setSelectedEmiTenure] = useState(6);

  const inFlightRef = useRef(false);
  const toastCounterRef = useRef(0);

  const showToast = useCallback((message: string, tone: ToastNotice["tone"] = "info") => {
    const id = ++toastCounterRef.current;
    setToast({ id, message, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 2400);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLatestOrder(options.order ?? null);
  }, [isOpen, options.order]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 899));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  const selectNavMethod = useCallback((method: CheckoutNavMethod) => {
    setNavMethod(method);
    setErrorMessage(null);
  }, []);

  const handleVpaChange = useCallback((next: string) => {
    setVpa(next);
    setVpaVerifiedName(null);
    setErrorMessage(null);
  }, []);

  const handleVerifyVpa = useCallback(async () => {
    const err = validateUpiVpa(vpa);
    if (err) {
      setErrorMessage(err);
      return;
    }
    setErrorMessage(null);
    setVerifyingVpa(true);
    await new Promise((r) => setTimeout(r, 450));
    const handle = vpa.trim().split("@")[0] || "Customer";
    const formatted = handle.charAt(0).toUpperCase() + handle.slice(1).replace(/[._]/g, " ");
    setVpaVerifiedName(formatted);
    setVerifyingVpa(false);
    showToast("UPI ID verified", "success");
  }, [vpa, showToast]);

  const copyText = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied`, "success");
      } catch {
        showToast(`Could not copy ${label.toLowerCase()}`, "error");
      }
    },
    [showToast],
  );

  const applyOrderOutcome = useCallback(
    (updatedOrder: Order, methodLabel: string) => {
      setLatestOrder(updatedOrder);
      const latestStatus = updatedOrder.latest_payment?.status || "";
      const payId = updatedOrder.latest_payment?.mantu_payment_id || updatedOrder.id;
      setCreatedPaymentId(payId);
      setLastMethodLabel(methodLabel);

      if (
        updatedOrder.status === "PAYMENT_FAILED" ||
        ["FAILED", "CANCELLED", "AUTH_EXPIRED"].includes(latestStatus)
      ) {
        onClose();
        options.onComplete?.(updatedOrder);
        return;
      }

      if (updatedOrder.status === "PAID" || isSuccessStatus(latestStatus)) {
        setStatus("SUCCESS");
        setStatusMessage("Payment authorized successfully!");
        window.setTimeout(() => {
          onClose();
          options.onComplete?.(updatedOrder);
        }, 2200);
        return;
      }

      setStatus("PENDING");
    },
    [onClose, options],
  );

  const executePayment = useCallback(
    async (method: OperationalMethod, overrideUpiMode?: "QR" | "VPA") => {
      if (inFlightRef.current) return;
      setErrorMessage(null);

      const effectiveUpiMode = overrideUpiMode ?? upiMode;
      const methodLabel =
        method === "UPI"
          ? effectiveUpiMode === "QR"
            ? "UPI QR"
            : `UPI (${vpa.trim()})`
          : method === "CARD"
            ? `Card •••• ${cardPan.replace(/\s/g, "").slice(-4)}`
            : method === "WALLET"
              ? `Wallet (${selectedWallet})`
              : method === "EMI"
                ? `EMI (${selectedEmiProvider} • ${selectedEmiTenure}m)`
                : `Net Banking (${selectedBank})`;

      if (method === "UPI" && effectiveUpiMode === "VPA") {
        const err = validateUpiVpa(vpa);
        if (err) {
          setErrorMessage(err);
          return;
        }
      } else if (method === "CARD") {
        const err = validateCardForm(cardPan, cardExpiry, cardCvv, cardHolder);
        if (err) {
          setErrorMessage(err);
          return;
        }
      }

      inFlightRef.current = true;
      setStatus("PROCESSING");
      setStatusMessage("Connecting to Mantu Gateway…");

      try {
        if (options.onPay) {
          const telemetry = {
            device_id: getOrCreateDeviceId(),
            ip_country: "IN",
            billing_country: options.order?.customer_country || "IN",
          };
          let payReq: PayRequest;
          if (method === "UPI") {
            payReq = {
              method: "UPI",
              vpa: effectiveUpiMode === "QR" ? "qrpay@upi" : vpa.trim(),
              ...telemetry,
            };
          } else if (method === "NETBANKING") {
            payReq = {
              method: "NETBANKING",
              bank: selectedBank,
              ...telemetry,
            };
          } else if (method === "WALLET") {
            payReq = {
              method: "UPI",
              vpa: `${selectedWallet.replace(/[^a-z0-9]/gi, "")}@upi`,
              ...telemetry,
            };
          } else if (method === "EMI") {
            payReq = {
              method: "NETBANKING",
              bank: selectedEmiProvider === "bajaj" ? "HDFC" : selectedEmiProvider,
              ...telemetry,
            };
          } else {
            const [mm, yy] = cardExpiry.split("/");
            payReq = {
              method: "CARD",
              pan: cardPan.replace(/\s/g, ""),
              cvv: cardCvv,
              expiry_month: Number(mm),
              expiry_year: 2000 + Number(yy),
              card_holder_name: cardHolder.trim() || "Customer",
              ...telemetry,
            };
          }

          setStatusMessage("Authorizing transaction via Mantu Gateway…");
          let updatedOrder = await options.onPay(payReq);
          let latestStatus = updatedOrder.latest_payment?.status || "";

          if (options.onPollOrder) {
            const maxAttempts = 15;
            for (
              let attempt = 0;
              attempt < maxAttempts &&
              updatedOrder.status !== "PAID" &&
              updatedOrder.status !== "PAYMENT_FAILED" &&
              (isPendingStatus(latestStatus) || latestStatus === "CREATED" || latestStatus === "CAPTURING");
              attempt++
            ) {
              setStatusMessage("Confirming payment with bank…");
              await new Promise((r) => setTimeout(r, 1500));
              updatedOrder = await options.onPollOrder();
              latestStatus = updatedOrder.latest_payment?.status || "";
            }
          }

          applyOrderOutcome(updatedOrder, methodLabel);
          return;
        }

        const isFraudTest =
          (method === "UPI" && effectiveUpiMode === "VPA" && vpa.toLowerCase().includes("fraud")) ||
          (method === "CARD" && cardPan.replace(/\s/g, "").endsWith("9999"));
        const isDeclineTest = method === "CARD" && cardPan.replace(/\s/g, "") === "4000000000000002";
        const isExpiredTest = method === "CARD" && cardPan.replace(/\s/g, "") === "4000000000000069";

        await new Promise((r) => setTimeout(r, 650));

        if (isExpiredTest) {
          setStatus("FAILED");
          setErrorMessage("This card has expired. Please use a valid card.");
          return;
        }
        if (isDeclineTest) {
          setStatus("FAILED");
          setErrorMessage("Card declined by the issuing bank. Please try another card.");
          return;
        }
        if (isFraudTest) {
          setStatus("FAILED");
          setErrorMessage("Transaction declined by Mantu Risk Engine.");
          return;
        }

        setStatusMessage("Confirming payment with bank…");
        await new Promise((r) => setTimeout(r, 750));

        const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
        const signature = generateDemoSignature(options.order_id, paymentId);

        setCreatedPaymentId(paymentId);
        setLastMethodLabel(methodLabel);
        setStatus("SUCCESS");
        setStatusMessage("Payment authorized successfully!");

        window.setTimeout(() => {
          onClose();
          options.handler({
            mantu_payment_id: paymentId,
            mantu_order_id: options.order_id,
            mantu_signature: signature,
            razorpay_payment_id: paymentId,
            razorpay_order_id: options.order_id,
            razorpay_signature: signature,
          });
        }, 2200);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Payment failed. Please try another method.";
        setStatus("FAILED");
        setErrorMessage(message);
      } finally {
        inFlightRef.current = false;
      }
    },
    [
      upiMode,
      vpa,
      cardPan,
      cardExpiry,
      cardCvv,
      cardHolder,
      selectedBank,
      options,
      applyOrderOutcome,
      onClose,
    ],
  );

  const checkPendingStatus = useCallback(async () => {
    if (!options.onPollOrder || inFlightRef.current) return;
    inFlightRef.current = true;
    showToast("Checking latest payment status…", "info");
    try {
      const updated = await options.onPollOrder();
      applyOrderOutcome(updated, lastMethodLabel);
    } catch {
      showToast("Unable to refresh status right now", "error");
    } finally {
      inFlightRef.current = false;
    }
  }, [options, applyOrderOutcome, lastMethodLabel, showToast]);

  const finishAndReturn = useCallback(() => {
    onClose();
    if (latestOrder && options.onComplete) {
      options.onComplete(latestOrder);
    }
  }, [onClose, latestOrder, options]);

  const retryPayment = useCallback(() => {
    setStatus("INPUT");
    setErrorMessage(null);
  }, []);

  const switchPaymentMethod = useCallback(() => {
    setStatus("INPUT");
    setErrorMessage(null);
    setNavMethod((prev) => (prev === "CARD" ? "UPI" : "CARD"));
  }, []);

  const handleDismiss = useCallback(() => {
    if (status === "PROCESSING") return;
    options.modal?.ondismiss?.();
    onClose();
  }, [status, options.modal, onClose]);

  return {
    navMethod,
    selectNavMethod,
    status,
    statusMessage,
    errorMessage,
    createdPaymentId,
    lastMethodLabel,
    completedAt,
    latestOrder,
    toast,
    showToast,
    upiMode,
    setUpiMode,
    selectedUpiApp,
    setSelectedUpiApp,
    vpa,
    handleVpaChange,
    verifyingVpa,
    vpaVerifiedName,
    handleVerifyVpa,
    qrTimer,
    cardPan,
    setCardPan: (val: string) => setCardPan(formatCardNumber(val)),
    cardExpiry,
    setCardExpiry: (val: string) => setCardExpiry(formatExpiryInput(val)),
    cardCvv,
    setCardCvv: (val: string) => setCardCvv(val.replace(/\D/g, "").slice(0, 4)),
    cardHolder,
    setCardHolder,
    saveCard,
    setSaveCard,
    selectedBank,
    setSelectedBank,
    bankSearch,
    setBankSearch,
    selectedWallet,
    setSelectedWallet,
    selectedEmiProvider,
    setSelectedEmiProvider,
    selectedEmiTenure,
    setSelectedEmiTenure,
    copyText,
    executePayment,
    checkPendingStatus,
    finishAndReturn,
    retryPayment,
    switchPaymentMethod,
    handleDismiss,
  };
}

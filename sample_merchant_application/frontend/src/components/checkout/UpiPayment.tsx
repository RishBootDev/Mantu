import { formatAmount } from "../../format";
import { UpiAppLogo } from "./BrandLogos";
import { UPI_APPS } from "./checkoutConstants";

interface Props {
  amount: number;
  currency: string;
  upiMode: "QR" | "VPA";
  onChangeMode: (mode: "QR" | "VPA") => void;
  selectedApp: string;
  onSelectApp: (id: string) => void;
  vpa: string;
  onChangeVpa: (vpa: string) => void;
  verifyingVpa: boolean;
  vpaVerifiedName: string | null;
  onVerifyVpa: () => void;
  onCopyVpa: () => void;
  qrTimer: number;
  errorMessage: string | null;
  onPay: () => void;
}

const QR_SIZE = 25;

function isFinderCell(r: number, c: number): boolean {
  const inTopLeft = r < 7 && c < 7;
  const inTopRight = r < 7 && c >= QR_SIZE - 7;
  const inBottomLeft = r >= QR_SIZE - 7 && c < 7;
  if (!inTopLeft && !inTopRight && !inBottomLeft) return false;
  const lr = r >= QR_SIZE - 7 ? r - (QR_SIZE - 7) : r;
  const lc = c >= QR_SIZE - 7 ? c - (QR_SIZE - 7) : c;
  return (
    lr === 0 ||
    lr === 6 ||
    lc === 0 ||
    lc === 6 ||
    (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)
  );
}

function isQuietZone(r: number, c: number): boolean {
  return (r < 8 && c < 8) || (r < 8 && c >= QR_SIZE - 8) || (r >= QR_SIZE - 8 && c < 8);
}

function isAlignmentCell(r: number, c: number): boolean {
  if (r >= 16 && r <= 20 && c >= 16 && c <= 20) {
    const dr = r - 18;
    const dc = c - 18;
    return Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
  }
  return false;
}

const QR_CELLS: Array<{ r: number; c: number }> = (() => {
  const cells: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      if (r >= 10 && r <= 14 && c >= 10 && c <= 14) continue;
      if (isFinderCell(r, c)) {
        cells.push({ r, c });
        continue;
      }
      if (isQuietZone(r, c)) continue;
      if (r >= 16 && r <= 20 && c >= 16 && c <= 20) {
        if (isAlignmentCell(r, c)) cells.push({ r, c });
        continue;
      }
      if ((r === 6 && c % 2 === 0) || (c === 6 && r % 2 === 0)) {
        cells.push({ r, c });
        continue;
      }
      const hash = (r * 31 + c * 17 + r * c * 7) % 11;
      if (hash === 0 || hash === 2 || hash === 3 || hash === 5 || hash === 8) {
        cells.push({ r, c });
      }
    }
  }
  return cells;
})();

export function UpiPayment({
  amount,
  currency,
  upiMode,
  onChangeMode,
  selectedApp,
  onSelectApp,
  vpa,
  onChangeVpa,
  verifyingVpa,
  vpaVerifiedName,
  onVerifyVpa,
  onCopyVpa,
  qrTimer,
  errorMessage,
  onPay,
}: Props) {
  const minutes = Math.floor(qrTimer / 60);
  const seconds = qrTimer % 60;
  const timeStr = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="mc-panel">
      <div className="mc-panel-body">
        <div>
          <h3 className="mc-panel-heading">UPI Payment</h3>
          <p className="mc-panel-sub">Scan QR code or pay using your UPI ID</p>
        </div>

        {errorMessage && (
          <div className="mc-inline-error" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mc-seg" role="tablist" aria-label="UPI mode">
          <button
            type="button"
            role="tab"
            aria-selected={upiMode === "QR"}
            className={`mc-seg-btn ${upiMode === "QR" ? "active" : ""}`}
            onClick={() => onChangeMode("QR")}
          >
            Scan QR Code
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={upiMode === "VPA"}
            className={`mc-seg-btn ${upiMode === "VPA" ? "active" : ""}`}
            onClick={() => onChangeMode("VPA")}
          >
            Enter UPI ID
          </button>
        </div>

        <div className="mc-upi-apps" aria-label="Popular UPI apps">
          {UPI_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              className={`mc-upi-app-btn ${selectedApp === app.id ? "selected" : ""}`}
              onClick={() => onSelectApp(app.id)}
            >
              <UpiAppLogo id={app.id} size={26} />
              <span>{app.name}</span>
            </button>
          ))}
        </div>

        {upiMode === "QR" ? (
          <div className="mc-qr-card">
            <div className="mc-qr-frame">
              <svg width="144" height="144" viewBox="-2 -2 29 29" aria-label="UPI QR code">
                <rect x="-2" y="-2" width="29" height="29" fill="#ffffff" />
                {QR_CELLS.map(({ r, c }) => (
                  <rect
                    key={`${r}-${c}`}
                    x={c}
                    y={r}
                    width="0.92"
                    height="0.92"
                    rx="0.2"
                    fill="#0f172a"
                  />
                ))}
                <rect x="9.5" y="9.5" width="6" height="6" rx="1.2" fill="#ffffff" />
                <rect x="10.1" y="10.1" width="4.8" height="4.8" rx="1" fill="#1d4ed8" />
                <text
                  x="12.5"
                  y="13.8"
                  fill="#ffffff"
                  fontSize="3.4"
                  fontWeight="800"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  M
                </text>
              </svg>
            </div>
            <div style={{ fontSize: "12px", color: "#475569", marginTop: "10px" }}>
              Scan with any UPI app to pay {formatAmount(amount, currency)}
            </div>
            <div style={{ fontSize: "11px", color: "#b45309", marginTop: "3px", fontWeight: 600 }}>
              QR expires in {timeStr}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="mc-input-group">
              <div className="mc-label-row">
                <label htmlFor="mc-upi-vpa" className="mc-label">
                  UPI ID / VPA
                </label>
                <button
                  type="button"
                  className="mc-copy-btn"
                  onClick={onCopyVpa}
                  disabled={!vpa.trim()}
                >
                  Copy UPI ID
                </button>
              </div>
              <div className="mc-input-wrap">
                <input
                  id="mc-upi-vpa"
                  type="text"
                  className="mc-input"
                  value={vpa}
                  onChange={(e) => onChangeVpa(e.target.value)}
                  placeholder="e.g. name@okicici"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="mc-verify-btn"
                  onClick={onVerifyVpa}
                  disabled={verifyingVpa}
                >
                  {verifyingVpa ? "Checking…" : "Verify"}
                </button>
              </div>
            </div>

            {vpaVerifiedName && (
              <div>
                <span className="mc-verified-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Verified: {vpaVerifiedName}
                </span>
              </div>
            )}

            <div className="mc-chips">
              <span style={{ fontSize: "11px", color: "#64748b" }}>Test IDs:</span>
              <button type="button" className="mc-chip" onClick={() => onChangeVpa("asha@upi")}>
                asha@upi (Success)
              </button>
              <button type="button" className="mc-chip danger" onClick={() => onChangeVpa("fraud@upi")}>
                fraud@upi (Risk Block)
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mc-pay-footer">
        <button type="button" className="mc-pay-btn" onClick={onPay}>
          Continue to Pay {formatAmount(amount, currency)}
        </button>
        <div className="mc-terms">Instant confirmation via Mantu UPI switch</div>
      </div>
    </div>
  );
}

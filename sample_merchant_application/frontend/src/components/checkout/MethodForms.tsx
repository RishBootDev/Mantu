import type { ChangeEvent } from "react";
import Field from "./Field";

export type Errors = Record<string, string>;

export interface CardState { pan: string; month: string; year: string; cvv: string; holder: string }
export interface UpiState { vpa: string }
export interface BankState { bank: string }

export const BANKS = [
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICICI", name: "ICICI Bank" },
  { code: "SBI", name: "State Bank of India" },
  { code: "AXIS", name: "Axis Bank" },
  { code: "KOTAK", name: "Kotak Mahindra Bank" },
];

export function CardForm({ value, onChange, errors, disabled }: {
  value: CardState; onChange: (v: CardState) => void; errors: Errors; disabled: boolean;
}) {
  const set = (k: keyof CardState) => (e: ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <fieldset disabled={disabled} className="method-fields">
      <Field label="Card number" name="pan" inputMode="numeric" autoComplete="cc-number" placeholder="4111 1111 1111 1111"
        value={value.pan} onChange={set("pan")} error={errors.pan} maxLength={23} />
      <div className="row">
        <Field label="Expiry month" name="expiry_month" inputMode="numeric" autoComplete="cc-exp-month" placeholder="MM"
          value={value.month} onChange={set("month")} error={errors.expiry_month} maxLength={2} />
        <Field label="Expiry year" name="expiry_year" inputMode="numeric" autoComplete="cc-exp-year" placeholder="YYYY"
          value={value.year} onChange={set("year")} error={errors.expiry_year} maxLength={4} />
        <Field label="CVV" name="cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="123"
          value={value.cvv} onChange={set("cvv")} error={errors.cvv} maxLength={4} />
      </div>
      <Field label="Name on card" name="card_holder_name" autoComplete="cc-name"
        value={value.holder} onChange={set("holder")} error={errors.card_holder_name} />
      <p className="muted small">
        Demo only: card details go to the store server for one-time vault tokenization and are never stored.
      </p>
    </fieldset>
  );
}

export function UpiForm({ value, onChange, errors, disabled }: {
  value: UpiState; onChange: (v: UpiState) => void; errors: Errors; disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="method-fields">
      <Field label="UPI ID" name="vpa" placeholder="name@bank" autoComplete="off" autoCapitalize="none"
        value={value.vpa} onChange={(e) => onChange({ vpa: e.target.value })} error={errors.vpa} />
    </fieldset>
  );
}

export function NetBankingForm({ value, onChange, errors, disabled }: {
  value: BankState; onChange: (v: BankState) => void; errors: Errors; disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="method-fields">
      <div className={`field${errors.bank ? " has-error" : ""}`}>
        <label htmlFor="f-bank">Bank</label>
        <select id="f-bank" value={value.bank} onChange={(e) => onChange({ bank: e.target.value })} aria-invalid={!!errors.bank}>
          <option value="">Select your bank</option>
          {BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select>
        {errors.bank && <p className="field-error">{errors.bank}</p>}
      </div>
    </fieldset>
  );
}

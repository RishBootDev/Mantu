import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Field({ label, error, id, ...rest }: Props) {
  const fid = id ?? `f-${rest.name}`;
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={fid}>{label}</label>
      <input id={fid} aria-invalid={!!error} aria-describedby={error ? `${fid}-err` : undefined} {...rest} />
      {error && <p id={`${fid}-err`} className="field-error">{error}</p>}
    </div>
  );
}

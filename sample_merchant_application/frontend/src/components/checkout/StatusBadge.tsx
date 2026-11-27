import { STATUS_LABEL, isPendingStatus, isSuccessStatus } from "../../format";

export default function StatusBadge({ status }: { status: string }) {
  const tone = isSuccessStatus(status) || status === "PAID" ? "ok" : isPendingStatus(status) || status === "PENDING_PAYMENT" ? "wait" : "bad";
  return <span className={`badge badge-${tone}`}>{STATUS_LABEL[status] ?? status}</span>;
}

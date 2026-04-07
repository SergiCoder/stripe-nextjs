import { Badge } from "../atoms/Badge";

const statusVariant = {
  active: "success",
  trialing: "info",
  past_due: "warning",
  canceled: "error",
  unpaid: "error",
  incomplete: "warning",
} as const;

export interface SubscriptionCardProps {
  eyebrowLabel?: string;
  planName: string;
  status: keyof typeof statusVariant;
  statusLabel: string;
  interval?: string;
  price?: string;
  currentPeriodEnd?: string;
  periodEndLabel?: string;
  cancelAtPeriodEnd: boolean;
  cancelLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SubscriptionCard({
  eyebrowLabel,
  planName,
  status,
  statusLabel,
  interval,
  price,
  currentPeriodEnd,
  periodEndLabel,
  cancelAtPeriodEnd,
  cancelLabel,
  actions,
  className = "",
}: SubscriptionCardProps) {
  const showPrice = Boolean(price);
  const showPeriodEnd = Boolean(currentPeriodEnd && periodEndLabel);
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          {eyebrowLabel && (
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {eyebrowLabel}
            </p>
          )}
          <h3 className="mt-1 text-lg font-semibold text-gray-900">
            {planName}
          </h3>
          {showPrice && (
            <p className="mt-1 text-sm text-gray-500">
              {price}
              {interval ? `/${interval}` : ""}
            </p>
          )}
        </div>
        <Badge variant={statusVariant[status]}>{statusLabel}</Badge>
      </div>

      {showPeriodEnd && (
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">{periodEndLabel}</dt>
            <dd className="font-medium text-gray-900">{currentPeriodEnd}</dd>
          </div>
        </dl>
      )}

      {cancelAtPeriodEnd && cancelLabel && (
        <p className="mt-4 text-sm text-yellow-700">{cancelLabel}</p>
      )}

      {actions && <div className="mt-6 flex gap-3">{actions}</div>}
    </div>
  );
}

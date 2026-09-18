import { cn } from "@/lib/utils";

export type MembershipStatus =
  | "active"
  | "frozen"
  | "pending"
  | "overdue"
  | "expired"
  | "cancelled";

const STATUS_STYLES: Record<MembershipStatus, string> = {
  active: "bg-status-active text-status-active-foreground",
  frozen: "bg-status-frozen text-status-frozen-foreground",
  pending: "bg-status-pending text-status-pending-foreground",
  overdue: "bg-status-overdue text-status-overdue-foreground",
  expired: "bg-status-expired text-status-expired-foreground",
  cancelled: "bg-status-expired text-status-expired-foreground",
};

export function StatusBadge({ status }: { status: MembershipStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

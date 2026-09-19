"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  StatusBadge,
  type MembershipStatus as BadgeStatus,
} from "@/components/status-badge";
import { membershipsService } from "@/modules/memberships";
import type { IMyMembership } from "@/modules/memberships";
import { useAuth } from "@/shared/auth/auth-context";
import { memberHomeStyles as styles } from "./member-home.styles";

const DURATION_LABEL: Record<string, string> = {
  MONTHLY: "month",
  QUARTERLY: "quarter",
  ANNUAL: "year",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MemberHomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<IMyMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    membershipsService
      .getMine()
      .then((result) => setData(result ?? null))
      .finally(() => setIsLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div>
      <h1 className={styles.greeting}>Welcome, {user.name}</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            You don&apos;t have a membership yet. Ask the front desk to get
            you set up.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className={styles.cardHeader}>
            <div>
              <div className={styles.planName}>{data.membership.plan.name}</div>
              <div className={styles.price}>
                ${data.membership.plan.price} / {DURATION_LABEL[data.membership.plan.duration]}
              </div>
            </div>
            <StatusBadge
              status={data.membership.status.toLowerCase() as BadgeStatus}
            />
          </CardHeader>
          <CardContent>
            <div className={styles.detailGrid}>
              <div>
                <div className={styles.detailLabel}>Start date</div>
                <div className={styles.detailValue}>
                  {formatDate(data.membership.startDate)}
                </div>
              </div>
              <div>
                <div className={styles.detailLabel}>Renews / ends</div>
                <div className={styles.detailValue}>
                  {formatDate(data.membership.endDate)}
                </div>
              </div>
              {data.membership.frozenUntil && (
                <div>
                  <div className={styles.detailLabel}>Frozen until</div>
                  <div className={styles.detailValue}>
                    {formatDate(data.membership.frozenUntil)}
                  </div>
                </div>
              )}
            </div>

            {data.membership.plan.features.length > 0 && (
              <ul className={styles.featuresList}>
                {data.membership.plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            )}

            {data.isDependent && data.owner && (
              <p className={styles.ownerNote}>
                You&apos;re on {data.owner.name}&apos;s family plan.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

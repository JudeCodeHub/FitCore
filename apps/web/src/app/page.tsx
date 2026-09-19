"use client";

import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/shared/auth/auth-context";
import { RequireAuth } from "@/shared/auth/require-auth";

function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AppShell role={user.role} userName={user.name} activeHref="/">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Active Members</CardDescription>
            <CardTitle className="text-3xl font-mono tabular-nums">
              0
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status="active" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Frozen Memberships</CardDescription>
            <CardTitle className="text-3xl font-mono tabular-nums">
              0
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status="frozen" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Overdue Payments</CardDescription>
            <CardTitle className="text-3xl font-mono tabular-nums">
              0
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status="overdue" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

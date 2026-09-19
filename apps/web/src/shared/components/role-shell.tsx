"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/shared/auth/auth-context";
import { RequireAuth } from "@/shared/auth/require-auth";
import type { UserRole } from "@/shared/auth/types";

function ShellWithUser({
  role,
  activeHref,
  children,
}: {
  role: UserRole;
  activeHref: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AppShell role={role} userName={user.name} activeHref={activeHref}>
      {children}
    </AppShell>
  );
}

/** Guards a route section to one role and wraps it in the AppShell. */
export function RoleShell({
  role,
  activeHref,
  children,
}: {
  role: UserRole;
  activeHref: string;
  children: ReactNode;
}) {
  return (
    <RequireAuth roles={[role]}>
      <ShellWithUser role={role} activeHref={activeHref}>
        {children}
      </ShellWithUser>
    </RequireAuth>
  );
}

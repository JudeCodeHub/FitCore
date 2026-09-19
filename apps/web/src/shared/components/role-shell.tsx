"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/shared/auth/auth-context";
import { RequireAuth } from "@/shared/auth/require-auth";
import type { UserRole } from "@/shared/auth/types";

function ShellWithUser({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  return (
    <AppShell role={role} userName={user.name} activeHref={pathname}>
      {children}
    </AppShell>
  );
}

/** Guards a route section to one role and wraps it in the AppShell.
 * The sidebar's active item is derived from the current URL automatically. */
export function RoleShell({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  return (
    <RequireAuth roles={[role]}>
      <ShellWithUser role={role}>{children}</ShellWithUser>
    </RequireAuth>
  );
}

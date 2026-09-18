import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { UserRole } from "@/lib/nav-config";

export function AppShell({
  role,
  userName,
  title,
  activeHref,
  children,
}: {
  role: UserRole;
  userName: string;
  title?: string;
  activeHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} activeHref={activeHref} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar role={role} userName={userName} title={title} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

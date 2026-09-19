import { RoleShell } from "@/shared/components/role-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShell role="ADMIN">
      {children}
    </RoleShell>
  );
}

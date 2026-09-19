import { RoleShell } from "@/shared/components/role-shell";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShell role="MEMBER" activeHref="/member">
      {children}
    </RoleShell>
  );
}

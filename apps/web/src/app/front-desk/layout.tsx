import { RoleShell } from "@/shared/components/role-shell";

export default function FrontDeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShell role="FRONT_DESK" activeHref="/front-desk">
      {children}
    </RoleShell>
  );
}

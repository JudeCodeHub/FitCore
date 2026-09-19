import { RoleShell } from "@/shared/components/role-shell";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShell role="TRAINER">
      {children}
    </RoleShell>
  );
}

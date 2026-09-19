import { RoleShell } from "@/shared/components/role-shell";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShell role="TRAINER" activeHref="/trainer">
      {children}
    </RoleShell>
  );
}

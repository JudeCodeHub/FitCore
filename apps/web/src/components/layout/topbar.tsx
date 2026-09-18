import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABEL, type UserRole } from "@/lib/nav-config";

export function Topbar({
  role,
  userName,
  title,
}: {
  role: UserRole;
  userName: string;
  title?: string;
}) {
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h1 className="truncate text-sm font-medium text-foreground">
        {title ?? ROLE_LABEL[role]}
      </h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{userName}</span>
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

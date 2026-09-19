import Link from "next/link";
import { NAV_BY_ROLE, ROLE_LABEL, type UserRole } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

/** Picks the most specific nav item matching the current path (e.g. on
 * "/admin/plans/5", "/admin/plans" wins over the shorter "/admin"). */
function findActiveHref(pathname: string, hrefs: string[]): string | undefined {
  const matches = hrefs.filter(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return matches.sort((a, b) => b.length - a.length)[0];
}

export function Sidebar({
  role,
  activeHref,
  className,
}: {
  role: UserRole;
  activeHref?: string;
  className?: string;
}) {
  const items = NAV_BY_ROLE[role];
  const resolvedActiveHref = activeHref
    ? findActiveHref(activeHref, items.map((item) => item.href))
    : undefined;

  return (
    <aside
      className={cn(
        "flex h-full w-60 flex-col border-r bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="font-heading text-lg font-semibold tracking-tight">
          FitCore
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              resolvedActiveHref === item.href &&
                "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
        {ROLE_LABEL[role]} view
      </div>
    </aside>
  );
}

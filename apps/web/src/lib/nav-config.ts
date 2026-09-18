export type UserRole = "ADMIN" | "TRAINER" | "FRONT_DESK" | "MEMBER";

export type NavItem = {
  label: string;
  href: string;
};

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: "Overview", href: "/admin" },
    { label: "Members", href: "/admin/members" },
    { label: "Plans", href: "/admin/plans" },
    { label: "Classes", href: "/admin/classes" },
    { label: "Staff", href: "/admin/staff" },
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Settings", href: "/admin/settings" },
  ],
  TRAINER: [
    { label: "My Classes", href: "/trainer" },
    { label: "My Members", href: "/trainer/members" },
    { label: "Availability", href: "/trainer/availability" },
    { label: "PT Sessions", href: "/trainer/sessions" },
  ],
  FRONT_DESK: [
    { label: "Check-In", href: "/front-desk" },
    { label: "Member Lookup", href: "/front-desk/members" },
    { label: "Walk-In Sale", href: "/front-desk/sales" },
  ],
  MEMBER: [
    { label: "Dashboard", href: "/member" },
    { label: "Classes", href: "/member/classes" },
    { label: "Membership", href: "/member/membership" },
    { label: "Progress", href: "/member/progress" },
    { label: "Invoices", href: "/member/invoices" },
  ],
};

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Admin",
  TRAINER: "Trainer",
  FRONT_DESK: "Front Desk",
  MEMBER: "Member",
};

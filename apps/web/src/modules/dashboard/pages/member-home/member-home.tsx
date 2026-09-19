"use client";

import { EmptyDashboardHome } from "@/modules/dashboard/components/empty-dashboard-home";
import { useAuth } from "@/shared/auth/auth-context";

export function MemberHomePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <EmptyDashboardHome greetingName={user.name} roleLabel="Member" />;
}

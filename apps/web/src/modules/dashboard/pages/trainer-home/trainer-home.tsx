"use client";

import { WeeklyTimetable } from "@/modules/classes";
import { useAuth } from "@/shared/auth/auth-context";

export function TrainerHomePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <WeeklyTimetable trainerId={user.id} />;
}

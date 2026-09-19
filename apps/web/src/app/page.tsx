"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROLE_HOME } from "@/lib/nav-config";
import { useAuth } from "@/shared/auth/auth-context";

export default function Home() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [status, user, router]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

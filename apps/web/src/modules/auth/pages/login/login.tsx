"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthSplitLayout } from "@/modules/auth/components/auth-split-layout";
import { ApiError } from "@/shared/api-client/http";
import { useAuth } from "@/shared/auth/auth-context";
import { ROLE_HOME } from "@/lib/nav-config";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginStyles as styles } from "./login.styles";

export function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      router.push(ROLE_HOME[user.role]);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      eyebrow="Welcome back"
      headline="Run your gym from one dashboard."
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Log in</h1>
        <p className={styles.subtitle}>Enter your details to continue.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className={styles.footer}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" className={styles.footerLink}>
          Sign up
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

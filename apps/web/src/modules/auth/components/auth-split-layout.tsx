import type { ReactNode } from "react";

export function AuthSplitLayout({
  eyebrow,
  headline,
  children,
}: {
  eyebrow: string;
  headline: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_var(--primary)_0%,_transparent_45%)] opacity-20" />
        <span className="relative font-heading text-lg font-semibold tracking-tight">
          FitCore
        </span>
        <div className="relative space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            {eyebrow}
          </p>
          <h1 className="max-w-sm font-heading text-4xl font-semibold leading-tight tracking-tight">
            {headline}
          </h1>
        </div>
        <p className="relative text-xs text-sidebar-foreground/60">
          Gym management, end to end.
        </p>
      </div>
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm animate-in fade-in duration-500">
          {children}
        </div>
      </div>
    </div>
  );
}

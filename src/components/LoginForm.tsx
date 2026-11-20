"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import type { ActionState } from "@/lib/types";

interface LoginFormProps {
  nextPath?: string;
}

const INITIAL_STATE: ActionState = { status: "idle" };

export function LoginForm({ nextPath = "/admin" }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_STATE
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={nextPath} />

      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="border border-danger/35 bg-danger/8 px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </div>
      )}

      <div>
        <label
          htmlFor="admin-password"
          className="block font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted"
        >
          Admin Password
        </label>
        <div className="relative mt-2">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoFocus
            autoComplete="current-password"
            placeholder="Enter ADMIN_PASSWORD"
            className="w-full border border-line-strong bg-canvas px-3.5 py-2.5 pr-16 text-sm text-ink placeholder:text-ink-muted/55 focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted hover:text-ink"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {state.fieldErrors?.password && (
          <p className="mt-1.5 text-xs text-danger">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <button
        id="login-submit"
        type="submit"
        disabled={isPending}
        className="w-full bg-ink px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing In..." : "Sign In to Admin Dashboard"}
      </button>
    </form>
  );
}

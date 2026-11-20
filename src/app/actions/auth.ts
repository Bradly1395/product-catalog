"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/auth";
import type { ActionState } from "@/lib/types";

function getSafeRedirectPath(rawNext: FormDataEntryValue | null): string {
  if (typeof rawNext !== "string") return "/admin";
  if (rawNext.startsWith("/") && !rawNext.startsWith("//")) {
    return rawNext;
  }
  return "/admin";
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!isAdminPasswordConfigured()) {
    return {
      status: "error",
      message:
        "ADMIN_PASSWORD is not configured on the server. Set it in your .env.local file and restart.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return {
      status: "error",
      message: "Please enter the admin password.",
      fieldErrors: { password: "Password is required." },
    };
  }

  if (!verifyAdminPassword(password)) {
    return {
      status: "error",
      message: "Incorrect password. Please try again.",
      fieldErrors: { password: "Invalid credentials." },
    };
  }

  await createAdminSession();
  const nextPath = getSafeRedirectPath(formData.get("next"));
  redirect(nextPath);
}

export async function logoutAction(): Promise<void> {
  await clearAdminSession();
  redirect("/login");
}

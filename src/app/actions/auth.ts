"use server";

import { redirect } from "next/navigation";
import {
  createFirstAdmin,
  loginWithCredentials,
  logoutCurrentUser,
} from "@/lib/auth/users";

export type AuthFormState = {
  error?: string;
};

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const result = await loginWithCredentials(email, password);
  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function setupAdminAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match" };
  }

  const result = await createFirstAdmin({ name, email, password });
  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await logoutCurrentUser();
  redirect("/login");
}

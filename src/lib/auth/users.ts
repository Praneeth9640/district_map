import { connectToDatabase } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
  type SessionUser,
} from "@/lib/auth/session";
import { User } from "@/models/User";
import { toId } from "@/lib/mongo";

export async function countUsers(): Promise<number> {
  await connectToDatabase();
  return User.countDocuments();
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  await connectToDatabase();
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return {
    id: toId(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function loginWithCredentials(email: string, password: string) {
  const user = await authenticateUser(email, password);
  if (!user) {
    return { ok: false as const, error: "Invalid email or password" };
  }
  const token = await createSessionToken(user);
  await setSessionCookie(token);
  return { ok: true as const, user };
}

export async function logoutCurrentUser() {
  await clearSessionCookie();
}

/**
 * Create the first admin account (only when no users exist).
 * Password is hashed and stored in MongoDB — never stored in plain text.
 */
export async function createFirstAdmin(input: {
  name: string;
  email: string;
  password: string;
}) {
  await connectToDatabase();
  const existingCount = await User.countDocuments();
  if (existingCount > 0) {
    return { ok: false as const, error: "Admin already exists. Please sign in." };
  }

  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();
  const password = input.password;

  if (!name || !email || password.length < 8) {
    return {
      ok: false as const,
      error: "Name, email, and a password of at least 8 characters are required.",
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "ADMIN",
  });

  const sessionUser: SessionUser = {
    id: toId(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  };
  const token = await createSessionToken(sessionUser);
  await setSessionCookie(token);

  return { ok: true as const, user: sessionUser };
}

/**
 * Upsert admin from env (optional). Used by `npm run db:seed-admin`.
 * Updates password hash in MongoDB when the email already exists.
 */
export async function upsertAdminFromEnv() {
  await connectToDatabase();
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !password) {
    return {
      ok: false as const,
      error: "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.",
    };
  }
  if (password.length < 8) {
    return {
      ok: false as const,
      error: "ADMIN_PASSWORD must be at least 8 characters.",
    };
  }

  const passwordHash = await hashPassword(password);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = "ADMIN";
    await existing.save();
    return {
      ok: true as const,
      created: false,
      email: existing.email,
      id: toId(existing._id),
    };
  }

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "ADMIN",
  });

  return {
    ok: true as const,
    created: true,
    email: user.email,
    id: toId(user._id),
  };
}

/** Remove demo/default users if present (one-time cleanup). */
export async function removeDemoUsers() {
  await connectToDatabase();
  const result = await User.deleteMany({
    email: { $in: ["admin@districtmap.local"] },
  });
  return result.deletedCount ?? 0;
}

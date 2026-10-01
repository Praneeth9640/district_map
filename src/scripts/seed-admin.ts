import { upsertAdminFromEnv, removeDemoUsers } from "@/lib/auth/users";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvFile();

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  const removed = await removeDemoUsers();
  if (removed > 0) {
    console.log(`Removed ${removed} demo user(s).`);
  }

  const result = await upsertAdminFromEnv();
  if (!result.ok) {
    console.error(result.error);
    console.error(
      "Add your own credentials to .env:\n  ADMIN_EMAIL=you@example.com\n  ADMIN_PASSWORD=your-secure-password\n  ADMIN_NAME=Your Name",
    );
    process.exit(1);
  }

  console.log(
    result.created
      ? `Admin created in MongoDB: ${result.email}`
      : `Admin password updated in MongoDB: ${result.email}`,
  );
  console.log("Password is stored as a hash only — not plain text.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

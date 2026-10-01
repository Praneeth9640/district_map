import { MapPinned } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { SetupAdminForm } from "@/components/auth/SetupAdminForm";
import { getSession } from "@/lib/auth/session";
import { countUsers } from "@/lib/auth/users";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const userCount = await countUsers();
  const needsSetup = userCount === 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fafaf9,_#f5f5f4_40%,_#e7e5e4)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white/95 p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900 text-white">
            <MapPinned className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            District Location Mapper
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {needsSetup
              ? "Create your admin account. Credentials are stored securely in MongoDB."
              : "Sign in with your account."}
          </p>
        </div>

        {needsSetup ? <SetupAdminForm /> : <LoginForm />}
      </div>
    </div>
  );
}

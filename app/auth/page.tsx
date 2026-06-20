import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="min-h-[calc(100vh-var(--topbar-h))] bg-black px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-var(--topbar-h)-3rem)] max-w-[1180px] items-center justify-center">
        <AuthForm />
      </div>
    </main>
  );
}

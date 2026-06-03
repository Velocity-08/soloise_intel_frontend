import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#FAFAFA] px-6 py-10">
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <AuthForm />
      </div>
    </main>
  );
}

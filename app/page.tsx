import { auth, signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Argus
        </h1>
        
        {session?.user ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-zinc-600 dark:text-zinc-400">
              Signed in as {session.user.email || session.user.name}
            </p>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button type="submit" variant="outline">
                Sign Out
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-zinc-600 dark:text-zinc-400">
              Not signed in
            </p>
            <form
              action={async () => {
                "use server";
                await signIn("github");
              }}
            >
              <Button type="submit">
                Sign in with GitHub
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

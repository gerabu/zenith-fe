import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { SlotGrid } from "./SlotGrid";

export default function OnboardingSignInPage() {
  async function handleGoogleSignIn() {
    "use server";
    await signIn("google", { redirectTo: "/onboarding/connect-calendar" });
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <SlotGrid />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border bg-card p-8">
        {/* Brand */}
        <div className="mb-8">
          <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Zenith
          </span>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-foreground">
            Book time.
            <br />
            Own your day.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Shared scheduling with zero conflicts — your calendar, your rules.
          </p>
        </div>

        <div className="mb-6 h-px w-full bg-border" />

        {/* Sign-in */}
        <form action={handleGoogleSignIn}>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-foreground text-background hover:bg-foreground/90"
          >
            <GoogleIcon />
            Sign in with Google
          </Button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
          By signing in you agree that Zenith can check for calendar conflicts
          on your behalf.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
